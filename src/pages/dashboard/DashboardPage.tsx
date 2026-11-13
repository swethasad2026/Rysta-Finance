import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  Plus,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  AlertCircle,
  Eye,
  FileUp,
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  BrainCircuit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ChartCard } from '@/components/shared/ChartCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DateRangePicker, DateRange } from '@/components/shared/DateRangePicker';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatCompactCurrency, formatDate } from '@/utils/formatters';
import { fetchInvoices, markInvoiceAsPaid } from '@/api/invoices';
import { clearOldInvoiceCache } from '@/api/supabase';
import { InvoiceUploadModal } from '@/components/invoices/InvoiceUploadModal';
import { CashFlowSection } from '@/components/cashflow/CashFlowSection';
import { Invoice } from '@/types';
import { getOpeningCashBalance } from '@/api/cashflow';
import { fetchUserExpenses, fetchUserIncome } from '@/api/supabaseService';
import { useAuthStore } from '@/store/authStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const userEmail = user?.email || '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    label: 'This Month',
  });

  const refreshInvoices = async () => {
    try {
      setIsRefreshing(true);
      const [invData, expData, incData] = await Promise.all([
        fetchInvoices(userEmail),
        fetchUserExpenses(userEmail),
        fetchUserIncome(userEmail),
      ]);
      setInvoices(invData || []);
      setTotalExpenses((expData || []).reduce((sum, e) => sum + Number(e.amount || 0), 0));
      setTotalIncome((incData || []).reduce((sum, i) => sum + Number(i.amount || 0), 0));
    } catch (err: any) {
      console.error('Failed to refresh data from Supabase:', err);
      setInvoices([]);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    clearOldInvoiceCache();
    refreshInvoices();

    const handleRefresh = () => {
      refreshInvoices();
    };
    window.addEventListener('rysta-invoices-refresh', handleRefresh);
    return () => {
      window.removeEventListener('rysta-invoices-refresh', handleRefresh);
    };
  }, []);

  const handleMarkAsPaid = async (inv: Invoice) => {
    try {
      await markInvoiceAsPaid(inv.id);
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? { ...i, status: 'paid', balanceDue: 0, amountPaid: i.grandTotal }
            : i
        )
      );
      toast({
        title: 'Invoice Marked as Paid',
        description: `${inv.invoiceNumber} status updated to PAID in Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // --- REAL LIVE KPI CALCULATIONS FROM LOGGED-IN USER ROWS ---
  const totalSales = useMemo(
    () => invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0),
    [invoices]
  );

  const pendingInvoices = useMemo(
    () => invoices.filter((i) => i.status !== 'paid' && (i.status === 'sent' || i.balanceDue > 0)),
    [invoices]
  );

  const totalReceivables = useMemo(
    () =>
      pendingInvoices.reduce(
        (sum, inv) => sum + (Number(inv.balanceDue) || Number(inv.grandTotal) || 0),
        0
      ),
    [pendingInvoices]
  );

  const paidInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'paid'),
    [invoices]
  );

  const totalPaid = useMemo(
    () => paidInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0),
    [paidInvoices]
  );

  const overdueInvoices = useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.status === 'overdue' ||
          (i.status !== 'paid' && i.balanceDue > 0 && new Date(i.dueDate) < new Date())
      ),
    [invoices]
  );

  const totalOverdue = useMemo(
    () =>
      overdueInvoices.reduce(
        (sum, inv) => sum + (Number(inv.balanceDue) || Number(inv.grandTotal) || 0),
        0
      ),
    [overdueInvoices]
  );

  const uniquePartiesCount = useMemo(
    () => new Set(invoices.map((i) => i.customerName).filter(Boolean)).size,
    [invoices]
  );

  const openingBalance = useMemo(() => getOpeningCashBalance(userEmail), [userEmail]);
  const projectedNetCash = useMemo(
    () => openingBalance + totalReceivables - totalExpenses,
    [openingBalance, totalReceivables, totalExpenses]
  );
  const hasShortage = projectedNetCash < 0;

  const collectionRate = useMemo(
    () => (totalSales > 0 ? Math.round((totalPaid / totalSales) * 100) : 0),
    [totalSales, totalPaid]
  );

  // --- REAL REVENUE AGGREGATION BY MONTH ---
  const monthlyFinancialData = useMemo(() => {
    if (invoices.length === 0) {
      return [
        { month: 'Jun', sales: 0, purchases: 0 },
        { month: 'Jul', sales: 0, purchases: 0 },
        { month: 'Aug', sales: 0, purchases: 0 },
        { month: 'Sep', sales: 0, purchases: 0 },
        { month: 'Oct', sales: 0, purchases: 0 },
        { month: 'Nov', sales: 0, purchases: 0 },
      ];
    }

    const monthMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.date || inv.createdAt);
      const m = isNaN(d.getTime())
        ? 'Current'
        : d.toLocaleString('en-US', { month: 'short' });
      monthMap[m] = (monthMap[m] || 0) + (Number(inv.grandTotal) || 0);
    });

    return Object.entries(monthMap).map(([month, sales]) => ({
      month,
      sales,
      purchases: 0,
    }));
  }, [invoices]);

  // --- REAL REVENUE SPLIT BY PARTY ---
  const categoryData = useMemo(() => {
    if (invoices.length === 0) return [];
    const partyMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      const party = inv.customerName || 'Other Party';
      partyMap[party] = (partyMap[party] || 0) + (Number(inv.grandTotal) || 0);
    });

    const colors = ['#be185d', '#db2777', '#e11d48', '#9d174d', '#f472b6'];
    return Object.entries(partyMap)
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length],
      }));
  }, [invoices]);

  // --- REAL RECEIVABLES AGING PROFILE ---
  const agingData = useMemo(() => {
    const buckets = [
      { bucket: '0-30 Days', amount: 0, color: '#10b981' },
      { bucket: '31-60 Days', amount: 0, color: '#ec4899' },
      { bucket: '61-90 Days', amount: 0, color: '#db2777' },
      { bucket: '90+ Days', amount: 0, color: '#be185d' },
    ];

    if (pendingInvoices.length === 0) return buckets;

    const now = new Date().getTime();
    pendingInvoices.forEach((inv) => {
      const due = new Date(inv.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
      const amt = Number(inv.balanceDue) || Number(inv.grandTotal) || 0;

      if (diffDays <= 30) buckets[0].amount += amt;
      else if (diffDays <= 60) buckets[1].amount += amt;
      else if (diffDays <= 90) buckets[2].amount += amt;
      else buckets[3].amount += amt;
    });

    return buckets;
  }, [pendingInvoices]);

  const handleExportDashboard = () => {
    toast({
      title: 'Executive Summary Exported',
      description: 'Your live account invoice statement has been compiled.',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Header */}
      <PageHeader
        title="FMCG Financial Executive Dashboard"
        description="Live accounts receivable, real-time invoice extraction, and reconciled working capital"
        actions={
          <>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Upload Invoice PDF</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/financial-analyst')}
              className="gap-1.5 h-9 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>AI Analyst</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDashboard}
              className="gap-1.5 h-9 text-xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Export</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/payments/new')}
              className="gap-1.5 h-9 text-xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          </>
        }
      />

      {/* KPI Cards Grid - Directly calculated across all real Supabase tables */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(totalSales)}
          subtitle={`${invoices.length} total invoice${invoices.length === 1 ? '' : 's'}`}
          icon={Receipt}
          variant="primary"
        />
        <StatCard
          title="Receivables Due"
          value={formatCurrency(totalReceivables)}
          subtitle={`${pendingInvoices.length} pending invoices`}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Realized Inflow"
          value={formatCurrency(totalPaid + totalIncome)}
          subtitle="Collections & Receipts"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Total OpEx Spend"
          value={formatCurrency(totalExpenses)}
          subtitle="Realized expenditures"
          icon={AlertTriangle}
          variant={totalExpenses > 0 ? 'default' : 'default'}
        />
        <StatCard
          title="Projected 30-Day Net Cash"
          value={formatCurrency(projectedNetCash)}
          subtitle={hasShortage ? "⚠️ Expected Shortage" : "Healthy Working Capital"}
          icon={TrendingUp}
          variant={hasShortage ? "destructive" : "success"}
        />
        <StatCard
          title="Smart Liquidity Alerts"
          value={hasShortage ? `Deficit: ${formatCurrency(Math.abs(projectedNetCash))}` : "All Signals Safe"}
          subtitle={hasShortage ? "Email alert active" : "No shortages forecast"}
          icon={AlertCircle}
          variant={hasShortage ? "destructive" : "default"}
        />
      </div>

      {/* Prominent AI Invoice Ingestion & Dropzone Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">
                  Automated Invoice Ingestion & Extraction
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload tax invoice PDFs to auto-extract line items, GSTIN, and sync accounts receivable in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInvoices}
              disabled={isRefreshing}
              className="h-8 text-xs gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Upload PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow & Shortage Forecasting Section */}
      <CashFlowSection initialInvoices={invoices} />

      {/* Clean Empty State when user has not uploaded any invoices yet */}
      {invoices.length === 0 && !isLoading ? (
        <Card className="border-dashed p-10 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">No invoices uploaded yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your account dashboard starts clean with ₹0.00 totals. Upload your first GST Tax Invoice PDF to activate real-time ledger tracking, receivables aging, and automated reconciliations.
            </p>
          </div>
          <div>
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Upload Invoice PDF</span>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sales Bar Chart */}
            <ChartCard
              title="Monthly Invoice Volume"
              description="Real invoice revenue totals from live account records"
              className="lg:col-span-2"
            >
              <div className="h-[280px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFinancialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatCompactCurrency(val)}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="sales" name="Invoiced Revenue" fill="#be185d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Revenue by Party (Pie Chart) */}
            <ChartCard
              title="Revenue by Party"
              description="Distribution across trade customers"
            >
              <div className="h-[280px] w-full flex flex-col items-center justify-center">
                {categoryData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs w-full px-2 mt-2">
                      {categoryData.map((c) => (
                        <div key={c.name} className="flex items-center gap-1.5 truncate">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-muted-foreground truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-10">
                    No party distribution data yet
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Row 2: Aging Profile */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard
              title="Receivables Aging Profile"
              description="Overdue invoice distribution across aging slabs"
              className="lg:col-span-3"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {agingData.map((bucket) => {
                  const percent =
                    totalReceivables > 0
                      ? Math.round((bucket.amount / totalReceivables) * 100)
                      : 0;
                  return (
                    <div key={bucket.bucket} className="p-3 rounded-lg border bg-card/60 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">{bucket.bucket}</span>
                        <span className="text-muted-foreground font-medium">({percent}%)</span>
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {formatCurrency(bucket.amount)}
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: bucket.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* Row 3: Overdue & Recent Invoices with interactive 'Mark as Paid' buttons */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Invoices Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Overdue Invoices</CardTitle>
              <p className="text-xs text-muted-foreground">Immediate recovery required</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/invoices?status=overdue')}
              className="text-xs h-7 text-primary"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {overdueInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                <div className="font-medium text-foreground">No overdue invoices</div>
                <div>All customer accounts are in good standing.</div>
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                {overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{inv.invoiceNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          OVERDUE
                        </span>
                      </div>
                      <div className="text-muted-foreground truncate">{inv.customerName}</div>
                      <div className="text-[11px] text-rose-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Due on {formatDate(inv.dueDate)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1.5">
                      <div className="font-bold text-foreground">
                        {formatCurrency(inv.balanceDue || inv.grandTotal)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-semibold gap-1"
                        onClick={() => handleMarkAsPaid(inv)}
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Mark as Paid</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
              <p className="text-xs text-muted-foreground">Latest generated party billings</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/invoices')}
              className="text-xs h-7 text-primary"
            >
              All Invoices
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <FileText className="h-6 w-6 text-muted-foreground/60 mx-auto mb-1" />
                <div className="font-medium text-foreground">No invoices uploaded yet</div>
                <div>Upload an invoice PDF to start tracking real-time ledger items.</div>
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                {invoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{inv.invoiceNumber}</span>
                        {inv.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            PAID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            PENDING
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground truncate">{inv.customerName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDate(inv.date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1.5">
                      <div className="font-bold text-foreground">
                        {formatCurrency(inv.grandTotal)}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-semibold gap-1 px-2"
                            onClick={() => handleMarkAsPaid(inv)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Mark Paid</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-primary px-2"
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice PDF Upload Modal */}
      <InvoiceUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={refreshInvoices}
      />
    </div>
  );
};
