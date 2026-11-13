import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { Invoice, InvoiceStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { parsePdfInvoice } from '@/utils/pdfExtractor';
import { triggerCashFlowWebhookForUser } from './cashflow';
import {
  fetchUserInvoicesFromSupabase,
  markInvoiceAsPaidInSupabase,
  updateInvoiceStatusInSupabase,
  deleteInvoiceFromSupabase,
  registerUploadedInvoice,
  getCurrentUserEmail,
} from './supabase';

export const INVOICE_UPLOAD_WEBHOOK_URL =
  import.meta.env.VITE_INVOICE_UPLOAD_WEBHOOK_URL ||
  'https://api.agents.snsihub.ai/webhook/rysta-upload-invoice';

/**
 * Uploads an Invoice PDF via FormData to https://api.agents.snsihub.ai/webhook/rysta-upload-invoice
 * - Appends uploaded PDF file under key: 'data'
 * - Appends user's email under key: 'email'
 */
export async function uploadInvoicePdf(
  file: File,
  userEmail?: string,
  targetUrl: string = INVOICE_UPLOAD_WEBHOOK_URL
): Promise<any> {
  // Retrieve email from user session / localStorage
  let email = (userEmail || getCurrentUserEmail()).trim();
  if (!email) {
    email = useAuthStore.getState().user?.email || 'finance@rystafmcg.com';
  }

  const formData = new FormData();
  formData.append('data', file);
  formData.append('email', email);

  console.log(`Submitting Invoice PDF "${file.name}" (${file.size} bytes) for ${email} to ${targetUrl}`);

  // 1. Extract real text and invoice fields directly from the uploaded PDF document
  let extractedPdfData: any = {};
  try {
    extractedPdfData = await parsePdfInvoice(file);
    console.log('[Invoice Upload] Extracted live PDF data:', extractedPdfData);
  } catch (err) {
    console.warn('[Invoice Upload] Direct PDF parsing encountered error:', err);
  }

  const res = await fetch(targetUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed (${res.status}): ${errorText || res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  let result: any = null;
  if (contentType.includes('application/json')) {
    result = await res.json();
  } else {
    result = await res.text();
  }

  // Register newly uploaded invoice under current user's live session with exact extracted PDF values
  try {
    const extractedTotal =
      Number(result?.grand_total || result?.total_amount || result?.amount || result?.grandTotal || 0) ||
      extractedPdfData.totalAmount ||
      undefined;

    const extractedParty =
      result?.party_name ||
      result?.customer_name ||
      result?.vendor_name ||
      result?.customerName ||
      extractedPdfData.partyName;

    const extractedInvoiceNumber =
      result?.invoice_number ||
      result?.invoiceNumber ||
      extractedPdfData.invoiceNumber;

    const extractedIssueDate =
      result?.issue_date ||
      result?.date ||
      extractedPdfData.issueDate;

    const extractedDueDate =
      result?.due_date ||
      extractedPdfData.dueDate;

    const extractedGstin =
      result?.customer_gstin ||
      result?.gstin ||
      extractedPdfData.gstin;

    registerUploadedInvoice(file, email, {
      ...(extractedTotal !== undefined ? { grandTotal: extractedTotal, balanceDue: extractedTotal, taxableTotal: extractedTotal, subtotal: extractedTotal } : {}),
      ...(extractedParty ? { customerName: extractedParty } : {}),
      ...(extractedInvoiceNumber ? { invoiceNumber: extractedInvoiceNumber } : {}),
      ...(extractedIssueDate ? { date: extractedIssueDate } : {}),
      ...(extractedDueDate ? { dueDate: extractedDueDate } : {}),
      ...(extractedGstin ? { customerGstin: extractedGstin } : {}),
    });

    // 2. Automatic Webhook Trigger: whenever an invoice is uploaded
    try {
      triggerCashFlowWebhookForUser(email);
    } catch (cfErr) {
      console.warn('[Invoice Upload] Cash flow trigger warning:', cfErr);
    }
  } catch (err) {
    console.error('[Invoice Upload] Failed to register uploaded invoice:', err);
  }

  return result;
}

/**
 * Fetches real invoices strictly belonging to the currently logged-in user from Supabase.
 * Purges all mock data and returns empty [] if none exist.
 */
export async function fetchInvoices(userEmail?: string): Promise<Invoice[]> {
  const email = (userEmail || getCurrentUserEmail()).trim();
  return fetchUserInvoicesFromSupabase(email);
}

export async function fetchInvoiceById(id: string): Promise<Invoice | undefined> {
  const all = await fetchInvoices();
  return all.find((inv) => inv.id === id || inv.invoiceNumber === id);
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Invoice> {
  return apiWithFallback<Invoice>(
    '/invoices',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createInvoice(data)
  );
}

export async function markInvoiceAsPaid(id: string, userEmail?: string): Promise<Invoice | null> {
  const result = await markInvoiceAsPaidInSupabase(id, userEmail);
  // 2. Automatic Webhook Trigger: whenever an invoice is marked as Paid
  try {
    const email = userEmail || getCurrentUserEmail();
    triggerCashFlowWebhookForUser(email);
  } catch (err) {
    console.warn('[Invoice Paid] Cash flow trigger warning:', err);
  }
  return result;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus, userEmail?: string): Promise<Invoice> {
  const email = userEmail || getCurrentUserEmail();
  const upper =
    status === 'paid'
      ? 'PAID'
      : status === 'overdue'
      ? 'OVERDUE'
      : status === 'void'
      ? 'VOID'
      : 'PENDING';

  const updated = await updateInvoiceStatusInSupabase(id, upper, email);
  if (status === 'paid') {
    try {
      triggerCashFlowWebhookForUser(email);
    } catch {}
  }
  if (updated) return updated;

  return {
    id,
    invoiceNumber: id.startsWith('INV') ? id : `INV-${id}`,
    customerId: 'cust-1',
    customerName: 'Customer',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    subtotal: 0,
    discountTotal: 0,
    taxableTotal: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    grandTotal: 0,
    amountPaid: status === 'paid' ? 0 : 0,
    balanceDue: status === 'paid' ? 0 : 0,
    isInterstate: false,
    customerGstin: '',
    customerAddress: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
    },
    status,
    items: [],
    createdAt: new Date().toISOString(),
  };
}

export async function voidInvoice(id: string, userEmail?: string): Promise<Invoice> {
  return updateInvoiceStatus(id, 'void', userEmail);
}

export async function deleteInvoice(id: string, userEmail?: string): Promise<boolean> {
  return deleteInvoiceFromSupabase(id, userEmail);
}
