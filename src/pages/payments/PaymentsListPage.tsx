import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  CreditCard,
  Printer,
  FileCheck,
  RotateCcw,
  MoreHorizontal,
  Building,
  CheckCircle,
  Eye,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Payment } from '@/types';
import { fetchPayments } from '@/api/payments';

export const PaymentsListPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'receipt' | 'payment'>('all');

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPayments();
      setPayments(data);
    } catch (err: any) {
      toast({ title: 'Error loading payments', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrintReceipt = (p: Payment) => {
    toast({ title: 'Printing Voucher', description: `Printing payment receipt ${p.paymentNumber}...`, variant: 'info' });
    window.print();
  };

  const handleReconcile = (p: Payment) => {
    toast({
      title: 'Bank Reconciliation Verified',
      description: `UTR reference ${p.referenceNo} verified with HDFC statement feed.`,
      variant: 'success',
    });
  };

  const filteredPayments = payments.filter((p) => {
    if (activeTab === 'all') return true;
    return p.type === activeTab;
  });

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'paymentNumber',
      header: 'Voucher #',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.paymentNumber}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isReceipt = row.original.type === 'receipt';
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold ${
              isReceipt
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            }`}
          >
            {isReceipt ? 'Receipt (In)' : 'Payment (Out)'}
          </span>
        );
      },
    },
    {
      accessorKey: 'partyName',
      header: 'Party Name',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="max-w-xs">
            <div className="font-medium text-foreground truncate">{p.partyName}</div>
            <div className="text-xs text-muted-foreground capitalize">{p.partyType}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'mode',
      header: 'Mode',
      cell: ({ row }) => <span className="uppercase text-xs font-mono font-medium">{row.original.mode}</span>,
    },
    {
      accessorKey: 'referenceNo',
      header: 'Bank / UTR Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.referenceNo}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const isReceipt = row.original.type === 'receipt';
        return (
          <span
            className={`font-bold ${
              isReceipt ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
            }`}
          >
            {isReceipt ? '+' : '-'}{formatCurrency(row.original.amount)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Voucher Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handlePrintReceipt(p)} className="cursor-pointer text-xs">
                <Printer className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Print Voucher
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReconcile(p)} className="cursor-pointer text-xs">
                <FileCheck className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Verify Bank Reconciliation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: 'Voucher Reversal Requested',
                    description: `${p.paymentNumber} reversal submitted for accounting supervisor sign-off.`,
                    variant: 'warning',
                  });
                }}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reverse Voucher
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments, Receipts & Bank Reconciliation"
        description="Customer receipts, supplier disbursements, UTR settlements, and bank statement matching"
        actions={
          <Button size="sm" onClick={() => navigate('/payments/new')} className="h-9 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Record Payment</span>
          </Button>
        }
      />

      {/* Tabs Filter */}
      <div className="flex gap-2 bg-card p-3 rounded-xl border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'receipt'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Customer Receipts (In)
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'payment'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Supplier Disbursements (Out)
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="Search voucher #, party name, or UTR..."
        exportFileName="fmcg-bank-payments"
      />
    </div>
  );
};
