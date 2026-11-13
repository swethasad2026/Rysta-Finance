import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { Combobox, ComboboxOption } from '@/components/shared/Combobox';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/utils/formatters';
import { Supplier, Product, PurchaseOrderItem } from '@/types';
import { fetchSuppliers } from '@/api/suppliers';
import { fetchProducts } from '@/api/products';
import { createPurchaseOrder } from '@/api/purchaseOrders';
import { useAuthStore } from '@/store/authStore';

export const PurchaseOrderFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [supplierId, setSupplierId] = useState<string>(searchParams.get('supplierId') || '');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      id: `poi-${Date.now()}`,
      productId: '',
      sku: '',
      productName: '',
      unit: 'BAG',
      qty: 100,
      rate: 290,
      taxRate: 5,
      taxAmount: 1450,
      total: 30450,
    },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sList, pList] = await Promise.all([fetchSuppliers(), fetchProducts()]);
        setSuppliers(sList);
        setProducts(pList);

        if (!supplierId && sList.length > 0) {
          setSupplierId(sList[0].id);
        }

        const preselectedProduct = searchParams.get('productId');
        if (preselectedProduct) {
          const p = pList.find((prod) => prod.id === preselectedProduct);
          if (p) {
            setItems([
              {
                id: `poi-${Date.now()}`,
                productId: p.id,
                sku: p.sku,
                productName: p.name,
                unit: p.unit,
                qty: p.reorderLevel * 2 || 100,
                rate: p.costPrice,
                taxRate: p.gstRate,
                taxAmount: ((p.reorderLevel * 2 || 100) * p.costPrice * p.gstRate) / 100,
                total:
                  (p.reorderLevel * 2 || 100) * p.costPrice * (1 + p.gstRate / 100),
              },
            ]);
          }
        }
      } catch (err: any) {
        toast({ title: 'Error loading procurement data', description: err.message, variant: 'destructive' });
      }
    };
    load();
  }, [searchParams, supplierId, toast]);

  const handleProductSelect = (index: number, prodId: string) => {
    const p = products.find((prod) => prod.id === prodId);
    if (!p) return;

    const newItems = [...items];
    const qty = newItems[index].qty || 50;
    const rate = p.costPrice;
    const sub = qty * rate;
    const tax = (sub * p.gstRate) / 100;

    newItems[index] = {
      ...newItems[index],
      productId: p.id,
      sku: p.sku,
      productName: p.name,
      unit: p.unit,
      qty,
      rate,
      taxRate: p.gstRate,
      taxAmount: tax,
      total: sub + tax,
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: 'qty' | 'rate', val: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    const sub = newItems[index].qty * newItems[index].rate;
    const tax = (sub * newItems[index].taxRate) / 100;
    newItems[index].taxAmount = tax;
    newItems[index].total = sub + tax;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `poi-${Date.now()}-${Math.random()}`,
        productId: '',
        sku: '',
        productName: '',
        unit: 'BAG',
        qty: 100,
        rate: 100,
        taxRate: 5,
        taxAmount: 500,
        total: 10500,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (status: 'draft' | 'approved') => {
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp) {
      toast({ title: 'Select Supplier', description: 'Please choose a vendor.', variant: 'destructive' });
      return;
    }
    if (items.some((i) => !i.productId)) {
      toast({ title: 'Incomplete items', description: 'Please select SKUs for all rows.', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const created = await createPurchaseOrder({
        supplierId: supp.id,
        supplierName: supp.name,
        date: orderDate,
        expectedDate,
        status,
        items,
        subtotal,
        taxTotal,
        grandTotal,
        notes,
        createdBy: user?.name || 'Procurement Specialist',
      });

      toast({
        title: status === 'approved' ? 'Purchase Order Approved' : 'Draft PO Saved',
        description: `Order ${created.poNumber} created for ${supp.name}.`,
        variant: 'success',
      });

      navigate('/purchase-orders');
    } catch (err: any) {
      toast({ title: 'Failed to create PO', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const supplierOptions: ComboboxOption[] = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: `${s.city} • Payables: ${formatCurrency(s.currentBalance)}`,
  }));

  const productOptions: ComboboxOption[] = products.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
    sublabel: `Cost: ${formatCurrency(p.costPrice)} • Stock: ${p.stock} ${p.unit}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Purchase Order"
        description="Replenish raw materials, packaged goods, and edible oils directly with factory mills"
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/purchase-orders' },
          { label: 'New PO' },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/purchase-orders')} className="h-9 gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleSubmit('draft')} isLoading={isLoading} className="h-9 gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Save Draft
            </Button>
            <Button size="sm" onClick={() => handleSubmit('approved')} isLoading={isLoading} className="h-9 gap-1.5 text-xs">
              <CheckCircle className="h-3.5 w-3.5" /> Approve & Issue PO
            </Button>
          </>
        }
      />

      {/* Header Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Vendor & Logistics Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Select Supplier / Manufacturer *</label>
            <Combobox
              options={supplierOptions}
              value={supplierId}
              onChange={setSupplierId}
              placeholder="Search vendor..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">PO Issue Date *</label>
            <Input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Expected Delivery at Hub *</label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Materials & SKUs</CardTitle>
          <Button size="sm" onClick={handleAddItem} variant="outline" className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Material
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 w-8">#</th>
                  <th className="px-3 py-2.5 min-w-[280px]">Material / SKU</th>
                  <th className="px-3 py-2.5 w-24">Qty</th>
                  <th className="px-3 py-2.5 w-24">Unit Cost (₹)</th>
                  <th className="px-3 py-2.5 w-20">GST %</th>
                  <th className="px-3 py-2.5 text-right w-28">Tax (₹)</th>
                  <th className="px-3 py-2.5 text-right w-28">Total (₹)</th>
                  <th className="px-3 py-2.5 text-center w-12">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <Combobox
                        options={productOptions}
                        value={item.productId}
                        onChange={(val) => handleProductSelect(idx, val)}
                        placeholder="Select SKU..."
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono">{item.taxRate}%</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(item.taxAmount)}</td>
                    <td className="px-3 py-3 text-right font-bold text-foreground">{formatCurrency(item.total)}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Delivery Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unload at Dock 3 Bhiwandi. Lab certificate & batch manufacturing dates required on arrival..."
              className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">PO Total Valuation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Taxable Value</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">GST Taxes</span>
              <span className="font-medium">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-base font-bold text-foreground">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
