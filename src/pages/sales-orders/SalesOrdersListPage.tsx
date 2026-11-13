import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  ShoppingCart,
  CheckCircle,
  Truck,
  FileText,
  XCircle,
  MoreHorizontal,
  Eye,
  Copy,
  Printer,
  Mail,
  AlertTriangle,
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { SalesOrder, SalesOrderStatus } from '@/types';
import {
  fetchSalesOrders,
  updateSalesOrderStatus,
  convertOrderToInvoice,
} from '@/api/salesOrders';

export const SalesOrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [actionType, setActionType] = useState<'convert' | 'cancel' | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSalesOrders();
      setOrders(data);
    } catch (err: any) {
      toast({ title: 'Error loading orders', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (order: SalesOrder, newStatus: SalesOrderStatus) => {
    try {
      const updated = await updateSalesOrderStatus(order.id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast({
        title: 'Order Status Updated',
        description: `${order.orderNumber} is now marked as ${newStatus}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Status update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleConvertToInvoice = async (order: SalesOrder) => {
    try {
      const newInvoice = await convertOrderToInvoice(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'invoiced' } : o))
      );
      toast({
        title: 'Converted to Invoice',
        description: `Generated Invoice ${newInvoice.invoiceNumber} from ${order.orderNumber}.`,
        variant: 'success',
      });
      navigate(`/invoices/${newInvoice.id}`);
    } catch (err: any) {
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' });
    }
  };

  const handlePrint = (order: SalesOrder) => {
    toast({ title: 'Printing Order', description: `Opening print dialogue for ${order.orderNumber}...`, variant: 'info' });
    window.print();
  };

  const handleEmail = (order: SalesOrder) => {
    toast({
      title: 'Email Sent',
      description: `Sales confirmation for ${order.orderNumber} emailed to ${order.customerName}.`,
      variant: 'success',
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Order Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="max-w-xs">
            <div className="font-medium text-foreground truncate">{o.customerName}</div>
            <div className="text-xs text-muted-foreground">GSTIN: {o.customerGstin || '-'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => `${row.original.items.length} SKUs`,
    },
    {
      accessorKey: 'grandTotal',
      header: 'Grand Total',
      cell: ({ row }) => (
        <span className="font-bold text-foreground">{formatCurrency(row.original.grandTotal)}</span>
      ),
    },
    {
      accessorKey: 'expectedDeliveryDate',
      header: 'Exp. Delivery',
      cell: ({ row }) => formatDate(row.original.expectedDeliveryDate),
    },
    {
      accessorKey: 'status',
      header: 'Order Status',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={o.status} />
            {o.creditWarning && (
              <span title="Credit limit exceeded" className="text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">Order Actions</DropdownMenuLabel>
              {order.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange(order, 'confirmed')} className="cursor-pointer text-xs">
                  <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Confirm Order
                </DropdownMenuItem>
              )}
              {order.status === 'confirmed' && (
                <DropdownMenuItem onClick={() => handleStatusChange(order, 'dispatched')} className="cursor-pointer text-xs">
                  <Truck className="mr-2 h-3.5 w-3.5 text-pink-600 dark:text-pink-400" /> Mark Dispatched
                </DropdownMenuItem>
              )}
              {order.status === 'dispatched' && (
                <DropdownMenuItem onClick={() => handleStatusChange(order, 'delivered')} className="cursor-pointer text-xs">
                  <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Mark Delivered
                </DropdownMenuItem>
              )}
              {(order.status === 'confirmed' || order.status === 'dispatched' || order.status === 'delivered') && (
                <DropdownMenuItem onClick={() => handleConvertToInvoice(order)} className="cursor-pointer text-xs font-semibold text-primary">
                  <FileText className="mr-2 h-3.5 w-3.5" /> Convert to Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePrint(order)} className="cursor-pointer text-xs">
                <Printer className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Print Picklist / Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEmail(order)} className="cursor-pointer text-xs">
                <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Email Confirmation
              </DropdownMenuItem>
              {order.status !== 'cancelled' && order.status !== 'invoiced' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, 'cancelled')}
                    className="cursor-pointer text-xs text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel Order
                  </DropdownMenuItem>
                </>
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
        title="Sales Orders & Bookings"
        description="FMCG distributor order flow: Draft -> Confirmed -> Dispatched -> Delivered -> Invoiced"
        actions={
          <Button size="sm" onClick={() => navigate('/sales-orders/new')} className="h-9 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Sales Order</span>
          </Button>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-xl border">
        {['all', 'draft', 'confirmed', 'dispatched', 'delivered', 'invoiced', 'cancelled'].map((st) => (
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
        data={filteredOrders}
        searchPlaceholder="Search order number or customer name..."
        exportFileName="fmcg-sales-orders"
      />
    </div>
  );
};
