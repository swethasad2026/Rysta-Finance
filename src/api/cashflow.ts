import { Invoice } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUserEmail } from './supabase';
import { ExpenseItem, IncomeItem, triggerCashFlowShortageAlert } from './supabaseService';

export const CASHFLOW_WEBHOOK_URL =
  import.meta.env.VITE_CASHFLOW_WEBHOOK_URL ||
  'https://api.agents.snsihub.ai/webhook/cashflow';

export interface CashFlowWebhookResponse {
  success?: boolean;
  shortage_alert_sent?: boolean;
  shortageAlertSent?: boolean;
  message?: string;
  projected_net_cash?: number;
  deficit?: number;
  raw?: any;
}

export interface CashFlowMetrics {
  availableCash: number;
  incomingReceivables30d: number;
  outgoingPayables30d: number;
  projectedNetCash: number;
  hasShortage: boolean;
  deficitAmount: number;
  shortageAlertSent: boolean;
  alertEmailRecipient: string;
  lastForecastAt: string | null;
}

/**
 * Retrieves the stored Opening Cash Balance for the specified user from localStorage.
 * Defaults to 0 if not set.
 */
export function getOpeningCashBalance(email?: string): number {
  if (typeof window === 'undefined') return 0;
  const userEmail = (email || getCurrentUserEmail()).trim().toLowerCase();
  const storageKey = userEmail ? `rysta_opening_balance_${userEmail}` : 'rysta_opening_balance_default';
  
  const saved = localStorage.getItem(storageKey);
  if (saved === null || saved === undefined || saved.trim() === '') {
    // Check fallback legacy key
    const legacy = localStorage.getItem('rysta_opening_balance');
    if (legacy !== null && !isNaN(Number(legacy))) {
      return Number(legacy);
    }
    return 0;
  }

  const parsed = Number(saved);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Persists the Opening Cash Balance for the specified user in localStorage.
 */
export function setOpeningCashBalance(balance: number, email?: string): void {
  if (typeof window === 'undefined') return;
  const userEmail = (email || getCurrentUserEmail()).trim().toLowerCase();
  const storageKey = userEmail ? `rysta_opening_balance_${userEmail}` : 'rysta_opening_balance_default';
  
  const val = isNaN(balance) ? 0 : balance;
  localStorage.setItem(storageKey, String(val));
  localStorage.setItem('rysta_opening_balance', String(val));
}

/**
 * Sends a POST request to https://api.agents.snsihub.ai/webhook/cashflow
 * Payload: { "email": loggedInUserEmail, "opening_balance": Number(openingBalance) }
 */
export async function sendCashFlowWebhook(
  email?: string,
  openingBalance?: number
): Promise<CashFlowWebhookResponse> {
  const targetEmail = (
    email ||
    getCurrentUserEmail() ||
    useAuthStore.getState().user?.email ||
    'finance@rystafmcg.com'
  ).trim();

  const balance =
    openingBalance !== undefined
      ? Number(openingBalance)
      : getOpeningCashBalance(targetEmail);

  const payload = {
    email: targetEmail,
    opening_balance: Number(balance) || 0,
  };

  console.log('[CashFlow Webhook] Dispatching POST to:', CASHFLOW_WEBHOOK_URL, payload);

  try {
    const res = await fetch(CASHFLOW_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => '');
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    console.log('[CashFlow Webhook] Response received:', { status: res.status, data });

    const rawStr = JSON.stringify(data || '');
    const shortageAlertSent =
      Boolean(data?.shortage_alert_sent) ||
      Boolean(data?.shortageAlertSent) ||
      rawStr.includes('"shortage_alert_sent":true') ||
      rawStr.includes('"alert_sent":true');

    return {
      success: res.ok || Boolean(data?.success),
      shortage_alert_sent: shortageAlertSent,
      message: data?.message || (res.ok ? 'Forecast completed' : 'Webhook received response'),
      raw: data,
    };
  } catch (err: any) {
    console.warn('[CashFlow Webhook] Network or endpoint call exception:', err);
    return {
      success: false,
      message: err.message || 'Webhook network error',
      raw: err,
    };
  }
}

/**
 * Triggers the cashflow webhook in background without blocking UI,
 * and emits a custom DOM event so listening components update their live projection.
 */
export function triggerCashFlowWebhookForUser(email?: string, openingBalance?: number): void {
  const targetEmail = (
    email ||
    getCurrentUserEmail() ||
    useAuthStore.getState().user?.email ||
    'finance@rystafmcg.com'
  ).trim();

  const balance =
    openingBalance !== undefined
      ? Number(openingBalance)
      : getOpeningCashBalance(targetEmail);

  // Dispatch webhook asynchronously
  sendCashFlowWebhook(targetEmail, balance).then((res) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rysta-cashflow-webhook-completed', {
          detail: { email: targetEmail, response: res },
        })
      );
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('rysta-cashflow-refresh', {
        detail: { email: targetEmail, openingBalance: balance },
      })
    );
  }
}

/**
 * Computes strictly live financial metrics from the user's real Supabase invoices, expenses, and income rows.
 * No mock data.
 */
export function calculateCashFlowMetrics(
  invoices: Invoice[],
  openingBalance: number,
  webhookResult?: CashFlowWebhookResponse | null,
  userEmail?: string,
  expenses: ExpenseItem[] = [],
  income: IncomeItem[] = []
): CashFlowMetrics {
  const email = (
    userEmail ||
    getCurrentUserEmail() ||
    useAuthStore.getState().user?.email ||
    'finance@rystafmcg.com'
  ).trim();

  const availableCash = Number(openingBalance) || 0;

  // Next 30 days window for incoming receivables and outgoing payables
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);

  // Real Supabase invoice rows where status is not 'paid' and balanceDue > 0
  const incomingInvoices = invoices.filter((inv) => {
    if (inv.status === 'paid') return false;
    const dueAmount = Number(inv.balanceDue !== undefined ? inv.balanceDue : inv.grandTotal) || 0;
    if (dueAmount <= 0) return false;

    // Filter by due date if valid
    if (inv.dueDate) {
      const d = new Date(inv.dueDate);
      if (!isNaN(d.getTime())) {
        return d <= next30Days;
      }
    }
    return true;
  });

  const invoiceReceivables = incomingInvoices.reduce((sum, inv) => {
    const dueAmount = Number(inv.balanceDue !== undefined ? inv.balanceDue : inv.grandTotal) || 0;
    return sum + dueAmount;
  }, 0);

  // Additional 30-day scheduled income inflows
  const additionalIncome30d = income.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
  const incomingReceivables30d = invoiceReceivables + additionalIncome30d;

  // Real outgoing payables from user's real Supabase expenses
  const outgoingPayables30d = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  // Projected 30-Day Net Cash = Available Cash + 30-Day Incoming Receivables - 30-Day Outgoing Payables
  const projectedNetCash = availableCash + incomingReceivables30d - outgoingPayables30d;

  // Shortage occurs if Projected 30-Day Net Cash < 0 OR webhook explicitly sent a shortage alert
  const hasShortage = projectedNetCash < 0 || Boolean(webhookResult?.shortage_alert_sent);
  const deficitAmount = projectedNetCash < 0 ? Math.abs(projectedNetCash) : 0;
  const shortageAlertSent = hasShortage || Boolean(webhookResult?.shortage_alert_sent);

  // Automatically trigger email alert and in-app shortage notification if deficit occurs
  if (hasShortage && typeof window !== 'undefined') {
    triggerCashFlowShortageAlert({
      email,
      openingBalance: availableCash,
      deficitAmount,
      projectedNetCash,
      receivables30d: incomingReceivables30d,
      payables30d: outgoingPayables30d,
    }).catch(() => {});
  }

  return {
    availableCash,
    incomingReceivables30d,
    outgoingPayables30d,
    projectedNetCash,
    hasShortage,
    deficitAmount,
    shortageAlertSent,
    alertEmailRecipient: email,
    lastForecastAt: new Date().toISOString(),
  };
}
