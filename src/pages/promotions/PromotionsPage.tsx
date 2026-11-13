import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Percent,
  Plus,
  Play,
  Pause,
  Clock,
  MoreHorizontal,
  Copy,
  Trash2,
  PieChart,
  Tag,
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
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Promotion } from '@/types';
import {
  fetchPromotions,
  createPromotion,
  updatePromotionStatus,
} from '@/api/promotions';

export const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'discount_percent' | 'buy_x_get_y' | 'slab_volume'>('discount_percent');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(20000);
  const [budget, setBudget] = useState(300000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPromotions();
      setPromotions(data);
    } catch (err: any) {
      toast({ title: 'Error loading promotions', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (promo: Promotion, status: 'active' | 'paused' | 'expired') => {
    try {
      const updated = await updatePromotionStatus(promo.id, status);
      setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast({
        title: 'Promotion Status Changed',
        description: `${promo.name} is now ${status}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPromo = await createPromotion({
        name,
        code: code.toUpperCase(),
        type,
        value,
        minOrderAmount: minOrder,
        budget,
        actualSpend: 0,
        startDate,
        endDate,
        status: 'active',
        applicableCategories: ['Staples & Grains', 'Packaged Foods & Snacks'],
        applicableCustomerTypes: ['distributor', 'retailer'],
      });

      setPromotions([newPromo, ...promotions]);
      setCreateModalOpen(false);
      toast({
        title: 'Promotion Scheme Launched',
        description: `Trade scheme ${newPromo.code} created with budget ${formatCurrency(budget)}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Failed to create promotion', description: err.message, variant: 'destructive' });
    }
  };

  const columns: ColumnDef<Promotion>[] = [
    {
      accessorKey: 'code',
      header: 'Scheme Code',
      cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Promotion Name',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-semibold text-foreground truncate">{row.original.name}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {row.original.type.replace(/_/g, ' ')} • Min: {formatCurrency(row.original.minOrderAmount || 0)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Offer / Benefit',
      cell: ({ row }) => {
        const p = row.original;
        if (p.type === 'discount_percent') return <span className="font-bold text-emerald-600">{p.value}% Off</span>;
        if (p.type === 'buy_x_get_y') return <span className="font-bold text-pink-600 dark:text-pink-400">Buy {p.buyQty} Get {p.getQty} Free</span>;
        return <span className="font-bold text-purple-600">Slab Volume Rebate {p.value}%</span>;
      },
    },
    {
      accessorKey: 'budget',
      header: 'Budget vs Actual Spend',
      cell: ({ row }) => {
        const p = row.original;
        const percent = Math.min(100, Math.round((p.actualSpend / (p.budget || 1)) * 100));
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-foreground">{formatCurrency(p.actualSpend)}</span>
              <span className="text-muted-foreground">/ {formatCurrency(p.budget)}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${percent > 90 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Duration',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(row.original.startDate)} to {formatDate(row.original.endDate)}
        </div>
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
        const promo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Scheme Actions</DropdownMenuLabel>
              {promo.status === 'paused' && (
                <DropdownMenuItem onClick={() => handleStatusChange(promo, 'active')} className="cursor-pointer text-xs">
                  <Play className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Activate Scheme
                </DropdownMenuItem>
              )}
              {promo.status === 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange(promo, 'paused')} className="cursor-pointer text-xs">
                  <Pause className="mr-2 h-3.5 w-3.5 text-amber-500" /> Pause Scheme
                </DropdownMenuItem>
              )}
              {promo.status !== 'expired' && (
                <DropdownMenuItem onClick={() => handleStatusChange(promo, 'expired')} className="cursor-pointer text-xs">
                  <Clock className="mr-2 h-3.5 w-3.5 text-rose-500" /> Expire Scheme
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  toast({ title: 'Scheme Cloned', description: `Created draft copy of ${promo.code}`, variant: 'success' });
                }}
                className="cursor-pointer text-xs"
              >
                <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Clone Scheme
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
        title="Trade Promotions & Scheme Budgets"
        description="Festive discounts, buy-X-get-Y schemes, wholesale volume slabs, and spend tracking"
        actions={
          <Button size="sm" onClick={() => setCreateModalOpen(true)} className="h-9 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Trade Scheme</span>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={promotions}
        searchPlaceholder="Search promotion by code or title..."
        exportFileName="fmcg-trade-schemes"
      />

      {/* Create Promotion Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Tag className="h-5 w-5" /> Launch Trade Promotion Scheme
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <FormField label="Scheme Campaign Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Winter Modern Trade Booster"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Promo Code" required>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="WINTER10"
                  className="h-9 text-xs font-mono uppercase"
                  required
                />
              </FormField>

              <FormField label="Scheme Type" required>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="discount_percent">Percentage Discount</option>
                  <option value="buy_x_get_y">Buy X Get Y Free</option>
                  <option value="slab_volume">Volume Slab Rebate</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Benefit Value (% or free qty)" required>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="h-9 text-xs font-semibold"
                  required
                />
              </FormField>

              <FormField label="Min Order Value (₹)" required>
                <Input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="h-9 text-xs"
                  required
                />
              </FormField>
            </div>

            <FormField label="Total Marketing Budget (₹)" required>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="h-9 text-xs font-semibold"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Valid From" required>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </FormField>

              <FormField label="Valid Until" required>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Deploy Scheme</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
