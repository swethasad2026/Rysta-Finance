import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Sliders,
  AlertTriangle,
  Clock,
  Download,
  Building,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Package,
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
import { Product, StockMovement, BatchItem } from '@/types';
import { fetchProducts } from '@/api/products';
import { fetchStockMovements, fetchBatches, recordStockAdjustment } from '@/api/inventory';
import { useAuthStore } from '@/store/authStore';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  // Adjustment Modal
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjProduct, setAdjProduct] = useState<string>('');
  const [adjDelta, setAdjDelta] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('Stock audit physical variance correction');
  const [adjWarehouse, setAdjWarehouse] = useState<string>('Bhiwandi Central Hub');

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferProduct, setTransferProduct] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(50);
  const [transferSource, setTransferSource] = useState<string>('Bhiwandi Central Hub');
  const [transferDest, setTransferDest] = useState<string>('Pune Distribution Centre');

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pList, mList, bList] = await Promise.all([
        fetchProducts(),
        fetchStockMovements(),
        fetchBatches(),
      ]);
      setProducts(pList);
      setMovements(mList);
      setBatches(bList);
      if (pList.length > 0) {
        setAdjProduct(pList[0].id);
        setTransferProduct(pList[0].id);
      }
    } catch (err: any) {
      toast({ title: 'Error loading inventory', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || adjDelta === 0) {
      toast({ title: 'Invalid Adjustment', description: 'Please enter a valid quantity change.', variant: 'destructive' });
      return;
    }

    try {
      const movement = await recordStockAdjustment({
        productId: adjProduct,
        qtyDelta: adjDelta,
        reason: adjReason,
        warehouse: adjWarehouse,
        doneBy: user?.name || 'Inventory Controller',
      });

      // Reload products & movements
      loadData();
      setAdjModalOpen(false);
      toast({
        title: 'Stock Adjustment Logged',
        description: `Variance ${adjDelta > 0 ? `+${adjDelta}` : adjDelta} recorded with audit ref ${movement.referenceDoc}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Adjustment failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleStockTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferModalOpen(false);
    toast({
      title: 'Inter-Warehouse Transfer Dispatched',
      description: `Dispatched ${transferQty} units from ${transferSource} to ${transferDest}.`,
      variant: 'success',
    });
  };

  const lowStockItems = products.filter((p) => p.stock <= p.reorderLevel);
  const nearExpiryBatches = batches.filter((b) => b.daysToExpiry <= 30);

  const totalValuation = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  // Tab 1: Stock Levels Columns
  const stockColumns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU Code',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.original.sku}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium text-foreground truncate">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.category}</div>
        </div>
      ),
    },
    {
      accessorKey: 'warehouse',
      header: 'Hub',
      cell: ({ row }) => <span className="text-xs">{row.original.warehouse || 'Central'}</span>,
    },
    {
      accessorKey: 'stock',
      header: 'On Hand',
      cell: ({ row }) => {
        const isLow = row.original.stock <= row.original.reorderLevel;
        return (
          <div className="flex items-center gap-1.5 font-bold">
            <span className={isLow ? 'text-destructive' : 'text-foreground'}>
              {row.original.stock} {row.original.unit}
            </span>
            {isLow && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.2 rounded font-bold">
                LOW STOCK
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'reorderLevel',
      header: 'Reorder Level',
      cell: ({ row }) => `${row.original.reorderLevel} ${row.original.unit}`,
    },
    {
      accessorKey: 'costPrice',
      header: 'Unit Cost',
      cell: ({ row }) => formatCurrency(row.original.costPrice),
    },
    {
      id: 'valuation',
      header: 'Stock Value (INR)',
      cell: ({ row }) => formatCurrency(row.original.stock * row.original.costPrice),
    },
    {
      id: 'reorderAction',
      header: 'Replenishment',
      cell: ({ row }) => {
        const p = row.original;
        const isLow = p.stock <= p.reorderLevel;
        return (
          <Button
            size="sm"
            variant={isLow ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => navigate(`/purchase-orders/new?productId=${p.id}`)}
          >
            + Create PO
          </Button>
        );
      },
    },
  ];

  // Tab 2: Movements Columns
  const movementColumns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: 'date',
      header: 'Date & Time',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.original.sku}</span>,
    },
    {
      accessorKey: 'productName',
      header: 'Product',
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.productName}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Movement Type',
      cell: ({ row }) => {
        const map: Record<string, { label: string; color: string }> = {
          inward_po: { label: 'GRN Inward (PO)', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
          outward_sales: { label: 'Sales Dispatch', color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50' },
          adjustment_loss: { label: 'Audit Shrinkage', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
          adjustment_gain: { label: 'Audit Surplus', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
          transfer: { label: 'Inter-Hub Transfer', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
        };
        const item = map[row.original.type] || { label: row.original.type, color: 'text-muted-foreground' };
        return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${item.color}`}>{item.label}</span>;
      },
    },
    {
      accessorKey: 'qty',
      header: 'Qty Change',
      cell: ({ row }) => {
        const q = row.original.qty;
        return (
          <span className={`font-bold ${q > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {q > 0 ? `+${q}` : q}
          </span>
        );
      },
    },
    {
      accessorKey: 'referenceDoc',
      header: 'Doc Ref',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.referenceDoc}</span>,
    },
    {
      accessorKey: 'doneBy',
      header: 'Authorized By',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.doneBy}</span>,
    },
  ];

  // Tab 3: Batches Columns
  const batchColumns: ColumnDef<BatchItem>[] = [
    {
      accessorKey: 'batchNumber',
      header: 'Batch Number',
      cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.batchNumber}</span>,
    },
    {
      accessorKey: 'productName',
      header: 'Product / SKU',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">{row.original.productName}</div>
          <div className="text-xs text-muted-foreground">{row.original.sku}</div>
        </div>
      ),
    },
    {
      accessorKey: 'mfgDate',
      header: 'Mfg Date',
      cell: ({ row }) => formatDate(row.original.mfgDate),
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => formatDate(row.original.expiryDate),
    },
    {
      accessorKey: 'daysToExpiry',
      header: 'Days Left',
      cell: ({ row }) => {
        const days = row.original.daysToExpiry;
        return (
          <div className="flex items-center gap-1.5 font-bold">
            <span className={days <= 15 ? 'text-destructive' : days <= 45 ? 'text-amber-500' : 'text-foreground'}>
              {days} days
            </span>
            {days <= 15 && (
              <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1 rounded">
                CRITICAL
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'qty',
      header: 'Batch Qty',
      cell: ({ row }) => <span className="font-semibold">{row.original.qty}</span>,
    },
    {
      accessorKey: 'warehouse',
      header: 'Warehouse',
      cell: ({ row }) => <span className="text-xs">{row.original.warehouse}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FMCG Inventory, Warehousing & Batches"
        description="Multi-warehouse stock levels, FIFO/weighted average valuation, near-expiry monitoring, and stock movement logs"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setTransferModalOpen(true)} className="h-9 gap-1.5 text-xs">
              <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Stock Transfer</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAdjModalOpen(true)} className="h-9 gap-1.5 text-xs">
              <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Stock Adjustment</span>
            </Button>
            {lowStockItems.length > 0 && (
              <Button
                size="sm"
                onClick={() => navigate(`/purchase-orders/new?productId=${lowStockItems[0].id}`)}
                className="h-9 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create PO for Low Stock ({lowStockItems.length})</span>
              </Button>
            )}
          </>
        }
      />

      {/* KPI Highlights */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Total Inventory Valuation</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totalValuation)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">FIFO Cost Accounting Method</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Total SKUs in Warehouses</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {products.length} Products
            </div>
            <div className="text-xs text-muted-foreground mt-1">Across 4 Central Logistics Hubs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Low Stock Alerts</div>
            <div className="text-2xl font-bold text-destructive mt-1">
              {lowStockItems.length} SKUs
            </div>
            <div className="text-xs text-muted-foreground mt-1">Below minimum threshold</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Near-Expiry Batches</div>
            <div className="text-2xl font-bold text-amber-500 mt-1">
              {nearExpiryBatches.length} Batches
            </div>
            <div className="text-xs text-muted-foreground mt-1">Expiring within 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="stock" className="text-xs">Stock Levels ({products.length})</TabsTrigger>
          <TabsTrigger value="movements" className="text-xs">Stock Movements ({movements.length})</TabsTrigger>
          <TabsTrigger value="batches" className="text-xs">Batches & Expiry ({batches.length})</TabsTrigger>
          <TabsTrigger value="valuation" className="text-xs">Valuation Report (FIFO)</TabsTrigger>
        </TabsList>

        {/* Tab 1: Stock Levels */}
        <TabsContent value="stock" className="space-y-4">
          <DataTable
            columns={stockColumns}
            data={products}
            searchPlaceholder="Search SKU, product or hub..."
            exportFileName="fmcg-stock-levels"
          />
        </TabsContent>

        {/* Tab 2: Movements */}
        <TabsContent value="movements" className="space-y-4">
          <DataTable
            columns={movementColumns}
            data={movements}
            searchPlaceholder="Search doc ref, SKU or movement..."
            exportFileName="fmcg-stock-movements"
          />
        </TabsContent>

        {/* Tab 3: Batches & Expiry */}
        <TabsContent value="batches" className="space-y-4">
          <DataTable
            columns={batchColumns}
            data={batches}
            searchPlaceholder="Search batch number, SKU..."
            exportFileName="fmcg-batch-expiry"
          />
        </TabsContent>

        {/* Tab 4: Valuation */}
        <TabsContent value="valuation">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">FIFO Inventory Valuation Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Total Qty (Cases/Units)</th>
                      <th className="px-4 py-2.5">Average Cost (₹)</th>
                      <th className="px-4 py-2.5 text-right">Total Valuation (₹)</th>
                      <th className="px-4 py-2.5 text-right">% of Assets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">Staples & Grains</td>
                      <td className="px-4 py-3">1,950 Units</td>
                      <td className="px-4 py-3">₹81.60</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(159000)}</td>
                      <td className="px-4 py-3 text-right">38.2%</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">Edible Oils</td>
                      <td className="px-4 py-3">820 Units</td>
                      <td className="px-4 py-3">₹125.00</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(102500)}</td>
                      <td className="px-4 py-3 text-right">24.6%</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">Home & Laundry Care</td>
                      <td className="px-4 py-3">780 Units</td>
                      <td className="px-4 py-3">₹104.00</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(81120)}</td>
                      <td className="px-4 py-3 text-right">19.5%</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">Beverages & Tea</td>
                      <td className="px-4 py-3">310 Units</td>
                      <td className="px-4 py-3">₹470.00</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(145700)}</td>
                      <td className="px-4 py-3 text-right">17.7%</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-3">Total Inventory Asset Valuation</td>
                      <td className="px-4 py-3 text-right text-primary text-sm">{formatCurrency(totalValuation)}</td>
                      <td className="px-4 py-3 text-right">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Modal */}
      <Dialog open={adjModalOpen} onOpenChange={setAdjModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sliders className="h-5 w-5" /> Record Physical Stock Adjustment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4 py-2">
            <FormField label="Product / SKU" required>
              <select
                value={adjProduct}
                onChange={(e) => setAdjProduct(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) • Stock: {p.stock}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Quantity Change (Delta: + for surplus, - for loss)" required>
              <Input
                type="number"
                value={adjDelta || ''}
                onChange={(e) => setAdjDelta(Number(e.target.value))}
                placeholder="-5 or +10"
                className="h-9 text-xs font-mono font-semibold"
                required
              />
            </FormField>

            <FormField label="Warehouse Location" required>
              <select
                value={adjWarehouse}
                onChange={(e) => setAdjWarehouse(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="Bhiwandi Central Hub">Bhiwandi Central Hub</option>
                <option value="Pune Distribution Centre">Pune Distribution Centre</option>
                <option value="Delhi North Hub">Delhi North Hub</option>
              </select>
            </FormField>

            <FormField label="Audit Reason / Narration" required>
              <Input
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Transit damage, expiry write-off, count variance..."
                className="h-9 text-xs"
                required
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Commit Adjustment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-5 w-5" /> Inter-Warehouse Stock Transfer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockTransferSubmit} className="space-y-4 py-2">
            <FormField label="Product / SKU" required>
              <select
                value={transferProduct}
                onChange={(e) => setTransferProduct(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Source Hub" required>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Bhiwandi Central Hub">Bhiwandi Central Hub</option>
                  <option value="Pune Distribution Centre">Pune Distribution Centre</option>
                </select>
              </FormField>

              <FormField label="Destination Hub" required>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Pune Distribution Centre">Pune Distribution Centre</option>
                  <option value="Delhi North Hub">Delhi North Hub</option>
                  <option value="Bengaluru Hub">Bengaluru Hub</option>
                </select>
              </FormField>
            </div>

            <FormField label="Transfer Quantity" required>
              <Input
                type="number"
                min="1"
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                className="h-9 text-xs font-semibold"
                required
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Dispatch Transfer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
