import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Receipt,
  Building,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { Combobox, ComboboxOption } from '@/components/shared/Combobox';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Customer, Supplier, Invoice, PaymentAllocation } from '@/types';
import { fetchCustomers } from '@/api/customers';
import { fetchSuppliers } from '@/api/suppliers';
import { fetchInvoices } from '@/api/invoices';
import { createPayment } from '@/api/payments';

export const PaymentFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [paymentType, setPaymentType] = useState<'receipt' | 'payment'>(
    searchParams.get('supplierId') ? 'payment' : 'receipt'
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [partyId, setPartyId] = useState<string>(
    searchParams.get('customerId') || searchParams.get('supplierId') || ''
  );
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<'neft' | 'upi' | 'cheque' | 'cash'>('neft');
  const [referenceNo, setReferenceNo] = useState<string>(`HDFCN${Date.now().toString().slice(-8)}`);
  const [bankAccount, setBankAccount] = useState<string>('HDFC Bank - 1122');
  const [notes, setNotes] = useState<string>('');

  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cList, sList, invList] = await Promise.all([
          fetchCustomers(),
          fetchSuppliers(),
          fetchInvoices(),
        ]);
        setCustomers(cList);
        setSuppliers(sList);
        setInvoices(invList);

        const initialCustId = searchParams.get('customerId');
        const initialInvId = searchParams.get('invoiceId');

        if (initialCustId) {
          setPartyId(initialCustId);
          const custInvoices = invList.filter((i) => i.customerId === initialCustId && i.balanceDue > 0);
          if (initialInvId) {
            const targetInv = custInvoices.find((i) => i.id === initialInvId);
            if (targetInv) {
              setAmount(targetInv.balanceDue);
              setAllocations([
                {
                  invoiceId: targetInv.id,
                  invoiceNumber: targetInv.invoiceNumber,
                  invoiceTotal: targetInv.grandTotal,
                  allocatedAmount: targetInv.balanceDue,
                },
              ]);
            }
          }
        }
      } catch (err: any) {
        toast({ title: 'Error loading payment data', description: err.message, variant: 'destructive' });
      }
    };
    load();
  }, [searchParams, toast]);

  // When party changes, find open invoices
  const handlePartyChange = (id: string) => {
    setPartyId(id);
    if (paymentType === 'receipt') {
      const openInvoices = invoices.filter((i) => i.customerId === id && i.balanceDue > 0);
      const newAllocations = openInvoices.map((inv) => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceTotal: inv.grandTotal,
        allocatedAmount: 0,
      }));
      setAllocations(newAllocations);
    } else {
      setAllocations([]);
    }
  };

  // Auto-allocate button
  const handleAutoAllocate = () => {
    if (amount <= 0) {
      toast({ title: 'Enter Amount First', description: 'Please enter total received amount to auto-allocate.', variant: 'warning' });
      return;
    }

    let remaining = amount;
    const updated = allocations.map((alloc) => {
      const inv = invoices.find((i) => i.id === alloc.invoiceId);
      const due = inv ? inv.balanceDue : 0;
      if (remaining <= 0) {
        return { ...alloc, allocatedAmount: 0 };
      }
      const canPay = Math.min(remaining, due);
      remaining -= canPay;
      return { ...alloc, allocatedAmount: canPay };
    });

    setAllocations(updated);
    toast({
      title: 'Auto-Allocation Complete',
      description: `Allocated across ${updated.filter((a) => a.allocatedAmount > 0).length} open invoices FIFO.`,
      variant: 'success',
    });
  };

  const handleManualAllocChange = (index: number, val: number) => {
    const updated = [...allocations];
    updated[index].allocatedAmount = val;
    setAllocations(updated);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      toast({ title: 'Select Party', description: 'Please select a customer or supplier.', variant: 'destructive' });
      return;
    }
    if (amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Payment amount must be greater than zero.', variant: 'destructive' });
      return;
    }

    const partyName =
      paymentType === 'receipt'
        ? customers.find((c) => c.id === partyId)?.name || 'Customer'
        : suppliers.find((s) => s.id === partyId)?.name || 'Supplier';

    try {
      setIsLoading(true);
      const created = await createPayment({
        type: paymentType,
        partyId,
        partyName,
        partyType: paymentType === 'receipt' ? 'customer' : 'supplier',
        amount,
        date: paymentDate,
        mode,
        referenceNo,
        bankAccount,
        status: 'cleared',
        notes,
        allocations: allocations.filter((a) => a.allocatedAmount > 0),
      });

      toast({
        title: paymentType === 'receipt' ? 'Receipt Voucher Recorded' : 'Disbursement Recorded',
        description: `Voucher ${created.paymentNumber} of ${formatCurrency(amount)} recorded successfully.`,
        variant: 'success',
      });

      navigate('/payments');
    } catch (err: any) {
      toast({ title: 'Payment recording failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const partyOptions: ComboboxOption[] =
    paymentType === 'receipt'
      ? customers.map((c) => ({
          value: c.id,
          label: c.name,
          sublabel: `Receivable: ${formatCurrency(c.currentBalance)}`,
        }))
      : suppliers.map((s) => ({
          value: s.id,
          label: s.name,
          sublabel: `Payable: ${formatCurrency(s.currentBalance)}`,
        }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={paymentType === 'receipt' ? 'Record Customer Receipt' : 'Record Supplier Payout'}
        description="Cash/Bank vouchers, NEFT/UPI transaction reference tracking, and automated invoice allocation"
        breadcrumbs={[
          { label: 'Payments', href: '/payments' },
          { label: 'New Voucher' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/payments')} className="h-9 gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments
          </Button>
        }
      />

      {/* Type Toggle Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPaymentType('receipt');
            setPartyId('');
            setAllocations([]);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            paymentType === 'receipt'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Customer Receipt (Money In)
        </button>
        <button
          type="button"
          onClick={() => {
            setPaymentType('payment');
            setPartyId('');
            setAllocations([]);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            paymentType === 'payment'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Supplier Payment (Money Out)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voucher Metadata */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-medium text-foreground">
                {paymentType === 'receipt' ? 'Customer / Retailer *' : 'Supplier / Vendor *'}
              </label>
              <Combobox
                options={partyOptions}
                value={partyId}
                onChange={handlePartyChange}
                placeholder={paymentType === 'receipt' ? 'Search customer...' : 'Search supplier...'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Amount (₹) *</label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="50000.00"
                className="h-9 text-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Payment Date *</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Payment Mode *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="neft">NEFT / RTGS</option>
                <option value="upi">UPI (Instant Transfer)</option>
                <option value="cheque">Cheque / Demand Draft</option>
                <option value="cash">Cash in Hand</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Bank UTR / Cheque Ref No. *</label>
              <Input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. HDFCN24311089221"
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="font-medium text-foreground">Clearing Bank Account</label>
              <select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="HDFC Bank - 1122">HDFC Bank - Current A/C #50200088991122 (BKC Mumbai)</option>
                <option value="ICICI Bank - 4400">ICICI Bank - Current A/C #006005004400 (Nariman Point)</option>
                <option value="Cash Account">Cash in Hand - Central Treasury</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Allocation Section for Receipts */}
        {paymentType === 'receipt' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Allocate Against Open Invoices</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Match receipt against pending billings (Allocated: {formatCurrency(totalAllocated)} / {formatCurrency(amount)})
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoAllocate}
                className="h-8 text-xs gap-1.5 text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" /> Auto-Allocate (FIFO)
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Total Amount</th>
                      <th className="px-4 py-2.5">Balance Due</th>
                      <th className="px-4 py-2.5 w-44">Allocated Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allocations.length > 0 ? (
                      allocations.map((alloc, idx) => {
                        const inv = invoices.find((i) => i.id === alloc.invoiceId);
                        return (
                          <tr key={alloc.invoiceId} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-semibold text-primary">{alloc.invoiceNumber}</td>
                            <td className="px-4 py-3">{formatCurrency(alloc.invoiceTotal)}</td>
                            <td className="px-4 py-3 font-bold text-destructive">
                              {formatCurrency(inv ? inv.balanceDue : 0)}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={inv ? inv.balanceDue : alloc.invoiceTotal}
                                value={alloc.allocatedAmount}
                                onChange={(e) => handleManualAllocChange(idx, Number(e.target.value))}
                                className="h-8 text-xs font-semibold"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          {partyId
                            ? 'No open overdue invoices found for this customer.'
                            : 'Select a customer above to view open invoices for allocation.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/payments')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Record Payment Voucher
          </Button>
        </div>
      </form>
    </div>
  );
};
