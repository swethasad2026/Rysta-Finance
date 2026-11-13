import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Upload,
  Download,
  Barcode,
  Copy,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Package,
  Layers,
  Printer,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/shared/Toast';
import { ProductFormDialog } from './ProductFormDialog';
import { formatCurrency } from '@/utils/formatters';
import { Product } from '@/types';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  bulkImportProducts,
} from '@/api/products';
import { useAuthStore } from '@/store/authStore';

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modals state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const { toast } = useToast();

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'sku_code,product_name,brand,hsn_code,category,unit_type,mrp,cost_price,wholesale_price,gst_rate,stock_quantity,status\n' +
      'SKU-BIS-001,Dark Choco Cream Biscuit 120g,Sunfeast,19053100,Bakery & Biscuits,PCS,40,28,32,18,150,active\n' +
      'SKU-FLR-002,Refined Sharbati Wheat Flour 5kg,Aashirvaad,11010000,Flour & Grains,BAG,360,280,310,5,35,active\n' +
      'SKU-OIL-003,Cold Pressed Mustard Oil 1L,Fortune,15149100,Edible Oils,BOT,195,145,168,5,80,active';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fmcg-sku-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Template Downloaded',
      description: 'fmcg-sku-import-template.csv saved with standard Supabase headers.',
      variant: 'success',
    });
  };

  const handleExecuteImport = async () => {
    if (!importFile) {
      toast({ title: 'No File Selected', description: 'Please select a .csv file to import.', variant: 'destructive' });
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
      const parsedProducts: Partial<Product>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        if (values.length < 2) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        parsedProducts.push({
          sku: row.sku_code || row.sku || `SKU-${Date.now()}-${i}`,
          name: row.product_name || row.name || 'Unnamed Product',
          brand: row.brand || 'General',
          hsnCode: row.hsn_code || row.hsn || '',
          category: row.category || 'General FMCG',
          unit: (row.unit_type || row.unit || 'PCS') as any,
          mrp: Number(row.mrp || 0),
          costPrice: Number(row.cost_price || row.costprice || 0),
          sellingPrice: Number(row.wholesale_price || row.wholesaleprice || row.sellingprice || row.mrp || 0),
          gstRate: Number(row.gst_rate || row.gstrate || 18),
          stock: Number(row.stock_quantity || row.stockquantity || row.stock || 0),
          status: (row.status || 'active').toLowerCase() as any,
        });
      }

      const res = await bulkImportProducts(parsedProducts, userEmail);
      await loadData();
      setImportModalOpen(false);
      setImportFile(null);
      toast({
        title: 'CSV Import Completed',
        description: `Successfully imported ${res.count} FMCG SKUs into Supabase.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'CSV Import Failed',
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
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: any) {
      toast({
        title: 'Error loading products',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProduct = async (formData: any) => {
    try {
      if (selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, formData);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast({ title: 'Product Updated', description: `${updated.name} updated successfully.`, variant: 'success' });
      } else {
        const created = await createProduct(formData);
        setProducts((prev) => [created, ...prev]);
        toast({ title: 'Product Added', description: `${created.name} created successfully.`, variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Failed to save product', description: err.message, variant: 'destructive' });
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const cloned = await duplicateProduct(product.id);
      setProducts((prev) => [cloned, ...prev]);
      toast({ title: 'Product Duplicated', description: `Created copy: ${cloned.sku}`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Duplicate failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const nextStatus = product.status === 'active' ? 'inactive' : 'active';
      const updated = await updateProduct(product.id, { status: nextStatus });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast({
        title: 'Status Updated',
        description: `${product.sku} is now ${nextStatus}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Status change failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast({ title: 'Product Deleted', description: `${productToDelete.sku} removed.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Deletion failed', description: err.message, variant: 'destructive' });
    }
  };

  const handlePrintBarcode = (product: Product) => {
    setBarcodeProduct(product);
    setBarcodeModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    return true;
  });

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU Code',
      cell: ({ row }) => (
        <div className="font-semibold text-primary">{row.original.sku}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium text-foreground truncate">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.brand} • HSN: {row.original.hsnCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.unit}</span>,
    },
    {
      accessorKey: 'mrp',
      header: 'MRP',
      cell: ({ row }) => formatCurrency(row.original.mrp),
    },
    {
      accessorKey: 'costPrice',
      header: 'Cost Price',
      cell: ({ row }) => formatCurrency(row.original.costPrice),
    },
    {
      accessorKey: 'sellingPrice',
      header: 'Distributor Rate',
      cell: ({ row }) => formatCurrency(row.original.sellingPrice),
    },
    {
      accessorKey: 'gstRate',
      header: 'GST %',
      cell: ({ row }) => `${row.original.gstRate}%`,
    },
    {
      accessorKey: 'stock',
      header: 'Stock Quantity',
      cell: ({ row }) => {
        const stockQty = Number(row.original.stock ?? 0);
        const isLow = stockQty < 50;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
              {stockQty}
            </span>
            {isLow && (
              <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                LOW
              </span>
            )}
          </div>
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
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">SKU Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProduct(item);
                  setFormOpen(true);
                }}
                className="cursor-pointer text-xs"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(item)} className="cursor-pointer text-xs">
                <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Duplicate SKU
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintBarcode(item)} className="cursor-pointer text-xs">
                <Barcode className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Print Barcode / Label
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(item)} className="cursor-pointer text-xs">
                {item.status === 'active' ? (
                  <>
                    <XCircle className="mr-2 h-3.5 w-3.5 text-amber-500" /> Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setProductToDelete(item);
                  setDeleteConfirmOpen(true);
                }}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Product
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
        title="Products & FMCG SKUs"
        description="Master catalog of consumer goods, case sizes, HSN classifications, and wholesale pricing"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="h-9 gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Import CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedProduct(null);
                setFormOpen(true);
              }}
              className="h-9 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Button>
          </>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          <option value="Staples & Grains">Staples & Grains</option>
          <option value="Edible Oils">Edible Oils</option>
          <option value="Packaged Foods & Snacks">Packaged Foods & Snacks</option>
          <option value="Personal Care & Hygiene">Personal Care & Hygiene</option>
          <option value="Home & Laundry Care">Home & Laundry Care</option>
          <option value="Beverages">Beverages</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        searchPlaceholder="Search by SKU, product name, brand, or HSN..."
        exportFileName="fmcg-products-master"
      />

      {/* Add / Edit Form Dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete FMCG Product"
        description={`Are you sure you want to delete ${productToDelete?.name} (${productToDelete?.sku})? This action cannot be reversed.`}
        confirmText="Delete Product"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Barcode / Print Labels Dialog */}
      {barcodeProduct && (
        <Dialog open={barcodeModalOpen} onOpenChange={setBarcodeModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Barcode className="h-5 w-5" />
                Barcode Label: {barcodeProduct.sku}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 border rounded-xl bg-white text-black flex flex-col items-center justify-center space-y-2 text-center my-2">
              <div className="font-bold text-sm tracking-wide">{barcodeProduct.name}</div>
              <div className="text-xs text-gray-500">{barcodeProduct.brand} • MRP: {formatCurrency(barcodeProduct.mrp)}</div>
              {/* Visual barcode representation */}
              <div className="py-2 flex flex-col items-center">
                <div className="flex h-12 gap-[3px] items-end justify-center px-4">
                  {[3,1,4,2,1,3,2,1,4,1,2,3,1,4,2,3,1,2,1,4,2,1,3,2].map((height, idx) => (
                    <div
                      key={idx}
                      className="bg-black"
                      style={{ width: `${(idx % 3) + 2}px`, height: `${height * 10}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs tracking-widest mt-1">
                  {barcodeProduct.barcode || '8901030381023'}
                </span>
              </div>
              <div className="text-[10px] text-gray-400">Manufactured for Rysta FMCG Distribution</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBarcodeModalOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  window.print();
                  setBarcodeModalOpen(false);
                }}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Label
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-primary" />
              <span>Import FMCG SKUs from CSV</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a comma-separated CSV with columns: <code>sku_code, product_name, brand, hsn_code, category, unit_type, mrp, cost_price, wholesale_price, gst_rate, stock_quantity, status</code>.
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
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
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
                <Download className="h-3 w-3" />
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
