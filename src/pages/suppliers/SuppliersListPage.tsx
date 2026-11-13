import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Truck,
  Building,
  MoreHorizontal,
  Landmark,
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
import { SupplierFormDialog } from './SupplierFormDialog';
import { formatCurrency } from '@/utils/formatters';
import { Supplier } from '@/types';
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/api/suppliers';

export const SuppliersListPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      toast({ title: 'Error loading suppliers', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSupplier = async (formData: any) => {
    try {
      if (selectedSupplier) {
        const updated = await updateSupplier(selectedSupplier.id, formData);
        setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast({ title: 'Supplier Updated', description: `${updated.name} updated.`, variant: 'success' });
      } else {
        const created = await createSupplier(formData);
        setSuppliers((prev) => [created, ...prev]);
        toast({ title: 'Supplier Registered', description: `${created.name} added.`, variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteSupplier(supplierToDelete.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
      toast({ title: 'Supplier Removed', description: `${supplierToDelete.name} removed.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Vendor / Supplier Name',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="max-w-xs">
            <div
              onClick={() => navigate(`/suppliers/${s.id}`)}
              className="font-semibold text-foreground hover:text-primary cursor-pointer truncate"
            >
              {s.name}
            </div>
            <div className="text-xs text-muted-foreground">{s.city}, {s.state} • GSTIN: {s.gstin}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'bankDetails',
      header: 'Bank & IFSC',
      cell: ({ row }) => {
        const b = row.original.bankDetails;
        return (
          <div className="text-xs">
            <div className="font-medium text-foreground">{b.bankName}</div>
            <div className="text-[11px] font-mono text-muted-foreground">{b.ifsc} • #{b.accountNumber.slice(-4)}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'paymentTerms',
      header: 'Terms',
      cell: ({ row }) => <span className="text-xs">{row.original.paymentTerms}</span>,
    },
    {
      accessorKey: 'currentBalance',
      header: 'Accounts Payable',
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(row.original.currentBalance)}
        </span>
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
        const supp = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Vendor Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/suppliers/${supp.id}`)} className="cursor-pointer text-xs">
                <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                View Dossier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedSupplier(supp);
                  setFormOpen(true);
                }}
                className="cursor-pointer text-xs"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/purchase-orders/new?supplierId=${supp.id}`)}
                className="cursor-pointer text-xs"
              >
                <Plus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Create PO
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSupplierToDelete(supp);
                  setDeleteConfirmOpen(true);
                }}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Supplier
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
        title="FMCG Suppliers & Raw Material Vendors"
        description="Agro commodity mills, packaging manufacturers, edible oil processors and freight suppliers"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setSelectedSupplier(null);
              setFormOpen(true);
            }}
            className="h-9 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Supplier</span>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={suppliers}
        searchPlaceholder="Search supplier name, code, GSTIN or city..."
        exportFileName="fmcg-suppliers-master"
      />

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={selectedSupplier}
        onSave={handleSaveSupplier}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Supplier"
        description={`Are you sure you want to delete ${supplierToDelete?.name}? Ensure all pending bills are settled.`}
        confirmText="Delete Supplier"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
