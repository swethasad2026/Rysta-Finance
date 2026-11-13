import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  BookOpen,
  Plus,
  Scale,
  FileText,
  Landmark,
  Receipt,
  FileCheck,
  Download,
  Upload,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Account, JournalEntry } from '@/types';
import { fetchAccounts, fetchJournalEntries, createJournalEntry, createAccount } from '@/api/accounting';
import { CashFlowSection } from '@/components/cashflow/CashFlowSection';

export const AccountingPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);

  // Account Form
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('Asset');
  const [accSubcategory, setAccSubcategory] = useState('Current Assets');

  // Journal Form
  const [jeDate, setJeDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeRef, setJeRef] = useState(`REF-${Date.now().toString().slice(-4)}`);
  const [jeNarration, setJeNarration] = useState('Adjustment for freight and warehousing accrual');
  const [jeDebitAcc, setJeDebitAcc] = useState('');
  const [jeCreditAcc, setJeCreditAcc] = useState('');
  const [jeAmount, setJeAmount] = useState<number>(25000);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accList, jeList] = await Promise.all([fetchAccounts(), fetchJournalEntries()]);
      setAccounts(accList);
      setEntries(jeList);
      if (accList.length >= 2) {
        setJeDebitAcc(accList[0].id);
        setJeCreditAcc(accList[1].id);
      }
    } catch (err: any) {
      toast({ title: 'Error loading ledger', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAccount({
        code: accCode,
        name: accName,
        type: accType,
        subcategory: accSubcategory,
        balance: 0,
        currency: 'INR',
        isCredit: accType === 'Liability' || accType === 'Equity' || accType === 'Revenue',
      });
      setAccounts([...accounts, created]);
      setAccountModalOpen(false);
      toast({ title: 'Account Added to Ledger', description: `${created.name} (${created.code}) created.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to create account', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jeDebitAcc || !jeCreditAcc || jeAmount <= 0) {
      toast({ title: 'Invalid Entry', description: 'Debit and Credit accounts must be chosen.', variant: 'destructive' });
      return;
    }

    try {
      const debitAccount = accounts.find((a) => a.id === jeDebitAcc);
      const creditAccount = accounts.find((a) => a.id === jeCreditAcc);

      const created = await createJournalEntry({
        date: jeDate,
        reference: jeRef,
        narration: jeNarration,
        status: 'posted',
        total: jeAmount,
        lines: [
          {
            id: `line-1`,
            accountId: debitAccount?.id || '',
            accountName: debitAccount?.name || 'Debit A/C',
            debit: jeAmount,
            credit: 0,
          },
          {
            id: `line-2`,
            accountId: creditAccount?.id || '',
            accountName: creditAccount?.name || 'Credit A/C',
            debit: 0,
            credit: jeAmount,
          },
        ],
      });

      setEntries([created, ...entries]);
      setJournalModalOpen(false);
      toast({ title: 'Journal Entry Posted', description: `${created.entryNumber} balanced at ${formatCurrency(jeAmount)}.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to post entry', description: err.message, variant: 'destructive' });
    }
  };

  // Trial Balance Totals
  const totalDebits = accounts
    .filter((a) => !a.isCredit)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalCredits = accounts
    .filter((a) => a.isCredit)
    .reduce((sum, a) => sum + a.balance, 0);

  // Columns for Chart of Accounts
  const accountColumns: ColumnDef<Account>[] = [
    {
      accessorKey: 'code',
      header: 'GL Code',
      cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Account Name',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.subcategory}</div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Classification',
      cell: ({ row }) => {
        const typeColors: Record<string, string> = {
          Asset: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40',
          Liability: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
          Equity: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
          Revenue: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
          Expense: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
        };
        const cls = typeColors[row.original.type] || 'text-muted-foreground';
        return <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${cls}`}>{row.original.type}</span>;
      },
    },
    {
      accessorKey: 'balance',
      header: 'Running Balance',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <span className="font-bold text-foreground">
            {formatCurrency(a.balance)} {a.isCredit ? 'Cr' : 'Dr'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Double-Entry Financial Accounting"
        description="Chart of Accounts, General Ledger, balanced Journal Vouchers, and real-time Trial Balance"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setAccountModalOpen(true)} className="h-9 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Account
            </Button>
            <Button size="sm" onClick={() => setJournalModalOpen(true)} className="h-9 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>New Journal Entry</span>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="coa" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="coa" className="text-xs">Chart of Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="journals" className="text-xs">Journal Entries ({entries.length})</TabsTrigger>
          <TabsTrigger value="trial" className="text-xs">Trial Balance</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs">Operating Expenses</TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs">Cash Flow & Forecasting</TabsTrigger>
        </TabsList>

        {/* Tab 1: Chart of Accounts */}
        <TabsContent value="coa" className="space-y-4">
          <DataTable
            columns={accountColumns}
            data={accounts}
            searchPlaceholder="Search GL code or account name..."
            exportFileName="fmcg-chart-of-accounts"
          />
        </TabsContent>

        {/* Tab 2: Journal Entries */}
        <TabsContent value="journals" className="space-y-4">
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 py-3 px-4 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">{entry.entryNumber}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                    <span className="text-xs text-muted-foreground">• Ref: {entry.reference}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Total: {formatCurrency(entry.total)}</span>
                    <StatusBadge status={entry.status} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/10 border-b text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2">General Ledger Account</th>
                          <th className="px-4 py-2 text-right">Debit (₹)</th>
                          <th className="px-4 py-2 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {entry.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-4 py-2.5 font-medium">{line.accountName}</td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              {line.debit > 0 ? formatCurrency(line.debit, false) : '-'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              {line.credit > 0 ? formatCurrency(line.credit, false) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 text-[11px] text-muted-foreground italic bg-muted/10 border-t">
                    Narration: {entry.narration}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Trial Balance */}
        <TabsContent value="trial">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Consolidated Trial Balance</CardTitle>
                <p className="text-xs text-muted-foreground">Verification of mathematical equilibrium in double-entry books</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Print Trial Balance
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Code</th>
                      <th className="px-4 py-2.5">Account Head</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5 text-right">Debit Balance (₹)</th>
                      <th className="px-4 py-2.5 text-right">Credit Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-primary font-semibold">{acc.code}</td>
                        <td className="px-4 py-2.5 font-medium">{acc.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{acc.type}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">
                          {!acc.isCredit ? formatCurrency(acc.balance, false) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">
                          {acc.isCredit ? formatCurrency(acc.balance, false) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 font-bold border-t text-sm">
                    <tr>
                      <td colSpan={3} className="px-4 py-3">Total Equilibrium Balance</td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalCredits)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Expenses */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Operational Expenses Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Logistics, warehouse leases, trade schemes, and packaging</p>
              </div>
              <Button size="sm" onClick={() => setJournalModalOpen(true)} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Log Expense
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">GL Code</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-right">MTD Incurred (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accounts.filter((a) => a.type === 'Expense').map((exp) => (
                      <tr key={exp.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold text-foreground">{exp.name}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{exp.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{exp.subcategory}</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {formatCurrency(exp.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Cash Flow & Forecasting */}
        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowSection />
        </TabsContent>
      </Tabs>

      {/* Add Account Modal */}
      <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5" /> Add General Ledger Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="GL Code" required>
                <Input
                  value={accCode}
                  onChange={(e) => setAccCode(e.target.value)}
                  placeholder="5050"
                  className="h-9 text-xs font-mono"
                  required
                />
              </FormField>

              <FormField label="Classification" required>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </FormField>
            </div>

            <FormField label="Account Title" required>
              <Input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. Inward Freight Charges"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <FormField label="Subcategory" required>
              <Input
                value={accSubcategory}
                onChange={(e) => setAccSubcategory(e.target.value)}
                placeholder="Operating Expense / Current Asset"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAccountModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create GL Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Journal Entry Modal */}
      <Dialog open={journalModalOpen} onOpenChange={setJournalModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5" /> Post Double-Entry Journal Voucher
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJournal} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Entry Date" required>
                <Input
                  type="date"
                  value={jeDate}
                  onChange={(e) => setJeDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </FormField>

              <FormField label="Voucher Ref" required>
                <Input
                  value={jeRef}
                  onChange={(e) => setJeRef(e.target.value)}
                  placeholder="JV-2024-009"
                  className="h-9 text-xs font-mono"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Debit Account (Dr)" required>
                <select
                  value={jeDebitAcc}
                  onChange={(e) => setJeDebitAcc(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Credit Account (Cr)" required>
                <select
                  value={jeCreditAcc}
                  onChange={(e) => setJeCreditAcc(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Amount to Balance (₹)" required>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={jeAmount}
                onChange={(e) => setJeAmount(Number(e.target.value))}
                className="h-9 text-xs font-bold text-primary"
                required
              />
            </FormField>

            <FormField label="Narration / Purpose" required>
              <Input
                value={jeNarration}
                onChange={(e) => setJeNarration(e.target.value)}
                placeholder="Explain the accounting adjustment..."
                className="h-9 text-xs"
                required
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJournalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Post to General Ledger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
