import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  FileText,
  CreditCard,
  BookOpen,
  Shield,
  Download,
  Mail,
  ArrowLeft,
  Plus,
  ExternalLink,
  MapPin,
  Building,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CustomerFormDialog } from './CustomerFormDialog';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Customer, Invoice, Payment } from '@/types';
import {
  fetchCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerBlock,
} from '@/api/customers';
import { fetchInvoices } from '@/api/invoices';
import { fetchPayments } from '@/api/payments';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [cust, allInvoices, allPayments] = await Promise.all([
          fetchCustomerById(id),
          fetchInvoices(),
          fetchPayments(),
        ]);

        if (cust) {
          setCustomer(cust);
          setInvoices(allInvoices.filter((inv) => inv.customerId === cust.id));
          setPayments(allPayments.filter((p) => p.partyId === cust.id));
        } else {
          toast({ title: 'Customer not found', description: `ID: ${id}`, variant: 'destructive' });
          navigate('/customers');
        }
      } catch (err: any) {
        toast({ title: 'Error loading customer details', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  if (isLoading || !customer) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading customer dossier...</div>;
  }

  const handleToggleBlock = async () => {
    try {
      const updated = await toggleCustomerBlock(customer.id);
      setCustomer(updated);
      toast({
        title: updated.status === 'blocked' ? 'Customer Blocked' : 'Customer Unblocked',
        description: `${updated.name} status is now ${updated.status}.`,
        variant: updated.status === 'blocked' ? 'warning' : 'success',
      });
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSendStatement = () => {
    toast({
      title: 'Ledger Statement Dispatched',
      description: `Account statement has been emailed to ${customer.email}.`,
      variant: 'success',
    });
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const creditUtilization = Math.min(100, Math.round((customer.currentBalance / (customer.creditLimit || 1)) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={`Code: ${customer.code} • Region: ${customer.region} • Sales Rep: ${customer.salespersonName}`}
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: customer.name },
        ]}
        badge={<StatusBadge status={customer.status} />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 h-9 text-xs">
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendStatement} className="gap-1.5 h-9 text-xs">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Send Statement</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5 h-9 text-xs">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Download PDF</span>
            </Button>
            <Button
              variant={customer.status === 'active' ? 'destructive' : 'success'}
              size="sm"
              onClick={handleToggleBlock}
              className="gap-1.5 h-9 text-xs"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>{customer.status === 'active' ? 'Block Account' : 'Unblock Account'}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/invoices/new?customerId=${customer.id}`)}
              className="gap-1.5 h-9 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </Button>
          </>
        }
      />

      {/* Financial Health Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Outstanding Receivables</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(customer.currentBalance)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {invoices.filter((i) => i.balanceDue > 0).length} unpaid / partial invoices
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Sanctioned Credit Limit</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(customer.creditLimit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {customer.paymentTerms} ({customer.creditPeriodDays} days credit)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
              <span>Credit Utilization</span>
              <span className="font-bold text-foreground">{creditUtilization}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-500 ${
                  creditUtilization > 90 ? 'bg-destructive' : creditUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${creditUtilization}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Available buffer: {formatCurrency(Math.max(0, customer.creditLimit - customer.currentBalance))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payments & Receipts ({payments.length})</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs">Ledger Statement</TabsTrigger>
          <TabsTrigger value="credit" className="text-xs">Credit & Terms</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Business & Tax Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Legal Trade Name</span>
                  <span className="font-medium text-foreground">{customer.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Customer Type</span>
                  <span className="font-medium text-foreground capitalize">{customer.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">GSTIN</span>
                  <span className="font-mono font-bold text-primary">{customer.gstin}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Permanent Account No. (PAN)</span>
                  <span className="font-mono font-medium">{customer.pan || customer.gstin.slice(2, 12)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Onboarding Date</span>
                  <span>{formatDate(customer.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Billing / Dispatch Address</span>
                  <span className="font-medium text-right text-foreground max-w-xs">{customer.address}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Location</span>
                  <span>{customer.city}, {customer.state} - {customer.pincode}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-primary">{customer.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{customer.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Territory Representative</span>
                  <span className="font-semibold text-foreground">{customer.salespersonName}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Customer Invoices</CardTitle>
              <Button size="sm" onClick={() => navigate(`/invoices/new?customerId=${customer.id}`)} className="text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> New Invoice
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Grand Total</th>
                      <th className="px-4 py-2.5">Balance Due</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-primary">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3">{formatDate(inv.date)}</td>
                          <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(inv.grandTotal)}</td>
                          <td className="px-4 py-3 font-semibold text-destructive">{formatCurrency(inv.balanceDue)}</td>
                          <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/invoices/${inv.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No invoices generated for this customer yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Payments */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Payment Receipts</CardTitle>
              <Button size="sm" onClick={() => navigate(`/payments/new?customerId=${customer.id}`)} className="text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Record Receipt
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Receipt #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Mode</th>
                      <th className="px-4 py-2.5">Ref No.</th>
                      <th className="px-4 py-2.5">Amount Paid</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-primary">{p.paymentNumber}</td>
                          <td className="px-4 py-3">{formatDate(p.date)}</td>
                          <td className="px-4 py-3 uppercase font-medium">{p.mode}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{p.referenceNo}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No payment receipts recorded for this customer yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Ledger Statement */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Account Statement & Ledger</CardTitle>
                <p className="text-xs text-muted-foreground">Chronological audit of debits (invoices) and credits (receipts)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="h-8 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleSendStatement} className="h-8 text-xs gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Ref No.</th>
                      <th className="px-4 py-2.5">Particulars / Narration</th>
                      <th className="px-4 py-2.5 text-right">Debit (₹)</th>
                      <th className="px-4 py-2.5 text-right">Credit (₹)</th>
                      <th className="px-4 py-2.5 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="bg-muted/10 font-semibold">
                      <td className="px-4 py-2.5">01/01/2024</td>
                      <td className="px-4 py-2.5">-</td>
                      <td className="px-4 py-2.5">Opening Balance</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                      <td className="px-4 py-2.5 text-right">₹0.00 Dr</td>
                    </tr>
                    {invoices.map((inv) => (
                      <tr key={`dr-${inv.id}`} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5">{formatDate(inv.date)}</td>
                        <td className="px-4 py-2.5 font-semibold text-primary">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2.5">Sales Invoice Dispatched</td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(inv.grandTotal, false)}</td>
                        <td className="px-4 py-2.5 text-right">-</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(inv.grandTotal, false)} Dr
                        </td>
                      </tr>
                    ))}
                    {payments.map((p) => (
                      <tr key={`cr-${p.id}`} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5">{formatDate(p.date)}</td>
                        <td className="px-4 py-2.5 font-semibold text-emerald-600">{p.paymentNumber}</td>
                        <td className="px-4 py-2.5">Payment Received via {p.mode.toUpperCase()} ({p.referenceNo})</td>
                        <td className="px-4 py-2.5 text-right">-</td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-600">
                          {formatCurrency(p.amount, false)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(customer.currentBalance, false)} Dr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-3">Closing Net Receivables</td>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm text-primary">
                        {formatCurrency(customer.currentBalance)} Dr
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Credit & Terms */}
        <TabsContent value="credit">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Credit Policies & Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground">Standard Terms</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Customer is permitted {customer.creditPeriodDays} days payment credit window under {customer.paymentTerms}. Invoices overdue beyond 15 days incur 18% p.a. delayed payment finance charges under the FMCG Supply Agreement.
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground">Credit Monitoring Status</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Account is currently <strong className="text-foreground capitalize">{customer.status}</strong>. When credit limit exceeds 100%, automated sales order dispatch hold triggers in the ERP.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={customer}
        onSave={async (data) => {
          const updated = await updateCustomer(customer.id, data);
          setCustomer(updated);
          toast({ title: 'Customer Profile Saved', variant: 'success', description: `${updated.name} updated.` });
        }}
      />
    </div>
  );
};
