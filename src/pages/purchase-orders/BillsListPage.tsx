import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  FileSpreadsheet,
  CreditCard,
  Printer,
  CheckCircle,
  MoreHorizontal,
  Building,
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
import { Bill } from '@/types';
import { fetchBills } from '@/api/purchaseOrders';

export const BillsListPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchBills();
      setBills(data);
    } catch (err: any) {
      toast({ title: 'Error loading bills', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnDef<Bill>[] = [
    {
      accessorKey: 'billNumber',
      header: 'Bill #',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.billNumber}</span>
      ),
    },
    {
      accessorKey: 'poNumber',
      header: 'PO Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.poNumber || '-'}</span>
      ),
    },
    {
      accessorKey: 'supplierName',
      header: 'Supplier / Vendor',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.supplierName}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Bill Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const isPastDue = new Date(row.original.dueDate) < new Date() && row.original.balanceDue > 0;
        return (
          <span className={`text-xs ${isPastDue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {formatDate(row.original.dueDate)}
          </span>
        );
      },
    },
    {
      accessorKey: 'grandTotal',
      header: 'Bill Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{formatCurrency(row.original.grandTotal)}</span>
      ),
    },
    {
      accessorKey: 'balanceDue',
      header: 'Balance Due',
      cell: ({ row }) => (
        <span className="font-bold text-destructive">{formatCurrency(row.original.balanceDue)}</span>
      ),
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
        const bill = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Bill Actions</DropdownMenuLabel>
              {bill.balanceDue > 0 && (
                <DropdownMenuItem
                  onClick={() => navigate(`/payments/new?supplierId=${bill.supplierId}`)}
                  className="cursor-pointer text-xs font-semibold text-emerald-600"
                >
                  <CreditCard className="mr-2 h-3.5 w-3.5" /> Disburse Payment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  window.print();
                }}
                className="cursor-pointer text-xs"
              >
                <Printer className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Print Voucher
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
        title="Vendor Bills & Accounts Payable"
        description="Inward procurement invoices, settlement dues, and vendor payment tracking"
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/payments/new')}
            className="h-9 gap-1.5 text-xs"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Disburse Payout</span>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={bills}
        searchPlaceholder="Search bill #, supplier name, or PO..."
        exportFileName="fmcg-vendor-bills"
      />
    </div>
  );
};
