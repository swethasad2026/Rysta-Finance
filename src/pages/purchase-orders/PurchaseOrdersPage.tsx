import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  ClipboardList,
  CheckCircle,
  Send,
  Boxes,
  FileSpreadsheet,
  XCircle,
  MoreHorizontal,
  Printer,
  Download,
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
import { PurchaseOrder, PurchaseOrderStatus } from '@/types';
import {
  fetchPurchaseOrders,
  updatePurchaseOrderStatus,
  convertPOToBill,
} from '@/api/purchaseOrders';

export const PurchaseOrdersPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPurchaseOrders();
      setPurchaseOrders(data);
    } catch (err: any) {
      toast({ title: 'Error loading purchase orders', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (po: PurchaseOrder, newStatus: PurchaseOrderStatus) => {
    try {
      const updated = await updatePurchaseOrderStatus(po.id, newStatus);
      setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast({
        title: 'PO Status Updated',
        description: `${po.poNumber} marked as ${newStatus}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Status change failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleConvertToBill = async (po: PurchaseOrder) => {
    try {
      const bill = await convertPOToBill(po.id);
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === po.id ? { ...p, status: 'billed' } : p))
      );
      toast({
        title: 'Vendor Bill Created',
        description: `Bill ${bill.billNumber} created for ${po.supplierName}.`,
        variant: 'success',
      });
      navigate('/bills');
    } catch (err: any) {
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' });
    }
  };

  const handlePrint = (po: PurchaseOrder) => {
    toast({ title: 'Printing PO', description: `Opening print window for ${po.poNumber}...`, variant: 'info' });
    window.print();
  };

  const filtered = purchaseOrders.filter((po) => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    return true;
  });

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: 'poNumber',
      header: 'PO #',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.original.poNumber}</span>,
    },
    {
      accessorKey: 'date',
      header: 'PO Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'supplierName',
      header: 'Vendor / Supplier',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.supplierName}</span>,
    },
    {
      accessorKey: 'expectedDate',
      header: 'Expected Arrival',
      cell: ({ row }) => formatDate(row.original.expectedDate),
    },
    {
      accessorKey: 'items',
      header: 'SKUs',
      cell: ({ row }) => `${row.original.items.length} items`,
    },
    {
      accessorKey: 'grandTotal',
      header: 'Total Value',
      cell: ({ row }) => (
        <span className="font-bold text-foreground">{formatCurrency(row.original.grandTotal)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Workflow Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const po = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">PO Workflow</DropdownMenuLabel>
              {po.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange(po, 'approved')} className="cursor-pointer text-xs">
                  <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Approve PO
                </DropdownMenuItem>
              )}
              {po.status === 'approved' && (
                <DropdownMenuItem onClick={() => handleStatusChange(po, 'sent')} className="cursor-pointer text-xs">
                  <Send className="mr-2 h-3.5 w-3.5 text-pink-600 dark:text-pink-400" /> Send to Supplier
                </DropdownMenuItem>
              )}
              {po.status === 'sent' && (
                <DropdownMenuItem onClick={() => handleStatusChange(po, 'received')} className="cursor-pointer text-xs">
                  <Boxes className="mr-2 h-3.5 w-3.5 text-amber-500" /> Mark Received (GRN)
                </DropdownMenuItem>
              )}
              {po.status === 'received' && (
                <DropdownMenuItem onClick={() => handleConvertToBill(po)} className="cursor-pointer text-xs font-semibold text-primary">
                  <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Convert to Vendor Bill
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePrint(po)} className="cursor-pointer text-xs">
                <Printer className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Print Purchase Order
              </DropdownMenuItem>
              {po.status !== 'cancelled' && po.status !== 'billed' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange(po, 'cancelled')}
                  className="cursor-pointer text-xs text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel PO
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders (Procurement)"
        description="Raw materials & packaged inventory replenishment lifecycle: Draft -> Approved -> Sent -> Received -> Billed"
        actions={
          <Button size="sm" onClick={() => navigate('/purchase-orders/new')} className="h-9 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Purchase Order</span>
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-xl border">
        {['all', 'draft', 'approved', 'sent', 'received', 'billed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
              statusFilter === st
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search PO #, supplier name..."
        exportFileName="fmcg-purchase-orders"
      />
    </div>
  );
};
