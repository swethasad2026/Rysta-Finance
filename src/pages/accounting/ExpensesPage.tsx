import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  Building,
  FileSpreadsheet,
  Upload,
  Receipt,
  Layers,
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
  fetchUserExpenses,
  createExpenseInSupabase,
  deleteExpenseFromSupabase,
  ExpenseItem,
} from '@/api/supabaseService';
import { useAuthStore } from '@/store/authStore';

const EXPENSE_CATEGORIES = [
  'Ingredients',
  'Packaging',
  'Logistics',
  'Payroll',
  'Utilities',
  'Marketing',
  'Rent',
  'Operations',
  'Software',
  'Other',
];

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Credit Card', 'Cheque', 'NEFT/RTGS'];

export const ExpensesPage: React.FC = () => {
  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operations');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendor, setVendor] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserExpenses(userEmail);
      setExpenses(data);
    } catch (err: any) {
      toast({
        title: 'Error loading expenses',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [userEmail]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid title and positive expense amount.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const created = await createExpenseInSupabase(
        {
          title: title.trim(),
          amount: Number(amount),
          category,
          payment_mode: paymentMode,
          date,
          vendor: vendor.trim(),
          reference_no: referenceNo.trim(),
          status: 'paid',
        },
        userEmail
      );

      setExpenses((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Expense Recorded',
        description: `${created.title} (₹${created.amount.toLocaleString('en-IN')}) saved to Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to record expense',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpenseFromSupabase(expenseToDelete.id, userEmail);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      toast({
        title: 'Expense Deleted',
        description: `${expenseToDelete.title} removed from Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setExpenseToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('Operations');
    setPaymentMode('Bank Transfer');
    setDate(new Date().toISOString().split('T')[0]);
    setVendor('');
    setReferenceNo('');
  };

  // Metrics
  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Category totals
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (selectedPaymentMode !== 'all' && e.payment_mode !== selectedPaymentMode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        (e.reference_no && e.reference_no.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses & Outflows"
        description="Live Supabase OpEx tracking, ingredient procurement, logistics, and payment mode settlements"
        actions={
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1.5 h-9 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Expenditure</span>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {formatCurrency(totalExpenseAmount)}
            </div>
            <div className="text-[11px] text-muted-foreground">{expenses.length} recorded line items</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Top Outflow Category</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
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
              <span className="text-xs font-semibold text-muted-foreground">Active Categories</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {Object.keys(categoryTotals).length}
            </div>
            <div className="text-[11px] text-muted-foreground">Diversified expense allocation</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Database Status</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
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
          <span className="text-xs font-bold text-muted-foreground mr-1">Category Totals:</span>
          {Object.entries(categoryTotals).map(([cat, amt]) => (
            <Badge key={cat} variant="secondary" className="text-xs font-medium py-1 px-2.5 gap-1.5">
              <span>{cat}:</span>
              <span className="font-mono font-bold text-foreground">{formatCompactCurrency(amt)}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search expense description, vendor, or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs w-64"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
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
          {filteredExpenses.length} of {expenses.length} expenses
        </span>
      </div>

      {/* Expenses List Table */}
      <Card className="border shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading expenses from Supabase...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No expenses recorded yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click the <strong>Add Expense</strong> button to record your raw materials, ingredients, or operational outflows.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1.5 h-8 text-xs mt-2">
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Expense</span>
              </Button>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor / Ref</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{exp.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        {exp.payment_mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">{exp.date}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {exp.vendor || '-'} {exp.reference_no ? `(${exp.reference_no})` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpenseToDelete(exp);
                          setDeleteConfirmOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Expense"
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

      {/* Add Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddExpense}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                <span>Record New Expense</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description / Title *</label>
                <Input
                  required
                  placeholder="e.g. Cocoa Powder 50kg Sack, Factory Electric Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                    placeholder="25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Expense Date</label>
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
                  <label className="font-semibold text-foreground">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
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
                  <label className="font-semibold text-foreground">Vendor / Payee</label>
                  <Input
                    placeholder="e.g. Southern Dairy Mill"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Reference / Cheque No.</label>
                  <Input
                    placeholder="e.g. UPI-998811, CHQ-2001"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                Save Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Expense"
        description={`Are you sure you want to remove "${expenseToDelete?.title}" (₹${expenseToDelete?.amount.toLocaleString('en-IN')}) from Supabase?`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteExpense}
      />
    </div>
  );
};
