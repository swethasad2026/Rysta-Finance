import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle2,
  Users,
  Upload,
  MoreHorizontal,
  Mail,
  Phone,
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
import { CustomerFormDialog } from './CustomerFormDialog';
import { formatCurrency } from '@/utils/formatters';
import { Customer } from '@/types';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerBlock,
  bulkImportCustomers,
} from '@/api/customers';
import { useAuthStore } from '@/store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const CustomersListPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Bulk Import state
  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'customer_code,company_name,city,state,gstin,channel_type,region,credit_limit,current_outstanding,account_manager,status\n' +
      'DIST-WEST-01,Apex Wholesale Distribution,Mumbai,Maharashtra,27AABCA1234F1ZX,distributor,West Zone,500000,120000,Vikram Malhotra,active\n' +
      'MT-RETAIL-02,Spencers Hypermarkets Ltd,Bengaluru,Karnataka,29AABCS5678H1ZU,modern_trade,South Zone,1000000,450000,Rajesh Sharma,active\n' +
      'KIRANA-GT-03,Shree Ganesh Kirana Stores,Ahmedabad,Gujarat,24AABCG9012J1ZY,retailer,West Zone,150000,175000,Sales Team,active';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fmcg-customers-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Template Downloaded',
      description: 'fmcg-customers-import-template.csv saved with standard headers.',
      variant: 'success',
    });
  };

  const handleExecuteImport = async () => {
    if (!importFile) {
      toast({ title: 'No File Selected', description: 'Please select a CSV file.', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        throw new Error('CSV file is empty or only contains headers.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
      const parsedCustomers: Partial<Customer>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        if (values.length < 2) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        parsedCustomers.push({
          code: row.customer_code || row.code || `CUST-IMP-${i}`,
          name: row.company_name || row.name || 'Unnamed Partner',
          type: (row.channel_type || row.type || 'distributor') as any,
          gstin: row.gstin || '',
          region: row.region || row.territory || 'West Zone',
          address: row.address || '',
          city: row.city || 'Mumbai',
          state: row.state || 'Maharashtra',
          pincode: row.pincode || '',
          creditLimit: Number(row.credit_limit || row.creditlimit || 0),
          creditPeriodDays: Number(row.credit_days || row.creditperioddays || 30),
          currentBalance: Number(row.current_outstanding || row.currentoutstanding || row.balance || 0),
          salespersonName: row.account_manager || row.salesrep || 'Sales Team',
          status: (row.status === 'blocked' ? 'blocked' : 'active') as any,
        });
      }

      const res = await bulkImportCustomers(parsedCustomers, userEmail);
      await loadData();
      setImportModalOpen(false);
      setImportFile(null);
      toast({
        title: 'Customers Imported',
        description: `Successfully imported ${res.count} trade partners into Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'Could not parse the CSV file.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err: any) {
      toast({ title: 'Error loading customers', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCustomer = async (formData: any) => {
    try {
      if (selectedCustomer) {
        const updated = await updateCustomer(selectedCustomer.id, formData);
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: 'Customer Updated', description: `${updated.name} updated successfully.`, variant: 'success' });
      } else {
        const created = await createCustomer(formData);
        setCustomers((prev) => [created, ...prev]);
        toast({ title: 'Customer Added', description: `${created.name} registered.`, variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Failed to save customer', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleBlock = async (cust: Customer) => {
    try {
      const updated = await toggleCustomerBlock(cust.id);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast({
        title: updated.status === 'blocked' ? 'Customer Blocked' : 'Customer Unblocked',
        description: `${updated.name} is now ${updated.status}.`,
        variant: updated.status === 'blocked' ? 'warning' : 'success',
      });
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      toast({ title: 'Customer Removed', description: `${customerToDelete.name} has been removed.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (regionFilter !== 'all' && c.region !== regionFilter) return false;
    return true;
  });

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Customer / Trade Partner',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="max-w-xs">
            <div
              onClick={() => navigate(`/customers/${c.id}`)}
              className="font-semibold text-foreground hover:text-primary cursor-pointer truncate"
            >
              {c.name}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>{c.city}, {c.state}</span>
              <span>•</span>
              <span>GSTIN: {c.gstin}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const typeMap: Record<string, string> = {
          retailer: 'Retailer (GT)',
          distributor: 'Super Distributor',
          modern_trade: 'Modern Trade',
        };
        return (
          <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded capitalize">
            {typeMap[row.original.type] || row.original.type}
          </span>
        );
      },
    },
    {
      accessorKey: 'region',
      header: 'Region',
      cell: ({ row }) => <span className="text-xs">{row.original.region}</span>,
    },
    {
      accessorKey: 'creditLimit',
      header: 'Credit Limit',
      cell: ({ row }) => formatCurrency(row.original.creditLimit),
    },
    {
      accessorKey: 'currentBalance',
      header: 'Outstanding Balance',
      cell: ({ row }) => {
        const outstanding = Number(row.original.currentBalance ?? 0);
        const limit = Number(row.original.creditLimit || 0);
        const isOverLimit = limit > 0 && outstanding > limit;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${isOverLimit ? 'text-destructive font-mono' : 'text-foreground font-mono'}`}>
              {formatCurrency(outstanding)}
            </span>
            {isOverLimit && (
              <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                OVER LIMIT
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'salespersonName',
      header: 'Sales Rep',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.salespersonName}</span>,
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
        const cust = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Customer Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/customers/${cust.id}`)} className="cursor-pointer text-xs">
                <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                View Full Dossier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCustomer(cust);
                  setFormOpen(true);
                }}
                className="cursor-pointer text-xs"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleBlock(cust)} className="cursor-pointer text-xs">
                {cust.status === 'active' ? (
                  <>
                    <Ban className="mr-2 h-3.5 w-3.5 text-amber-500" /> Block Credit
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Unblock Customer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setCustomerToDelete(cust);
                  setDeleteConfirmOpen(true);
                }}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Customer
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
        title="Customers & Trade Partners"
        description="Distributors, modern trade supermarket chains, and general trade kirana retailers"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="h-9 gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedCustomer(null);
                setFormOpen(true);
              }}
              className="h-9 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Customer</span>
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Customer Types</option>
          <option value="retailer">Retailer (GT)</option>
          <option value="distributor">Distributor</option>
          <option value="modern_trade">Modern Trade</option>
        </select>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Regions</option>
          <option value="West">West</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="Central">Central</option>
        </select>

        {(typeFilter !== 'all' || regionFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setRegionFilter('all');
            }}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        searchPlaceholder="Search by customer name, code, GSTIN or city..."
        exportFileName="customers-master"
      />

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customerToDelete?.name}? Outstanding balances must be zero before removal.`}
        confirmText="Delete Customer"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-primary" />
              <span>Import Trade Partners & Distributors from CSV</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a comma-separated CSV with columns: <code>customer_code, company_name, city, state, gstin, channel_type, region, credit_limit, current_outstanding, account_manager, status</code>.
            </p>

            <label className="border-2 border-dashed rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer block">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0]);
                  }
                }}
              />
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              {importFile ? (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground">{importFile.name}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    {(importFile.size / 1024).toFixed(1)} KB • Ready to import
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-foreground">Click to select CSV file</div>
                  <div className="text-[11px] text-muted-foreground">UTF-8 encoded CSV file up to 10MB</div>
                </div>
              )}
            </label>

            <div className="flex justify-between items-center text-xs pt-1 border-t">
              <span className="text-muted-foreground">Need template headers?</span>
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteImport}
              disabled={!importFile || isImporting}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
