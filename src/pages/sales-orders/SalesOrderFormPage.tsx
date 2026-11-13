import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { Combobox, ComboboxOption } from '@/components/shared/Combobox';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/utils/formatters';
import { Customer, Product, Promotion, SalesOrderItem, SalesOrder } from '@/types';
import { fetchCustomers, fetchCustomerById } from '@/api/customers';
import { fetchProducts } from '@/api/products';
import { fetchPromotions } from '@/api/promotions';
import { createSalesOrder, fetchSalesOrderById } from '@/api/salesOrders';
import { useAuthStore } from '@/store/authStore';

export const SalesOrderFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [appliedPromoId, setAppliedPromoId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<SalesOrderItem[]>([
    {
      id: `item-${Date.now()}`,
      productId: '',
      sku: '',
      productName: '',
      unit: 'PKT',
      qty: 10,
      rate: 100,
      mrp: 120,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1000,
      gstRate: 5,
      cgstAmount: 25,
      sgstAmount: 25,
      igstAmount: 0,
      totalAmount: 1050,
      hsnCode: '11010000',
    },
  ]);

  // Load masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [cList, pList, promoList] = await Promise.all([
          fetchCustomers(),
          fetchProducts(),
          fetchPromotions(),
        ]);
        setCustomers(cList);
        setProducts(pList);
        setPromotions(promoList.filter((p) => p.status === 'active'));

        if (cList.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(cList[0].id);
          setSelectedCustomer(cList[0]);
        }
      } catch (err: any) {
        toast({ title: 'Error loading form data', description: err.message, variant: 'destructive' });
      }
    };
    loadMasters();
  }, [selectedCustomerId, toast]);

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId) || null;
    setSelectedCustomer(found);
    recalcAll(items, found, appliedPromoId);
  };

  // Recalculate line items & tax
  const recalcAll = (
    currentItems: SalesOrderItem[],
    cust: Customer | null,
    promoId: string
  ) => {
    const isInterstate = cust ? cust.state !== 'Maharashtra' : false;
    const promo = promotions.find((p) => p.id === promoId);

    const updated = currentItems.map((item) => {
      const gross = item.qty * item.rate;
      let discPercent = item.discountPercent;

      if (promo && promo.type === 'discount_percent') {
        discPercent = Math.max(discPercent, promo.value);
      }

      const discAmount = (gross * discPercent) / 100;
      const taxable = gross - discAmount;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterstate) {
        igst = (taxable * item.gstRate) / 100;
      } else {
        cgst = (taxable * (item.gstRate / 2)) / 100;
        sgst = (taxable * (item.gstRate / 2)) / 100;
      }

      const total = taxable + cgst + sgst + igst;

      return {
        ...item,
        discountPercent: discPercent,
        discountAmount: discAmount,
        taxableAmount: taxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalAmount: total,
      };
    });

    setItems(updated);
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    const isInterstate = selectedCustomer ? selectedCustomer.state !== 'Maharashtra' : false;

    const qty = newItems[index].qty || 10;
    const rate = prod.sellingPrice;
    const gross = qty * rate;
    const discPercent = newItems[index].discountPercent || 0;
    const discAmount = (gross * discPercent) / 100;
    const taxable = gross - discAmount;

    let cgst = 0, sgst = 0, igst = 0;
    if (isInterstate) {
      igst = (taxable * prod.gstRate) / 100;
    } else {
      cgst = (taxable * (prod.gstRate / 2)) / 100;
      sgst = (taxable * (prod.gstRate / 2)) / 100;
    }

    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      unit: prod.unit,
      mrp: prod.mrp,
      rate,
      hsnCode: prod.hsnCode,
      gstRate: prod.gstRate,
      taxableAmount: taxable,
      discountAmount: discAmount,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: taxable + cgst + sgst + igst,
    };

    setItems(newItems);
  };

  const handleItemChange = (index: number, field: 'qty' | 'rate' | 'discountPercent', value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    recalcAll(newItems, selectedCustomer, appliedPromoId);
  };

  const handleAddItem = () => {
    const newItem: SalesOrderItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: '',
      sku: '',
      productName: '',
      unit: 'PKT',
      qty: 10,
      rate: 100,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1000,
      gstRate: 5,
      cgstAmount: 25,
      sgstAmount: 25,
      igstAmount: 0,
      totalAmount: 1050,
      hsnCode: '11010000',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast({ title: 'Cannot remove item', description: 'Order must contain at least one line item.', variant: 'warning' });
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Totals
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxableTotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  const cgstTotal = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const sgstTotal = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const igstTotal = items.reduce((sum, item) => sum + item.igstAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);

  const isInterstate = selectedCustomer ? selectedCustomer.state !== 'Maharashtra' : false;
  const isCreditOverdue = selectedCustomer ? (selectedCustomer.currentBalance + grandTotal) > selectedCustomer.creditLimit : false;

  const handleSave = async (status: 'draft' | 'confirmed') => {
    if (!selectedCustomer) {
      toast({ title: 'Customer Required', description: 'Please choose a customer.', variant: 'destructive' });
      return;
    }
    const invalidItems = items.filter((i) => !i.productId);
    if (invalidItems.length > 0) {
      toast({ title: 'Incomplete line items', description: 'Please select a valid SKU for all lines.', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const newOrder = await createSalesOrder({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerGstin: selectedCustomer.gstin,
        customerType: selectedCustomer.type,
        date: orderDate,
        expectedDeliveryDate: deliveryDate,
        status,
        items,
        subtotal,
        discountTotal,
        taxableTotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        grandTotal,
        notes,
        appliedPromotionId: appliedPromoId || undefined,
        isInterstate,
        creditWarning: isCreditOverdue,
        createdBy: user?.name || 'Sales Officer',
      });

      toast({
        title: status === 'confirmed' ? 'Sales Order Confirmed' : 'Sales Order Draft Saved',
        description: `Order ${newOrder.orderNumber} created successfully.`,
        variant: 'success',
      });

      navigate('/sales-orders');
    } catch (err: any) {
      toast({ title: 'Order creation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const customerOptions: ComboboxOption[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `${c.city} • Bal: ${formatCurrency(c.currentBalance)}`,
  }));

  const productOptions: ComboboxOption[] = products.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
    sublabel: `MRP: ${formatCurrency(p.mrp)} • Stock: ${p.stock} ${p.unit}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create FMCG Sales Order"
        description="Book distribution orders, calculate multi-tier trade schemes and automated GST"
        breadcrumbs={[
          { label: 'Sales Orders', href: '/sales-orders' },
          { label: 'New Order' },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/sales-orders')} className="h-9 gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave('draft')}
              isLoading={isLoading}
              className="h-9 gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('confirmed')}
              isLoading={isLoading}
              className="h-9 gap-1.5 text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Confirm Order
            </Button>
          </>
        }
      />

      {/* Credit Limit Alert Banner */}
      {isCreditOverdue && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold text-sm">Credit Limit Warning</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Current receivables ({formatCurrency(selectedCustomer?.currentBalance)}) + this order ({formatCurrency(grandTotal)}) will exceed the sanctioned credit limit of {formatCurrency(selectedCustomer?.creditLimit)}. Dispatch approval will be required.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Order Details & Customer Selection</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="font-medium text-foreground">Select Customer / Retailer *</label>
            <Combobox
              options={customerOptions}
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              placeholder="Search customer by name or city..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Order Date *</label>
            <Input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Expected Delivery *</label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="font-medium text-foreground">Trade Promotion / Scheme Scheme</label>
            <select
              value={appliedPromoId}
              onChange={(e) => {
                setAppliedPromoId(e.target.value);
                recalcAll(items, selectedCustomer, e.target.value);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No Promotion Applied</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code} - {p.type === 'discount_percent' ? `${p.value}% Off` : 'Volume Bonus'})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="font-medium text-foreground">GST Place of Supply</label>
            <div className="h-9 px-3 flex items-center rounded-md border bg-muted/30 text-xs text-muted-foreground font-mono">
              {isInterstate ? 'Inter-state Supply (IGST Applicable)' : 'Intra-state Supply (CGST + SGST Applicable)'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Ordered FMCG SKUs</CardTitle>
          <Button size="sm" onClick={handleAddItem} variant="outline" className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Line
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 w-8">#</th>
                  <th className="px-3 py-2.5 min-w-[280px]">Product / SKU</th>
                  <th className="px-3 py-2.5 w-24">Qty</th>
                  <th className="px-3 py-2.5 w-24">Rate (₹)</th>
                  <th className="px-3 py-2.5 w-24">Disc %</th>
                  <th className="px-3 py-2.5 w-24">GST %</th>
                  <th className="px-3 py-2.5 text-right w-28">Taxable</th>
                  <th className="px-3 py-2.5 text-right w-28">Total</th>
                  <th className="px-3 py-2.5 text-center w-12">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-3">
                      <Combobox
                        options={productOptions}
                        value={item.productId}
                        onChange={(val) => handleProductSelect(index, val)}
                        placeholder="Select SKU..."
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) => handleItemChange(index, 'discountPercent', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono font-medium">{item.gstRate}%</td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrency(item.taxableAmount)}</td>
                    <td className="px-3 py-3 text-right font-bold text-foreground">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
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

      {/* Bottom Summary & Notes */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Special Dispatch Notes / Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deliver before 12 PM. Priority dispatch from Bhiwandi Warehouse..."
              className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Financial Breakdown Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Order Financial Summary (INR)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Gross Amount (Subtotal)</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b text-emerald-600 dark:text-emerald-400">
              <span>Trade Discount</span>
              <span>- {formatCurrency(discountTotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Net Taxable Value</span>
              <span className="font-semibold">{formatCurrency(taxableTotal)}</span>
            </div>

            {isInterstate ? (
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Integrated GST (IGST)</span>
                <span className="font-medium">{formatCurrency(igstTotal)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Central GST (CGST)</span>
                  <span className="font-medium">{formatCurrency(cgstTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">State GST (SGST)</span>
                  <span className="font-medium">{formatCurrency(sgstTotal)}</span>
                </div>
              </>
            )}

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
