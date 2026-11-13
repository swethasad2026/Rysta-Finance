import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  MoreHorizontal,
  Layers,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { formatDate } from '@/utils/formatters';
import { PriceList, CustomerType } from '@/types';
import { fetchPriceLists, createPriceList } from '@/api/promotions';

export const PriceListsPage: React.FC = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('distributor');
  const [region, setRegion] = useState('West');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPriceLists();
      setPriceLists(data);
    } catch (err: any) {
      toast({ title: 'Error loading price lists', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createPriceList({
        name,
        customerType,
        region,
        effectiveFrom,
        status: 'active',
        itemsCount: 8,
      });

      setPriceLists([created, ...priceLists]);
      setModalOpen(false);
      toast({
        title: 'Price List Created',
        description: `${created.name} is now effective for ${created.region}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Creation failed', description: err.message, variant: 'destructive' });
    }
  };

  const columns: ColumnDef<PriceList>[] = [
    {
      accessorKey: 'name',
      header: 'Price List Name',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.original.name}</span>,
    },
    {
      accessorKey: 'customerType',
      header: 'Customer Tier',
      cell: ({ row }) => {
        const map: Record<string, string> = {
          retailer: 'General Trade Retailer',
          distributor: 'Super Distributor',
          modern_trade: 'Modern Trade Supermarket',
        };
        return <span className="text-xs font-medium">{map[row.original.customerType]}</span>;
      },
    },
    {
      accessorKey: 'region',
      header: 'Region / Territory',
      cell: ({ row }) => <span className="text-xs bg-muted px-2 py-0.5 rounded">{row.original.region}</span>,
    },
    {
      accessorKey: 'effectiveFrom',
      header: 'Effective Date',
      cell: ({ row }) => formatDate(row.original.effectiveFrom),
    },
    {
      accessorKey: 'itemsCount',
      header: 'Configured SKUs',
      cell: ({ row }) => `${row.original.itemsCount} SKUs`,
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
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => {
                  toast({ title: 'Price List Matrix', description: 'Opening rate card configuration...', variant: 'info' });
                }}
                className="cursor-pointer text-xs"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Edit Rate Matrix
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
        title="Wholesale Price Lists & Matrix"
        description="Regional price tiering across distributors, modern trade supermarket chains, and general retailers"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)} className="h-9 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Price List</span>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={priceLists}
        searchPlaceholder="Search price list name or region..."
        exportFileName="fmcg-price-lists"
      />

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5" /> Create Regional Price List
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <FormField label="Price List Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Zone Modern Trade Master"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Applicable Tier" required>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="distributor">Distributor Wholesale</option>
                  <option value="modern_trade">Modern Trade Chain</option>
                  <option value="retailer">Retail General Trade</option>
                </select>
              </FormField>

              <FormField label="Target Region" required>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="All India">All India</option>
                  <option value="West">West Zone</option>
                  <option value="North">North Zone</option>
                  <option value="South">South Zone</option>
                  <option value="East">East Zone</option>
                </select>
              </FormField>
            </div>

            <FormField label="Effective Date" required>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Price List</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
