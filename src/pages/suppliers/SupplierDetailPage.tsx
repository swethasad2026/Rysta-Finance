import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  Edit,
  Trash2,
  Building,
  CreditCard,
  ClipboardList,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Landmark,
  Download,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SupplierFormDialog } from './SupplierFormDialog';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Supplier, PurchaseOrder, Bill, Payment } from '@/types';
import { fetchSupplierById, updateSupplier } from '@/api/suppliers';
import { fetchPurchaseOrders, fetchBills } from '@/api/purchaseOrders';
import { fetchPayments } from '@/api/payments';

export const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [supp, allPOs, allBills, allPayments] = await Promise.all([
          fetchSupplierById(id),
          fetchPurchaseOrders(),
          fetchBills(),
          fetchPayments(),
        ]);

        if (supp) {
          setSupplier(supp);
          setPurchaseOrders(allPOs.filter((po) => po.supplierId === supp.id));
          setBills(allBills.filter((b) => b.supplierId === supp.id));
          setPayments(allPayments.filter((p) => p.partyId === supp.id));
        } else {
          toast({ title: 'Supplier not found', description: `ID: ${id}`, variant: 'destructive' });
          navigate('/suppliers');
        }
      } catch (err: any) {
        toast({ title: 'Error loading supplier', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate, toast]);

  if (isLoading || !supplier) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading supplier dossier...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description={`Code: ${supplier.code} • Terms: ${supplier.paymentTerms} • GSTIN: ${supplier.gstin}`}
        breadcrumbs={[
          { label: 'Suppliers', href: '/suppliers' },
          { label: supplier.name },
        ]}
        badge={<StatusBadge status={supplier.status} />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 h-9 text-xs">
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/payments/new?supplierId=${supplier.id}`)}
              className="gap-1.5 h-9 text-xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Disburse Payment</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/purchase-orders/new?supplierId=${supplier.id}`)}
              className="gap-1.5 h-9 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New PO</span>
            </Button>
          </>
        }
      />

      {/* Payables Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Outstanding Accounts Payable</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(supplier.currentBalance)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {bills.filter((b) => b.balanceDue > 0).length} pending supplier bills
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Total Orders Placed</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {purchaseOrders.length} POs
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Lifetime procurement: {formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Bank Clearing Account</div>
            <div className="text-sm font-bold text-foreground mt-1">
              {supplier.bankDetails.bankName}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">
              {supplier.bankDetails.ifsc} • #{supplier.bankDetails.accountNumber}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs">Overview & Bank</TabsTrigger>
          <TabsTrigger value="pos" className="text-xs">Purchase Orders ({purchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="bills" className="text-xs">Bills & Invoices ({bills.length})</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payment Payouts ({payments.length})</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs">Vendor Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Vendor Entity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Supplier Code</span>
                  <span className="font-semibold text-primary">{supplier.code}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">GSTIN</span>
                  <span className="font-mono font-bold text-foreground">{supplier.gstin}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Payment Terms</span>
                  <span className="font-medium text-foreground">{supplier.paymentTerms}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right max-w-xs">{supplier.address}, {supplier.city}, {supplier.state} - {supplier.pincode}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Contact Email & Phone</span>
                  <span>{supplier.email} • {supplier.phone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Bank Account Details (Payouts)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Beneficiary Name</span>
                  <span className="font-medium text-foreground">{supplier.bankDetails.accountName}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-medium text-foreground">{supplier.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-mono font-bold text-foreground">{supplier.bankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">IFSC Code</span>
                  <span className="font-mono font-bold text-primary">{supplier.bankDetails.ifsc}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Branch</span>
                  <span>{supplier.bankDetails.branch}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Purchase Orders Placed</CardTitle>
              <Button size="sm" onClick={() => navigate(`/purchase-orders/new?supplierId=${supplier.id}`)} className="text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> New PO
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">PO #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Expected Delivery</th>
                      <th className="px-4 py-2.5">Grand Total</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {purchaseOrders.length > 0 ? (
                      purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-primary">{po.poNumber}</td>
                          <td className="px-4 py-3">{formatDate(po.date)}</td>
                          <td className="px-4 py-3">{formatDate(po.expectedDate)}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(po.grandTotal)}</td>
                          <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => navigate('/purchase-orders')}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No purchase orders placed with this vendor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Vendor Invoices & Bills</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Bill #</th>
                      <th className="px-4 py-2.5">PO Ref</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Total Amount</th>
                      <th className="px-4 py-2.5">Balance Due</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bills.length > 0 ? (
                      bills.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-primary">{b.billNumber}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{b.poNumber || '-'}</td>
                          <td className="px-4 py-3">{formatDate(b.date)}</td>
                          <td className="px-4 py-3">{formatDate(b.dueDate)}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(b.grandTotal)}</td>
                          <td className="px-4 py-3 font-bold text-destructive">{formatCurrency(b.balanceDue)}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No vendor bills registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Disbursements & Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Voucher #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Mode</th>
                      <th className="px-4 py-2.5">Bank Ref</th>
                      <th className="px-4 py-2.5">Amount Disbursed</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-primary">{p.paymentNumber}</td>
                          <td className="px-4 py-3">{formatDate(p.date)}</td>
                          <td className="px-4 py-3 uppercase">{p.mode}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{p.referenceNo}</td>
                          <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No payouts disbursed to this supplier yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Vendor Accounts Payable Ledger</CardTitle>
              <p className="text-xs text-muted-foreground">Credits (purchases) vs Debits (payments)</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Doc Ref</th>
                      <th className="px-4 py-2.5">Particulars</th>
                      <th className="px-4 py-2.5 text-right">Debit (Payment)</th>
                      <th className="px-4 py-2.5 text-right">Credit (Bill)</th>
                      <th className="px-4 py-2.5 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bills.map((b) => (
                      <tr key={`bill-${b.id}`} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5">{formatDate(b.date)}</td>
                        <td className="px-4 py-2.5 font-semibold text-primary">{b.billNumber}</td>
                        <td className="px-4 py-2.5">Materials Inward Received</td>
                        <td className="px-4 py-2.5 text-right">-</td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(b.grandTotal, false)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(b.grandTotal, false)} Cr
                        </td>
                      </tr>
                    ))}
                    {payments.map((p) => (
                      <tr key={`payout-${p.id}`} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5">{formatDate(p.date)}</td>
                        <td className="px-4 py-2.5 font-semibold text-emerald-600">{p.paymentNumber}</td>
                        <td className="px-4 py-2.5">Bank Payout via {p.mode.toUpperCase()} ({p.referenceNo})</td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-600">
                          {formatCurrency(p.amount, false)}
                        </td>
                        <td className="px-4 py-2.5 text-right">-</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(supplier.currentBalance, false)} Cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-3">Closing Net Payables</td>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm text-foreground">
                        {formatCurrency(supplier.currentBalance)} Cr
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={supplier}
        onSave={async (data) => {
          const updated = await updateSupplier(supplier.id, data);
          setSupplier(updated);
          toast({ title: 'Supplier Profile Updated', variant: 'success', description: `${updated.name} updated.` });
        }}
      />
    </div>
  );
};
