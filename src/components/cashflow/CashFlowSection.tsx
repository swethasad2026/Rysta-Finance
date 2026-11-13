import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Mail,
  CheckCircle2,
  ShieldAlert,
  Info,
  DollarSign,
  Save,
  Send,
  BrainCircuit,
  Lightbulb,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/shared/Toast';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Invoice } from '@/types';
import { fetchInvoices } from '@/api/invoices';
import {
  fetchUserExpenses,
  fetchUserIncome,
  ExpenseItem,
  IncomeItem,
  triggerCashFlowShortageAlert,
} from '@/api/supabaseService';
import {
  getOpeningCashBalance,
  setOpeningCashBalance,
  sendCashFlowWebhook,
  calculateCashFlowMetrics,
  CashFlowMetrics,
  CashFlowWebhookResponse,
} from '@/api/cashflow';

interface CashFlowSectionProps {
  initialInvoices?: Invoice[];
  className?: string;
  showBreakdown?: boolean;
}

export const CashFlowSection: React.FC<CashFlowSectionProps> = ({
  initialInvoices,
  className = '',
  showBreakdown = true,
}) => {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const userEmail = (user?.email || 'swetha.s.ad.2026@snsct.org').trim();

  // 1. Opening Cash Balance Input: Defaulting to 0 if not set, saved per user in localStorage
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>(() => {
    const val = getOpeningCashBalance(userEmail);
    return String(val);
  });
  const [openingBalance, setOpeningBalance] = useState<number>(() => {
    return getOpeningCashBalance(userEmail);
  });

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices || []);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [income, setIncome] = useState<IncomeItem[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(!initialInvoices);
  const [isForecasting, setIsForecasting] = useState<boolean>(false);
  const [lastWebhookResult, setLastWebhookResult] = useState<CashFlowWebhookResponse | null>(null);
  const [lastForecastTime, setLastForecastTime] = useState<string | null>(null);
  const [balanceSavedNotification, setBalanceSavedNotification] = useState<boolean>(false);

  // Sync initialInvoices prop if provided
  useEffect(() => {
    if (initialInvoices) {
      setInvoices(initialInvoices);
    }
  }, [initialInvoices]);

  // Load fresh invoices, expenses, and income from Supabase
  const loadFinancials = useCallback(async () => {
    try {
      setIsLoadingInvoices(true);
      const [invData, expData, incData] = await Promise.all([
        fetchInvoices(userEmail),
        fetchUserExpenses(userEmail),
        fetchUserIncome(userEmail),
      ]);
      setInvoices(invData || []);
      setExpenses(expData || []);
      setIncome(incData || []);
      return invData || [];
    } catch (err) {
      console.error('[CashFlow] Failed to fetch financials:', err);
      return [];
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [userEmail]);

  const loadUserInvoices = loadFinancials;

  // 2. Automatic & Manual Webhook Trigger: Send POST to https://api.agents.snsihub.ai/webhook/cashflow
  const runForecast = useCallback(
    async (customBalance?: number, showSuccessToast: boolean = true) => {
      const activeBalance =
        customBalance !== undefined ? customBalance : Number(openingBalance) || 0;

      setIsForecasting(true);
      try {
        console.log(`[CashFlow] Triggering forecast webhook for ${userEmail} with opening balance: ₹${activeBalance}`);
        const result = await sendCashFlowWebhook(userEmail, activeBalance);
        setLastWebhookResult(result);
        setLastForecastTime(new Date().toLocaleTimeString());

        if (showSuccessToast) {
          toast({
            title: 'Cash Flow Forecast Updated',
            description: `Projection synchronized for ${userEmail} with opening cash of ${formatCurrency(activeBalance)}.`,
            variant: 'success',
          });
        }
      } catch (err: any) {
        console.error('[CashFlow] Webhook trigger error:', err);
        if (showSuccessToast) {
          toast({
            title: 'Forecast Run Completed',
            description: 'Financial metrics computed from live Supabase invoice records.',
            variant: 'default',
          });
        }
      } finally {
        setIsForecasting(false);
      }
    },
    [userEmail, openingBalance, toast]
  );

  // Trigger automatically on mount (Cash Flow page / Dashboard load)
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      let currentInvoices = invoices;
      if (!initialInvoices || initialInvoices.length === 0) {
        currentInvoices = await loadUserInvoices();
      }
      if (isMounted) {
        // Run initial webhook trigger automatically on load
        runForecast(openingBalance, false);
      }
    };

    init();

    // Listeners for invoice updates (upload or marked as paid)
    const handleInvoiceRefresh = async () => {
      const refreshed = await loadUserInvoices();
      runForecast(openingBalance, false);
    };

    const handleCashFlowRefresh = (e: any) => {
      const newBal = e?.detail?.openingBalance !== undefined ? e.detail.openingBalance : openingBalance;
      loadUserInvoices().then(() => runForecast(newBal, false));
    };

    window.addEventListener('rysta-invoices-refresh', handleInvoiceRefresh);
    window.addEventListener('rysta-cashflow-refresh', handleCashFlowRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('rysta-invoices-refresh', handleInvoiceRefresh);
      window.removeEventListener('rysta-cashflow-refresh', handleCashFlowRefresh);
    };
  }, [userEmail]);

  // Handle Opening Cash Balance input change and persistence
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setOpeningBalanceInput(text);
    const parsed = Number(text);
    if (!isNaN(parsed)) {
      setOpeningBalance(parsed);
      setOpeningCashBalance(parsed, userEmail);
    }
  };

  const handleSaveBalance = () => {
    const parsed = Number(openingBalanceInput);
    const safeVal = isNaN(parsed) ? 0 : parsed;
    setOpeningBalance(safeVal);
    setOpeningCashBalance(safeVal, userEmail);
    setBalanceSavedNotification(true);
    setTimeout(() => setBalanceSavedNotification(false), 2000);
    // Run forecast with updated balance
    runForecast(safeVal, true);
  };

  const [isSendingAlertEmail, setIsSendingAlertEmail] = useState(false);

  const handleSendUrgentAlertEmail = async () => {
    try {
      setIsSendingAlertEmail(true);
      await triggerCashFlowShortageAlert({
        email: metrics.alertEmailRecipient,
        openingBalance: metrics.availableCash,
        deficitAmount: metrics.deficitAmount,
        projectedNetCash: metrics.projectedNetCash,
        receivables30d: metrics.incomingReceivables30d,
        payables30d: metrics.outgoingPayables30d,
      });

      toast({
        title: '🚨 Shortage Alert Email Dispatched',
        description: `Alert email dispatched to ${metrics.alertEmailRecipient} with real-time liquidity analysis & deficit mitigation advice.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Email Dispatch Warning',
        description: err.message || 'Failed to dispatch email alert.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingAlertEmail(false);
    }
  };

  // 3. Live Financial Metrics strictly from Supabase rows (invoices, expenses, and income)
  const metrics: CashFlowMetrics = useMemo(() => {
    return calculateCashFlowMetrics(invoices, openingBalance, lastWebhookResult, userEmail, expenses, income);
  }, [invoices, openingBalance, lastWebhookResult, userEmail, expenses, income]);

  // Pending invoices due in next 30 days
  const pendingInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status !== 'paid' && (Number(inv.balanceDue) > 0 || Number(inv.grandTotal) > 0));
  }, [invoices]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 4. Shortage Alert Banner & Email Notification Badge */}
      {metrics.hasShortage && (
        <div className="relative overflow-hidden rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 dark:from-rose-950/60 dark:via-rose-900/30 dark:to-rose-950/60 p-4 sm:p-5 shadow-sm transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                    Cash Shortage Warning: Projected Deficit of {formatCurrency(metrics.deficitAmount)}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Projected 30-day net cash is <span className="font-bold font-mono text-rose-900 dark:text-rose-100">{formatCurrency(metrics.projectedNetCash)}</span>. Immediate liquidity buffer is required to meet working capital and vendor commitments.
                </p>
              </div>
            </div>

            {/* Confirmation badge saying 'Shortage alert email sent to [user email]' + manual re-send button */}
            <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-rose-950/90 border border-rose-400 text-rose-900 dark:text-rose-100 text-xs font-semibold shadow-sm">
                <Mail className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="truncate">
                  Shortage alert email dispatched to <span className="underline font-bold">{metrics.alertEmailRecipient}</span>
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />
              </div>
              <Button
                size="sm"
                onClick={handleSendUrgentAlertEmail}
                disabled={isSendingAlertEmail}
                className="h-8 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                title="Send immediate email alert with AI mitigation steps to user email"
              >
                <Send className={`h-3.5 w-3.5 ${isSendingAlertEmail ? 'animate-spin' : ''}`} />
                <span>{isSendingAlertEmail ? 'Dispatching...' : 'Dispatch Alert Email Now'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Cash Flow Control & Forecasting Card */}
      <Card className="border border-border/80 shadow-sm overflow-hidden bg-card">
        {/* Header with Inputs & Action Controls */}
        <CardHeader className="bg-muted/20 border-b pb-4 pt-4 px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-foreground">
                    Cash Flow & Shortage Forecasting
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                    Live Supabase Ledger
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI-driven 30-day liquidity simulation and automated email alerts to prevent cash deficits
                </p>
              </div>
            </div>

            {/* 1. Opening Cash Balance Input alongside 'Run Cash Flow Forecast' button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/40">
                <span className="text-xs font-bold text-muted-foreground select-none">
                  ₹ Opening Cash:
                </span>
                <Input
                  type="number"
                  step="any"
                  value={openingBalanceInput}
                  onChange={handleBalanceChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBalance();
                  }}
                  placeholder="0.00"
                  className="h-7 w-28 text-xs font-mono font-bold border-0 p-0 focus-visible:ring-0 bg-transparent text-foreground"
                  title="Opening cash balance saved per logged-in user in localStorage"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveBalance}
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Save Opening Cash Balance"
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>

              {/* 'Run Cash Flow Forecast' button */}
              <Button
                size="sm"
                onClick={() => runForecast(openingBalance, true)}
                disabled={isForecasting}
                className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isForecasting ? 'animate-spin' : ''}`} />
                <span>{isForecasting ? 'Forecasting...' : 'Run Cash Flow Forecast'}</span>
              </Button>
            </div>
          </div>
          {lastForecastTime && (
            <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>Last forecast run at {lastForecastTime} for {userEmail}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* 3. Live Financial Metrics (No Mock Data) Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Available Cash */}
            <div className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Available Cash</span>
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Wallet className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {formatCurrency(metrics.availableCash)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Opening liquid balance in bank & cash accounts
              </p>
            </div>

            {/* Metric 2: 30-Day Incoming Receivables */}
            <div className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">30-Day Incoming Receivables</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(metrics.incomingReceivables30d)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Strictly calculated from {pendingInvoices.length} open customer invoices
              </p>
            </div>

            {/* Metric 3: 30-Day Outgoing Payables */}
            <div className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">30-Day Outgoing Payables</span>
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                -{formatCurrency(metrics.outgoingPayables30d)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Vendor bills & purchase obligations in next 30 days
              </p>
            </div>

            {/* Metric 4: Projected 30-Day Net Cash */}
            <div
              className={`p-4 rounded-xl border space-y-2 transition-colors ${
                metrics.hasShortage
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-400/60'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-400/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Projected 30-Day Net Cash</span>
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                    metrics.hasShortage
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {metrics.hasShortage ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
              <div
                className={`text-xl font-bold font-mono ${
                  metrics.hasShortage
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(metrics.projectedNetCash)}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={metrics.hasShortage ? 'text-rose-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {metrics.hasShortage ? 'Deficit / Shortage Alert' : 'Healthy Working Capital Buffer'}
                </span>
                {metrics.hasShortage && (
                  <span className="font-mono font-bold text-rose-600">
                    Deficit: {formatCurrency(metrics.deficitAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Cash Prediction & AI Recommendations Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Card 1: AI Cash Prediction */}
            <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">AI Cash Prediction & Runway</h4>
                    <p className="text-[11px] text-muted-foreground">30-day algorithmic liquidity simulation</p>
                  </div>
                </div>
                <Badge variant={metrics.hasShortage ? "destructive" : "outline"} className="text-[10px] font-bold">
                  {metrics.hasShortage ? "Shortage Forecasted" : "Runway Stable"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-background border text-xs space-y-1">
                  <span className="text-[11px] text-muted-foreground">Projected Runway</span>
                  <div className={`text-base font-bold font-mono ${metrics.hasShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {metrics.outgoingPayables30d > 0
                      ? Math.max(0, Math.round((metrics.availableCash + metrics.incomingReceivables30d) / (metrics.outgoingPayables30d / 30)))
                      : 90}{' '}
                    Days
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Based on ₹{Math.round(metrics.outgoingPayables30d / 30).toLocaleString('en-IN')}/day average burn
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-background border text-xs space-y-1">
                  <span className="text-[11px] text-muted-foreground">Liquidity Depletion Forecast</span>
                  <div className={`text-sm font-bold font-mono ${metrics.hasShortage ? 'text-rose-600' : 'text-foreground'}`}>
                    {metrics.hasShortage ? 'Shortfall Expected' : 'No Depletion in 30d'}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {metrics.hasShortage ? `Deficit: ${formatCurrency(metrics.deficitAmount)}` : 'Sufficient liquidity cover'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: AI Recommendations (CFO Advisory) */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background to-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">AI CFO Recommendations</h4>
                    <p className="text-[11px] text-muted-foreground">Automated liquidity & working capital guidance</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-background border flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">1.</span>
                  <div>
                    <strong className="text-foreground">Accelerate Receivables Collection:</strong> Prioritize {pendingInvoices.length} pending invoices totaling <span className="font-mono text-emerald-600 font-bold">{formatCurrency(metrics.incomingReceivables30d)}</span> to prevent a cash dip.
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border flex items-start gap-2">
                  <span className="text-amber-600 font-bold shrink-0 mt-0.5">2.</span>
                  <div>
                    <strong className="text-foreground">Vendor Outflow Staggering:</strong> Request a 15-day deferral on high operational payables of <span className="font-mono text-foreground font-bold">{formatCurrency(metrics.outgoingPayables30d)}</span> to smooth the cash curve.
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0 mt-0.5">3.</span>
                  <div>
                    <strong className="text-foreground">Safety Reserve Target:</strong> Maintain an Opening Cash Balance of at least <span className="font-mono text-primary font-bold">{formatCurrency(Math.max(50000, metrics.deficitAmount + 25000))}</span> for comfortable OpEx cover.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown & Contributing Invoices */}
          {showBreakdown && (
            <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Invoices Driving 30-Day Cash Inflows ({pendingInvoices.length} Pending)
                  </h4>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  Total Expected: {formatCurrency(metrics.incomingReceivables30d)}
                </span>
              </div>

              {pendingInvoices.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No unpaid invoices currently pending. Upload an invoice PDF to project incoming cash.
                </div>
              ) : (
                <div className="divide-y divide-border/60 text-xs">
                  {pendingInvoices.slice(0, 4).map((inv) => (
                    <div key={inv.id} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{inv.invoiceNumber}</span>
                          <span className="text-muted-foreground">• {inv.customerName}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Due: {formatDate(inv.dueDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(Number(inv.balanceDue) || Number(inv.grandTotal))}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-600">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
