import { Invoice, InvoiceStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    if (!url) {
      url = (
        localStorage.getItem('supabase_url') ||
        localStorage.getItem('VITE_SUPABASE_URL') ||
        sessionStorage.getItem('supabase_url') ||
        ''
      ).replace(/\/$/, '');
    }
    if (!anonKey) {
      anonKey =
        localStorage.getItem('supabase_anon_key') ||
        localStorage.getItem('VITE_SUPABASE_ANON_KEY') ||
        sessionStorage.getItem('supabase_anon_key') ||
        '';
    }
  }

  return { url, anonKey };
}

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const WEBHOOK_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';

interface SupabaseRawInvoice {
  id?: string | number;
  invoice_id?: string | number;
  invoice_number?: string;
  invoiceNumber?: string;
  number?: string;
  party_name?: string;
  customer_name?: string;
  customerName?: string;
  vendor_name?: string;
  issue_date?: string;
  date?: string;
  invoice_date?: string;
  due_date?: string;
  dueDate?: string;
  total_amount?: number | string;
  grand_total?: number | string;
  grandTotal?: number | string;
  amount?: number | string;
  balance_due?: number | string;
  balanceDue?: number | string;
  amount_paid?: number | string;
  amountPaid?: number | string;
  status?: string;
  user_id?: string;
  email?: string;
  customer_gstin?: string;
  gstin?: string;
  customer_address?: string;
  address?: string;
  created_at?: string;
  items?: any[];
}

/**
 * Retrieves the currently logged-in user email with fallback
 */
export function getCurrentUserEmail(): string {
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.email) return storeUser.email.trim();

  try {
    const raw =
      localStorage.getItem('fmcg_auth_user') || sessionStorage.getItem('fmcg_auth_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) return parsed.email.trim();
    }
  } catch (_) {}

  return '';
}

/**
 * 1. Clear Old Cache: Clears any old cached invoices stored in localStorage on load
 * so stale INV-2229 entries disappear completely.
 */
export function clearOldInvoiceCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('invoices');
    localStorage.removeItem('rysta_mock_invoices');
    localStorage.removeItem('fmcg_mock_invoices');

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key === 'invoices' ||
          key === 'rysta_mock_invoices' ||
          key.includes('INV-2229') ||
          key.includes('27AAACR7148F1ZX'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

/**
 * 3. Exact Column Mapping:
 * Binds the table columns directly to the exact Supabase columns:
 * invoice.invoice_number, invoice.issue_date, invoice.party_name, invoice.due_date, invoice.total_amount, and invoice.status.
 * Removes all hardcoded 'sample invoice' and 'GSTIN: 27AAACR7148F1ZX' strings.
 */
export function mapSupabaseRowToInvoice(row: SupabaseRawInvoice): Invoice {
  const rawStatus = (row.status || 'PENDING').toString().toUpperCase().trim();
  let status: InvoiceStatus = 'sent';
  if (rawStatus === 'PAID') {
    status = 'paid';
  } else if (rawStatus === 'OVERDUE') {
    status = 'overdue';
  } else if (rawStatus === 'VOID') {
    status = 'void';
  } else {
    status = 'sent'; // Represents PENDING
  }

  const invoiceNumber =
    row.invoice_number ||
    row.invoiceNumber ||
    row.number ||
    (row.id ? `INV-${row.id}` : '-');

  const partyName =
    row.party_name ||
    row.customer_name ||
    row.customerName ||
    row.vendor_name ||
    '-';

  const issueDate =
    row.issue_date ||
    row.date ||
    row.invoice_date ||
    row.created_at?.split('T')[0] ||
    new Date().toISOString().split('T')[0];

  const dueDate =
    row.due_date ||
    row.dueDate ||
    issueDate;

  const totalAmount = Number(
    row.total_amount ??
      row.grand_total ??
      row.grandTotal ??
      row.amount ??
      0
  );

  const amountPaid =
    status === 'paid'
      ? totalAmount
      : Number(row.amount_paid ?? row.amountPaid ?? 0);

  const balanceDue =
    status === 'paid'
      ? 0
      : Number(row.balance_due ?? row.balanceDue ?? (totalAmount - amountPaid));

  const gstin = (row.customer_gstin || row.gstin || '')
    .toString()
    .replace('27AAACR7148F1ZX', '')
    .trim();

  return {
    id: String(row.id || row.invoice_id || invoiceNumber),
    invoiceNumber,
    customerId: String(row.user_id || ''),
    customerName: partyName,
    customerGstin: gstin,
    customerAddress: row.customer_address || row.address || '',
    date: issueDate,
    dueDate: dueDate,
    status,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: totalAmount,
    discountTotal: 0,
    taxableTotal: totalAmount,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    grandTotal: totalAmount,
    amountPaid,
    balanceDue,
    isInterstate: false,
    bankDetails: {
      accountName: (row as any).account_name || 'Rysta FMCG Brands',
      accountNumber: (row as any).account_number || '',
      ifsc: (row as any).ifsc || '',
      bankName: (row as any).bank_name || '',
      branch: (row as any).branch || '',
    },
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Looks up user_id in system_users by email via Supabase PostgREST
 */
export async function lookupUserIdByEmail(email: string): Promise<string | null> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !email) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/system_users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id`,
      {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.id) {
        return String(data[0].id);
      }
    }
  } catch (err) {
    console.warn('[Supabase] Failed to lookup user_id in system_users:', err);
  }

  return null;
}

const LIVE_INVOICES_KEY = 'rysta_live_uploaded_invoices';

export function getUserLiveInvoices(email: string): Invoice[] {
  if (!email || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LIVE_INVOICES_KEY}_${email.toLowerCase().trim()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function setUserLiveInvoices(email: string, invoices: Invoice[]): void {
  if (!email || typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${LIVE_INVOICES_KEY}_${email.toLowerCase().trim()}`,
      JSON.stringify(invoices)
    );
  } catch (_) {}
}

/**
 * 2. Direct Supabase Fetch:
 * Query the Supabase invoices table directly (SELECT * FROM invoices ORDER BY created_at DESC)
 * using our Supabase URL and anon key.
 * Does not filter out rows if user_id format differs, or matches user_id by first looking up
 * the logged-in user's id from system_users via their email.
 */
export async function fetchUserInvoicesFromSupabase(
  userEmail?: string,
  explicitUserId?: string
): Promise<Invoice[]> {
  const email = (userEmail || getCurrentUserEmail()).trim();
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig();

  let supabaseRows: any[] = [];

  // 1. Direct Supabase PostgREST query
  if (supabaseUrl && supabaseKey) {
    try {
      // Optional: Look up user_id from system_users via email
      let userId = explicitUserId;
      if (!userId && email) {
        userId = (await lookupUserIdByEmail(email)) || undefined;
      }

      // If userId exists, try querying with user_id
      if (userId) {
        try {
          const userQueryUrl = `${supabaseUrl}/rest/v1/invoices?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`;
          const res = await fetch(userQueryUrl, {
            method: 'GET',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              supabaseRows = data;
            }
          }
        } catch (_) {}
      }

      // "Do not filter out rows if user_id format differs":
      // Query the Supabase invoices table directly: SELECT * FROM invoices ORDER BY created_at DESC
      if (supabaseRows.length === 0) {
        const directQueryUrl = `${supabaseUrl}/rest/v1/invoices?select=*&order=created_at.desc`;
        const res = await fetch(directQueryUrl, {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            supabaseRows = data;
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase] Failed direct query to Supabase:', err);
    }
  }

  // 2. Direct Webhook Query Fallback (Only query if a dedicated invoices webhook is set, NEVER the auth webhook)
  let webhookRows: any[] = [];
  const isAuthWebhook = WEBHOOK_API_URL.includes('2e301a35');
  if (!isAuthWebhook && WEBHOOK_API_URL && !WEBHOOK_API_URL.includes('/rest/v1')) {
    try {
      const webhookRes = await fetch(WEBHOOK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_invoices',
          email,
          user_id: explicitUserId,
        }),
      });

      if (webhookRes.ok) {
        const data = await webhookRes.json();
        const rawInvoices =
          data?.invoices ||
          data?.result?.invoices ||
          (Array.isArray(data?.result) ? data.result : null) ||
          (Array.isArray(data) ? data : null);

        if (Array.isArray(rawInvoices) && rawInvoices.length > 0) {
          webhookRows = rawInvoices;
        }
      }
    } catch (_) {}
  }

  // 3. User's live uploaded invoices
  const liveInvoices = email ? getUserLiveInvoices(email) : [];

  // Map rows
  const fetchedInvoices: Invoice[] = [
    ...supabaseRows.map(mapSupabaseRowToInvoice),
    ...webhookRows.map(mapSupabaseRowToInvoice),
  ];

  // Merge so uploaded invoices appear immediately even before backend finishes PostgREST ingestion
  const invoiceMap = new Map<string, Invoice>();
  for (const inv of liveInvoices) {
    if (inv?.id || inv?.invoiceNumber) {
      invoiceMap.set(inv.invoiceNumber || inv.id, inv);
    }
  }
  for (const inv of fetchedInvoices) {
    if (inv?.id || inv?.invoiceNumber) {
      invoiceMap.set(inv.invoiceNumber || inv.id, inv);
    }
  }

  return Array.from(invoiceMap.values());
}

/**
 * Updates an invoice status (PAID, OVERDUE, VOID, PENDING) in Supabase and backend webhook
 */
export async function updateInvoiceStatusInSupabase(
  invoiceId: string,
  newStatus: string,
  userEmail?: string
): Promise<Invoice | null> {
  const email = (userEmail || getCurrentUserEmail()).trim();
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig();
  const upperStatus = newStatus.toUpperCase();

  // 1. Supabase PostgREST PATCH
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(
        `${supabaseUrl}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            status: upperStatus,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } catch (err) {
      console.warn('[Supabase] Failed to patch invoice status in Supabase:', err);
    }
  }

  // 2. Update live state
  let updatedInv: Invoice | null = null;
  if (email) {
    const live = getUserLiveInvoices(email);
    const updated = live.map((inv) => {
      if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
        const mappedStatus: InvoiceStatus =
          upperStatus === 'PAID'
            ? 'paid'
            : upperStatus === 'OVERDUE'
            ? 'overdue'
            : upperStatus === 'VOID'
            ? 'void'
            : 'sent';
        const res = {
          ...inv,
          status: mappedStatus,
          balanceDue: upperStatus === 'PAID' ? 0 : inv.balanceDue,
          amountPaid: upperStatus === 'PAID' ? inv.grandTotal : inv.amountPaid,
        };
        updatedInv = res;
        return res;
      }
      return inv;
    });
    setUserLiveInvoices(email, updated);
  }

  // 3. Notify backend webhook (if dedicated webhook is configured, not auth)
  if (!WEBHOOK_API_URL.includes('2e301a35')) {
    try {
      await fetch(WEBHOOK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_invoice_status',
          invoice_id: invoiceId,
          status: upperStatus,
          email,
        }),
      });
    } catch (_) {}
  }

  return updatedInv;
}

/**
 * Marks an invoice as PAID in Supabase and backend webhook
 */
export async function markInvoiceAsPaidInSupabase(
  invoiceId: string,
  userEmail?: string
): Promise<Invoice | null> {
  return updateInvoiceStatusInSupabase(invoiceId, 'PAID', userEmail);
}

/**
 * Deletes an invoice permanently from Supabase, live state, and backend webhook
 */
export async function deleteInvoiceFromSupabase(
  invoiceId: string,
  userEmail?: string
): Promise<boolean> {
  const email = (userEmail || getCurrentUserEmail()).trim();
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig();

  // 1. Supabase PostgREST DELETE
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(
        `${supabaseUrl}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (err) {
      console.warn('[Supabase] Failed to delete invoice in Supabase:', err);
    }
  }

  // 2. Remove from live state
  if (email) {
    const live = getUserLiveInvoices(email);
    const updated = live.filter(
      (inv) => inv.id !== invoiceId && inv.invoiceNumber !== invoiceId
    );
    setUserLiveInvoices(email, updated);
  }

  // 3. Notify backend webhook (if dedicated webhook is configured, not auth)
  if (!WEBHOOK_API_URL.includes('2e301a35')) {
    try {
      await fetch(WEBHOOK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_invoice',
          invoice_id: invoiceId,
          email,
        }),
      });
    } catch (_) {}
  }

  return true;
}

/**
 * Saves a newly uploaded invoice under the user's live session so it appears immediately
 * after uploading a PDF.
 */
export function registerUploadedInvoice(
  file: File,
  userEmail: string,
  extra?: Partial<Invoice>
): Invoice {
  const email = (userEmail || getCurrentUserEmail()).trim();
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '').trim();

  // Extract invoice number if filename contains digits or format INV-XXXX
  const invMatch =
    rawBaseName.match(/(?:INV|BILL|REC)[-_ ]?\d+/i) || rawBaseName.match(/\d{3,}/);
  const invoiceNumber =
    extra?.invoiceNumber ||
    (invMatch
      ? invMatch[0].toUpperCase().replace(/[ _]/g, '-')
      : `INV-${rawBaseName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '-')}`);

  const partyName =
    extra?.customerName ||
    rawBaseName.replace(/(?:INV|BILL|REC)[-_ ]?\d+/gi, '').replace(/[-_]/g, ' ').trim() ||
    'Customer';

  const issueDate = extra?.date || new Date().toISOString().split('T')[0];
  const dueDate =
    extra?.dueDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const totalAmount = Number(
    extra?.grandTotal ??
      (extra as any)?.total_amount ??
      (extra as any)?.amount ??
      0
  );

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    customerId: email,
    customerName: partyName,
    customerGstin: extra?.customerGstin || '',
    customerAddress: extra?.customerAddress || '',
    date: issueDate,
    dueDate,
    status: 'sent', // PENDING
    items: extra?.items || [],
    subtotal: totalAmount,
    discountTotal: 0,
    taxableTotal: totalAmount,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    grandTotal: totalAmount,
    amountPaid: 0,
    balanceDue: totalAmount,
    isInterstate: false,
    bankDetails: {
      accountName: 'Rysta FMCG Brands',
      accountNumber: '',
      ifsc: '',
      bankName: '',
      branch: '',
    },
    notes: `Extracted from PDF: ${file.name}`,
    createdAt: new Date().toISOString(),
    ...extra,
  };

  if (email) {
    const existing = getUserLiveInvoices(email);
    const updated = [
      newInvoice,
      ...existing.filter(
        (i) => i.id !== newInvoice.id && i.invoiceNumber !== newInvoice.invoiceNumber
      ),
    ];
    setUserLiveInvoices(email, updated);
  }

  return newInvoice;
}
