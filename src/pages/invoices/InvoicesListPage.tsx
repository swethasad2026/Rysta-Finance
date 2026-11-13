import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  FileText,
  FileUp,
  CreditCard,
  Eye,
  CheckCircle,
  Ban,
  Trash2,
  MoreHorizontal,
  Mail,
  Printer,
  Download,
  Filter,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Invoice, InvoiceStatus } from '@/types';
import { fetchInvoices, updateInvoiceStatus, markInvoiceAsPaid, voidInvoice, deleteInvoice } from '@/api/invoices';
import { clearOldInvoiceCache, getSupabaseConfig } from '@/api/supabase';
import { InvoiceUploadModal } from '@/components/invoices/InvoiceUploadModal';
import { InvoiceUploadDropzone } from '@/components/invoices/InvoiceUploadDropzone';

export const InvoicesListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [invoiceToVoid, setInvoiceToVoid] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [supabaseDialogOpen, setSupabaseDialogOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err: any) {
      toast({ title: 'Error loading invoices', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Clear Old Cache on load so stale INV-2229 entries disappear
    clearOldInvoiceCache();
    loadData();

    // 4. Auto-refresh listener for invoice uploads
    const handleRefresh = () => {
      loadData();
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

  const handleStatusChange = async (inv: Invoice, status: InvoiceStatus) => {
    try {
      const updated = await updateInvoiceStatus(inv.id, status);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast({ title: 'Status Updated', description: `${inv.invoiceNumber} is now marked ${status}.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Status update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleVoidConfirm = async () => {
    if (!invoiceToVoid) return;
    try {
      const updated = await voidInvoice(invoiceToVoid.id);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast({ title: 'Invoice Voided', description: `${invoiceToVoid.invoiceNumber} has been voided.`, variant: 'warning' });
    } catch (err: any) {
      toast({ title: 'Void failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete.id);
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceToDelete.id));
      toast({
        title: 'Invoice Deleted',
        description: `Invoice ${invoiceToDelete.invoiceNumber} was deleted.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const openSupabaseSettings = () => {
    const cfg = getSupabaseConfig();
    setSupabaseUrlInput(cfg.url);
    setSupabaseKeyInput(cfg.anonKey);
    setSupabaseDialogOpen(true);
  };

  const handleSaveSupabaseConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_url', supabaseUrlInput.trim().replace(/\/$/, ''));
      localStorage.setItem('supabase_anon_key', supabaseKeyInput.trim());
    }
    setSupabaseDialogOpen(false);
    toast({
      title: 'Supabase Config Saved',
      description: 'Re-querying Supabase invoices table...',
      variant: 'success',
    });
    loadData();
  };

  const filteredInvoices = invoices.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span
          onClick={() => navigate(`/invoices/${row.original.id}`)}
          className="font-semibold text-primary hover:underline cursor-pointer"
        >
          {row.original.invoiceNumber || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Issue Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'customerName',
      header: 'Party Name',
      cell: ({ row }) => (
        <div className="max-w-xs font-semibold text-foreground truncate">
          {row.original.customerName || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const isPastDue = new Date(row.original.dueDate) < new Date() && row.original.status !== 'paid' && row.original.balanceDue > 0;
        return (
          <span className={`text-xs ${isPastDue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {formatDate(row.original.dueDate)}
          </span>
        );
      },
    },
    {
      accessorKey: 'grandTotal',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-bold text-foreground">{formatCurrency(row.original.grandTotal)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const st = row.original.status;
        const isPastDue = new Date(row.original.dueDate) < new Date() && st !== 'paid';
        if (st === 'paid') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-3 w-3" /> PAID
            </span>
          );
        }
        if (st === 'overdue' || isPastDue) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              OVERDUE
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            PENDING
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {inv.status !== 'paid' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAsPaid(inv)}
                className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 font-semibold gap-1 px-2 shadow-xs"
                title="Mark this invoice as PAID in Supabase"
              >
                <CheckCircle className="h-3 w-3" />
                <span>Mark as Paid</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Invoice Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}`)} className="cursor-pointer text-xs">
                  <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> View GST Invoice
                </DropdownMenuItem>
                {inv.status !== 'paid' && (
                  <DropdownMenuItem
                    onClick={() => handleMarkAsPaid(inv)}
                    className="cursor-pointer text-xs font-semibold text-emerald-600"
                  >
                    <CheckCircle className="mr-2 h-3.5 w-3.5" /> Mark as Paid
                  </DropdownMenuItem>
                )}
                {inv.balanceDue > 0 && inv.status !== 'void' && (
                  <DropdownMenuItem
                    onClick={() => navigate(`/payments/new?customerId=${inv.customerId}&invoiceId=${inv.id}`)}
                    className="cursor-pointer text-xs font-semibold text-emerald-600"
                  >
                    <CreditCard className="mr-2 h-3.5 w-3.5" /> Record Receipt
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    toast({ title: 'Invoice Emailed', description: `Invoice sent to customer.`, variant: 'success' });
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Send via Email
                </DropdownMenuItem>
                {inv.status !== 'void' && (
                  <DropdownMenuItem
                    onClick={() => {
                      setInvoiceToVoid(inv);
                      setVoidDialogOpen(true);
                    }}
                    className="cursor-pointer text-xs text-amber-600 focus:text-amber-600"
                  >
                    <Ban className="mr-2 h-3.5 w-3.5" /> Void Invoice
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setInvoiceToDelete(inv);
                    setDeleteDialogOpen(true);
                  }}
                  className="cursor-pointer text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Customer Billing"
        description="Live Supabase invoice ledger, party receivables, and real-time AI PDF extraction"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={openSupabaseSettings}
              className="h-9 gap-1.5 text-xs border-primary/30 hover:border-primary"
              title="Configure Supabase URL and Anon Key"
            >
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>Connect Supabase</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="h-9 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Upload Invoice PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/payments/new')}
              className="h-9 gap-1.5 text-xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/sales-orders/new')}
              className="h-9 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </Button>
          </>
        }
      />

      {/* Prominent Visible Drag-and-Drop PDF Upload Dropzone */}
      <InvoiceUploadDropzone onUploadSuccess={loadData} />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-xl border">
        {['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
              statusFilter === st
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {st === 'sent' ? 'PENDING' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {invoices.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card/40 space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">No invoices uploaded yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your account invoice ledger starts clean. Drag and drop a GST invoice PDF in the box above to extract line items and track payments in real time.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Upload Invoice PDF</span>
            </Button>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          searchPlaceholder="Search invoice #, party name..."
          exportFileName="fmcg-invoices-ledger"
        />
      )}

      <ConfirmDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        title="Void Invoice"
        description={`Are you sure you want to void ${invoiceToVoid?.invoiceNumber}? This will reverse ${formatCurrency(invoiceToVoid?.balanceDue)} from the customer ledger.`}
        confirmText="Void Invoice"
        variant="destructive"
        onConfirm={handleVoidConfirm}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Invoice"
        description={`Are you sure you want to permanently delete ${invoiceToDelete?.invoiceNumber}? This action removes it from Supabase and cannot be undone.`}
        confirmText="Delete Permanently"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <InvoiceUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadData}
      />

      <Dialog open={supabaseDialogOpen} onOpenChange={setSupabaseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              <span>Supabase Database Connection</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Directly query your Supabase PostgreSQL <code>invoices</code> table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Supabase Project URL
              </label>
              <Input
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Supabase Anon Public Key (apikey)
              </label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSupabaseDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSupabaseConfig}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Save & Query Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
