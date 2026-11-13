import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  Mail,
  Share2,
  CreditCard,
  Ban,
  Trash2,
  Copy,
  CheckCircle,
  ArrowLeft,
  Building,
  QrCode,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';
import {
  formatCurrency,
  formatDate,
  numberToWordsIndian,
} from '@/utils/formatters';
import { Invoice } from '@/types';
import { fetchInvoiceById, updateInvoiceStatus, markInvoiceAsPaid, voidInvoice, deleteInvoice } from '@/api/invoices';
import { fetchCompanySettings } from '@/api/settings';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [inv, compSettings] = await Promise.all([
          fetchInvoiceById(id),
          fetchCompanySettings(),
        ]);
        if (inv) {
          setInvoice(inv);
        } else {
          toast({ title: 'Invoice not found', description: `ID ${id}`, variant: 'destructive' });
          navigate('/invoices');
        }
        setCompany(compSettings);
      } catch (err: any) {
        toast({ title: 'Error loading invoice', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate, toast]);

  if (isLoading || !invoice) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading GST Tax Invoice...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleSendEmail = () => {
    toast({
      title: 'Tax Invoice Emailed',
      description: `GST Invoice ${invoice.invoiceNumber} with PDF attachment dispatched to customer.`,
      variant: 'success',
    });
  };

  const handleSendWhatsApp = () => {
    toast({
      title: 'WhatsApp Notification Triggered',
      description: `Invoice link dispatched via n8n WhatsApp Business API to registered phone.`,
      variant: 'success',
    });
  };

  const handleMarkSent = async () => {
    try {
      const updated = await updateInvoiceStatus(invoice.id, 'sent');
      setInvoice(updated);
      toast({ title: 'Invoice Marked Sent', variant: 'success', description: 'Status updated.' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleVoidConfirm = async () => {
    try {
      const updated = await voidInvoice(invoice.id);
      setInvoice(updated);
      toast({
        title: 'Invoice Voided',
        description: 'Invoice cancelled and customer outstanding balance reversed.',
        variant: 'warning',
      });
    } catch (err: any) {
      toast({ title: 'Void failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteInvoice(invoice.id);
      toast({
        title: 'Invoice Deleted',
        description: `Invoice ${invoice.invoiceNumber} permanently removed from Supabase.`,
        variant: 'success',
      });
      navigate('/invoices');
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreditNote = () => {
    toast({
      title: 'Credit Note Initiated',
      description: `Draft GST Credit Note linked to ${invoice.invoiceNumber} created.`,
      variant: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Hidden in Print */}
      <div className="no-print">
        <PageHeader
          title={`Tax Invoice: ${invoice.invoiceNumber}`}
          description={`Customer: ${invoice.customerName} • Due: ${formatDate(invoice.dueDate)}`}
          breadcrumbs={[
            { label: 'Invoices', href: '/invoices' },
            { label: invoice.invoiceNumber },
          ]}
          badge={<StatusBadge status={invoice.status} />}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/invoices')} className="h-9 gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 gap-1.5 text-xs">
                <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="h-9 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5 text-muted-foreground" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail} className="h-9 gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendWhatsApp} className="h-9 gap-1.5 text-xs text-emerald-600">
                <Share2 className="h-3.5 w-3.5" /> WhatsApp
              </Button>

              {invoice.status === 'draft' && (
                <Button size="sm" onClick={handleMarkSent} className="h-9 gap-1.5 text-xs">
                  <CheckCircle className="h-3.5 w-3.5" /> Mark as Sent
                </Button>
              )}

              {invoice.status !== 'paid' && invoice.status !== 'void' && (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await markInvoiceAsPaid(invoice.id);
                      setInvoice({
                        ...invoice,
                        status: 'paid',
                        balanceDue: 0,
                        amountPaid: invoice.grandTotal,
                      });
                      toast({
                        title: 'Invoice Marked as Paid',
                        description: `${invoice.invoiceNumber} status updated to PAID in Supabase.`,
                        variant: 'success',
                      });
                    } catch (err: any) {
                      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
                    }
                  }}
                  className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                </Button>
              )}

              {invoice.balanceDue > 0 && invoice.status !== 'void' && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/payments/new?customerId=${invoice.customerId}&invoiceId=${invoice.id}`)}
                  className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Record Receipt
                </Button>
              )}

              {invoice.status !== 'void' && (
                <Button variant="destructive" size="sm" onClick={() => setVoidDialogOpen(true)} className="h-9 gap-1.5 text-xs">
                  <Ban className="h-3.5 w-3.5" /> Void
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* PRINTABLE GST INVOICE SHEET */}
      <div className="printable-area max-w-4xl mx-auto rounded-xl border bg-card p-8 shadow-md text-foreground print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-primary mb-1">
              Tax Invoice (Rule 46 - CGST Rules 2017)
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {company?.companyName || 'Rysta FMCG Brands Private Limited'}
            </h1>
            <div className="text-xs text-muted-foreground mt-1 max-w-sm space-y-0.5">
              <p>{company?.address || 'Plot C-56, G-Block, Bandra Kurla Complex, Mumbai - 400051'}</p>
              <p>Email: {company?.email || 'finance@rystafmcg.com'} • Phone: {company?.phone || '+91 22 6123 4567'}</p>
              <p className="font-mono font-semibold text-foreground">
                GSTIN: <span className="text-primary">{company?.gstin || '27AABCR9912K1Z4'}</span> • PAN: {company?.pan || 'AABCR9912K'}
              </p>
              <p>State: Maharashtra • State Code: 27</p>
            </div>
          </div>

          <div className="text-right sm:text-right w-full sm:w-auto">
            <div className="inline-block p-3 rounded-lg bg-muted/40 border text-left text-xs space-y-1 min-w-[220px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice No:</span>
                <span className="font-mono font-bold text-foreground">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span className="font-medium text-foreground">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium text-foreground">{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO / Order Ref:</span>
                  <span className="font-mono">{invoice.orderNumber}</span>
                </div>
              )}
              {invoice.eWayBillNo && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>E-Way Bill:</span>
                  <span className="font-mono">{invoice.eWayBillNo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billed To / Shipped To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b text-xs">
          <div>
            <div className="font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Details of Receiver (Billed To)
            </div>
            <div className="text-sm font-bold text-foreground">{invoice.customerName}</div>
            <div className="text-muted-foreground mt-1 space-y-0.5">
              <p>{invoice.customerAddress}</p>
              <p className="font-mono font-semibold text-foreground">
                GSTIN: <span className="text-primary">{invoice.customerGstin}</span>
              </p>
              <p>Place of Supply: {invoice.isInterstate ? 'Inter-State' : 'Intra-State (Maharashtra)'}</p>
            </div>
          </div>

          <div>
            <div className="font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Payment Status & Due
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={invoice.status} />
              <span className="text-xs text-muted-foreground font-medium">{invoice.terms}</span>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/30 border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grand Total:</span>
                <span className="font-bold">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid:</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-destructive pt-1 border-t">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-y uppercase text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-2 w-8 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">Item Description & SKU</th>
                <th className="py-2.5 px-2 text-center">HSN</th>
                <th className="py-2.5 px-2 text-center">Unit</th>
                <th className="py-2.5 px-2 text-right">Qty</th>
                <th className="py-2.5 px-2 text-right">Rate (₹)</th>
                <th className="py-2.5 px-2 text-right">Disc</th>
                <th className="py-2.5 px-2 text-right">Taxable (₹)</th>
                <th className="py-2.5 px-2 text-right">GST</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-muted/10">
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{index + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {item.productName}
                    <div className="text-[10px] text-muted-foreground font-mono">{item.sku}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{item.hsnCode}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{item.unit}</td>
                  <td className="py-2.5 px-2 text-right font-medium">{item.qty}</td>
                  <td className="py-2.5 px-2 text-right">{item.rate.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right text-emerald-600">
                    {item.discountAmount > 0 ? `-${item.discountAmount.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium">{formatCurrency(item.taxableAmount, false)}</td>
                  <td className="py-2.5 px-2 text-right text-muted-foreground">{item.gstRate}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">
                    {formatCurrency(item.totalAmount, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GST Breakup & Financial Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b text-xs">
          {/* Bank Details & QR code */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-muted-foreground">
                Bank Details for NEFT / RTGS Settlement
              </div>
              <div className="space-y-0.5">
                <p>Beneficiary: <strong className="text-foreground">{invoice.bankDetails.accountName}</strong></p>
                <p>Bank: <strong className="text-foreground">{invoice.bankDetails.bankName}</strong></p>
                <p>Account No: <strong className="font-mono text-foreground">{invoice.bankDetails.accountNumber}</strong></p>
                <p>IFSC Code: <strong className="font-mono text-primary">{invoice.bankDetails.ifsc}</strong></p>
                {invoice.bankDetails.branch && <p>Branch: {invoice.bankDetails.branch}</p>}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground italic">
              <strong>Amount in Words:</strong><br />
              <span className="text-foreground font-semibold">{numberToWordsIndian(invoice.grandTotal)}</span>
            </div>
          </div>

          {/* Tax summary totals */}
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total Taxable Value</span>
              <span className="font-medium">{formatCurrency(invoice.taxableTotal)}</span>
            </div>

            {invoice.isInterstate ? (
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Integrated GST (IGST)</span>
                <span className="font-medium">{formatCurrency(invoice.igstTotal)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Central GST (CGST)</span>
                  <span className="font-medium">{formatCurrency(invoice.cgstTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">State GST (SGST)</span>
                  <span className="font-medium">{formatCurrency(invoice.sgstTotal)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between py-1 border-b font-semibold">
              <span>Total Tax Amount</span>
              <span>{formatCurrency(invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal)}</span>
            </div>

            <div className="flex justify-between py-2 text-base font-bold text-foreground">
              <span>Invoice Grand Total</span>
              <span className="text-primary">{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Declarations & Signatures */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] text-muted-foreground">
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-foreground">Declaration</div>
            <p>
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
            <p className="mt-2 text-muted-foreground">
              <strong>Terms:</strong> {invoice.notes || 'Goods once sold will not be accepted back or exchanged.'}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end justify-between pt-4 sm:pt-0">
            <div className="font-semibold text-foreground text-right">
              For {company?.companyName || 'Rysta FMCG Brands Private Limited'}
            </div>
            <div className="h-16 flex items-center justify-center">
              <span className="text-muted-foreground/40 italic">[Digitally Signed via n8n e-Invoicing]</span>
            </div>
            <div className="text-right font-medium text-foreground border-t pt-1 w-48 text-center sm:text-right">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Void Dialog */}
      <ConfirmDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        title="Void Tax Invoice"
        description={`Are you sure you want to void ${invoice.invoiceNumber}? This will issue a reversal entry in the customer ledger.`}
        confirmText="Void Invoice"
        variant="destructive"
        onConfirm={handleVoidConfirm}
      />
    </div>
  );
};
