import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  FileUp,
  Download,
  Calendar,
  CreditCard,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { fetchInvoices, markInvoiceAsPaid } from '@/api/invoices';
import { Invoice } from '@/types';
import { InvoiceUploadModal } from '@/components/invoices/InvoiceUploadModal';
import { CashFlowSection } from '@/components/cashflow/CashFlowSection';
import { triggerCashFlowWebhookForUser } from '@/api/cashflow';

export const CashFlowPage: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const userEmail = (user?.email || 'swetha.s.ad.2026@snsct.org').trim();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchInvoices(userEmail);
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Failed to load invoices for cash flow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 2. Automatically trigger Cash Flow Webhook whenever Cash Flow page loads
    try {
      triggerCashFlowWebhookForUser(userEmail);
    } catch (err) {
      console.warn('Initial cash flow page mount trigger:', err);
    }

    const handleRefresh = () => {
      loadData();
    };

    window.addEventListener('rysta-invoices-refresh', handleRefresh);
    window.addEventListener('rysta-cashflow-refresh', handleRefresh);

    return () => {
      window.removeEventListener('rysta-invoices-refresh', handleRefresh);
      window.removeEventListener('rysta-cashflow-refresh', handleRefresh);
    };
  }, [userEmail]);

  const handleMarkAsPaid = async (inv: Invoice) => {
    try {
      await markInvoiceAsPaid(inv.id, userEmail);
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? { ...i, status: 'paid', balanceDue: 0, amountPaid: i.grandTotal }
            : i
        )
      );
      toast({
        title: 'Invoice Settled',
        description: `${inv.invoiceNumber} marked as Paid. Cash flow forecast updated.`,
        variant: 'success',
      });
      // 2. Automatically trigger webhook when marked as paid
      triggerCashFlowWebhookForUser(userEmail);
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <PageHeader
        title="Cash Flow & Shortage Forecasting"
        description="Live working capital simulation, 30-day liquidity forecasting, and automated cash shortage alerts"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5 h-9 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Upload Invoice PDF</span>
            </Button>
          </>
        }
      />

      {/* Interactive Cash Flow & Forecasting Section with Opening Cash input, Webhook trigger & Shortage Banner */}
      <CashFlowSection initialInvoices={invoices} />

      {/* 30-Day Liquidity Timeline & Invoices Inflow Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              30-Day Cash Inflow Schedules & Receivables
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Real invoices saved in your Supabase account driving incoming cash
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-muted-foreground">
            {invoices.length} Total Records
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground text-sm">No live invoices found</div>
              <p className="max-w-md mx-auto">
                Upload your first invoice PDF to populate receivables and forecast cash flow accurately.
              </p>
              <Button
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <FileUp className="h-3.5 w-3.5" />
                <span>Upload Invoice PDF</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Invoice #</th>
                    <th className="px-4 py-2.5">Party / Customer</th>
                    <th className="px-4 py-2.5">Issue Date</th>
                    <th className="px-4 py-2.5">Due Date</th>
                    <th className="px-4 py-2.5 text-right">Invoiced Amount</th>
                    <th className="px-4 py-2.5 text-right">Balance Due</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {inv.customerName || 'Trade Customer'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(inv.date || inv.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(inv.balanceDue) || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inv.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            PAID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(inv)}
                            className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-semibold gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Mark Paid</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice PDF Upload Modal */}
      <InvoiceUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadData}
      />
    </div>
  );
};
export default CashFlowPage;
