import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  Users,
  FileSpreadsheet,
  Receipt,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatters';
import {
  fetchUserIncome,
  createIncomeInSupabase,
  deleteIncomeFromSupabase,
  IncomeItem,
} from '@/api/supabaseService';
import { useAuthStore } from '@/store/authStore';

const INCOME_CATEGORIES = [
  'Distributor Collection',
  'Modern Trade Retail',
  'Direct Sales',
  'Wholesale Bulk Deposit',
  'Online D2C',
  'Settlement Inflow',
  'Other',
];

const PAYMENT_MODES = ['NEFT/RTGS', 'UPI', 'Cheque', 'Cash', 'Credit Card', 'Bank Transfer'];

export const IncomePage: React.FC = () => {
  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const { toast } = useToast();

  const [incomeList, setIncomeList] = useState<IncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeItem | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Distributor Collection');
  const [paymentMode, setPaymentMode] = useState('NEFT/RTGS');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');

  const loadIncome = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserIncome(userEmail);
      setIncomeList(data);
    } catch (err: any) {
      toast({
        title: 'Error loading income',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncome();
  }, [userEmail]);

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !amount || Number(amount) <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid source description and positive amount.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const created = await createIncomeInSupabase(
        {
          source: source.trim(),
          amount: Number(amount),
          category,
          payment_mode: paymentMode,
          date,
          customer_name: customerName.trim(),
          invoice_no: invoiceNo.trim(),
          status: 'received',
        },
        userEmail
      );

      setIncomeList((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Inflow Recorded',
        description: `${created.source} (₹${created.amount.toLocaleString('en-IN')}) saved to Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to record inflow',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteIncome = async () => {
    if (!incomeToDelete) return;
    try {
      await deleteIncomeFromSupabase(incomeToDelete.id, userEmail);
      setIncomeList((prev) => prev.filter((i) => i.id !== incomeToDelete.id));
      toast({
        title: 'Inflow Removed',
        description: `${incomeToDelete.source} deleted from Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIncomeToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const resetForm = () => {
    setSource('');
    setAmount('');
    setCategory('Distributor Collection');
    setPaymentMode('NEFT/RTGS');
    setDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setInvoiceNo('');
  };

  // Metrics
  const totalIncomeAmount = incomeList.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryTotals = incomeList.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const filteredIncome = incomeList.filter((i) => {
    if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
    if (selectedPaymentMode !== 'all' && i.payment_mode !== selectedPaymentMode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.source.toLowerCase().includes(q) ||
        (i.customer_name && i.customer_name.toLowerCase().includes(q)) ||
        (i.invoice_no && i.invoice_no.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income & Realized Inflows"
        description="Live Supabase income tracking, bank deposits, distributor collections, and settlement inflows"
        actions={
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1.5 h-9 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Income / Receipt</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Realized Inflow</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalIncomeAmount)}
            </div>
            <div className="text-[11px] text-muted-foreground">{incomeList.length} verified receipts</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Top Revenue Stream</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Tag className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground truncate">
              {topCategory ? topCategory[0] : 'None'}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {topCategory ? formatCurrency(topCategory[1]) : '₹0'}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Inflow Channels</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {Object.keys(categoryTotals).length}
            </div>
            <div className="text-[11px] text-muted-foreground">Diversified cash inflows</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Database Status</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <span>Supabase Connected</span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{userEmail}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Totals Pills Bar */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-card border rounded-xl items-center">
          <span className="text-xs font-bold text-muted-foreground mr-1">Stream Inflows:</span>
          {Object.entries(categoryTotals).map(([cat, amt]) => (
            <Badge key={cat} variant="secondary" className="text-xs font-medium py-1 px-2.5 gap-1.5">
              <span>{cat}:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatCompactCurrency(amt)}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search source, customer, or invoice no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs w-64"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Channels</option>
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Payment Modes</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted-foreground font-semibold">
          {filteredIncome.length} of {incomeList.length} inflows
        </span>
      </div>

      {/* Income List Table */}
      <Card className="border shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading income receipts from Supabase...</div>
          ) : filteredIncome.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No income records yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click <strong>Add Income / Receipt</strong> to record your distributor collections, retail deposits, or direct settlement inflows.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1.5 h-8 text-xs mt-2">
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Receipt</span>
              </Button>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Source / Description</th>
                  <th className="py-3 px-4">Channel Category</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer / Invoice</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredIncome.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{inc.source}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {inc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        {inc.payment_mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">{inc.date}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {inc.customer_name || '-'} {inc.invoice_no ? `(Inv: ${inc.invoice_no})` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(inc.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIncomeToDelete(inc);
                          setDeleteConfirmOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Inflow Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add Income Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddIncome}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>Record New Inflow Receipt</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Inflow Source / Description *</label>
                <Input
                  required
                  placeholder="e.g. Modern Trade RTGS Settlement, Distributor Advance"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Amount (₹) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="75000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Receipt Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Channel Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    {INCOME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Payer / Customer</label>
                  <Input
                    placeholder="e.g. Apex Hypermarket Ltd"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Invoice Reference</label>
                  <Input
                    placeholder="e.g. INV-1002"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Save Inflow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Income Record"
        description={`Are you sure you want to remove "${incomeToDelete?.source}" (₹${incomeToDelete?.amount.toLocaleString('en-IN')}) from Supabase?`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteIncome}
      />
    </div>
  );
};
