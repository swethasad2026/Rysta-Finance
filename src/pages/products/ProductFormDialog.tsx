import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { Product } from '@/types';

const productSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  name: z.string().min(3, 'Product name is required'),
  brand: z.string().min(2, 'Brand is required'),
  category: z.string().min(2, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  mrp: z.coerce.number().positive('MRP must be positive'),
  costPrice: z.coerce.number().positive('Cost price must be positive'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  gstRate: z.coerce.number().min(0, 'GST Rate required'),
  hsnCode: z.string().min(4, 'Valid HSN code required'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  reorderLevel: z.coerce.number().min(0, 'Reorder level required'),
  caseSize: z.coerce.number().min(1, 'Case size required'),
  unitsPerCase: z.coerce.number().min(1, 'Units per case required'),
  warehouse: z.string().optional(),
  barcode: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  product,
  onSave,
  isLoading = false,
}) => {
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      brand: '',
      category: 'Staples & Grains',
      unit: 'PKT',
      mrp: 100,
      costPrice: 70,
      sellingPrice: 85,
      gstRate: 5,
      hsnCode: '11010000',
      stock: 100,
      reorderLevel: 25,
      caseSize: 12,
      unitsPerCase: 12,
      warehouse: 'Bhiwandi Central Hub',
      barcode: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        category: product.category,
        unit: product.unit,
        mrp: product.mrp,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        gstRate: product.gstRate,
        hsnCode: product.hsnCode,
        stock: product.stock,
        reorderLevel: product.reorderLevel,
        caseSize: product.caseSize,
        unitsPerCase: product.unitsPerCase,
        warehouse: product.warehouse || 'Bhiwandi Central Hub',
        barcode: product.barcode || '',
        status: product.status,
      });
    } else {
      reset({
        sku: `FMCG-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        brand: '',
        category: 'Staples & Grains',
        unit: 'PKT',
        mrp: 150,
        costPrice: 100,
        sellingPrice: 125,
        gstRate: 5,
        hsnCode: '11010000',
        stock: 100,
        reorderLevel: 30,
        caseSize: 12,
        unitsPerCase: 12,
        warehouse: 'Bhiwandi Central Hub',
        barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        status: 'active',
      });
    }
  }, [product, reset, open]);

  const onSubmit = async (data: ProductFormData) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? `Edit Product: ${product.sku}` : 'Add New FMCG SKU'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="SKU Code" required error={errors.sku?.message}>
              <Input placeholder="FMCG-ATT-001" {...register('sku')} error={!!errors.sku} />
            </FormField>

            <FormField label="Brand" required error={errors.brand?.message}>
              <Input placeholder="e.g. Aashirvaad, Britannia" {...register('brand')} error={!!errors.brand} />
            </FormField>
          </div>

          <FormField label="Product Name / Description" required error={errors.name?.message}>
            <Input placeholder="e.g. Superior MP Sharbati Atta 5kg" {...register('name')} error={!!errors.name} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Category" required error={errors.category?.message}>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                {...register('category')}
              >
                <option value="Staples & Grains">Staples & Grains</option>
                <option value="Edible Oils">Edible Oils</option>
                <option value="Packaged Foods & Snacks">Packaged Foods & Snacks</option>
                <option value="Personal Care & Hygiene">Personal Care & Hygiene</option>
                <option value="Home & Laundry Care">Home & Laundry Care</option>
                <option value="Beverages">Beverages</option>
              </select>
            </FormField>

            <FormField label="Base Unit" required error={errors.unit?.message}>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                {...register('unit')}
              >
                <option value="PKT">Packet (PKT)</option>
                <option value="BAG">Bag (BAG)</option>
                <option value="POUCH">Pouch (POUCH)</option>
                <option value="BOTTLE">Bottle (BOTTLE)</option>
                <option value="TIN">Tin (TIN)</option>
                <option value="KG">Kilogram (KG)</option>
              </select>
            </FormField>

            <FormField label="Warehouse Hub" error={errors.warehouse?.message}>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                {...register('warehouse')}
              >
                <option value="Bhiwandi Central Hub">Bhiwandi Central Hub</option>
                <option value="Pune Distribution Centre">Pune Distribution Centre</option>
                <option value="Delhi North Hub">Delhi North Hub</option>
                <option value="Bengaluru Hub">Bengaluru Hub</option>
              </select>
            </FormField>
          </div>

          {/* Pricing & GST Section */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pricing, Tax & Margins (INR)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField label="MRP (₹)" required error={errors.mrp?.message}>
                <Input type="number" step="0.01" {...register('mrp')} error={!!errors.mrp} />
              </FormField>

              <FormField label="Cost Price (₹)" required error={errors.costPrice?.message}>
                <Input type="number" step="0.01" {...register('costPrice')} error={!!errors.costPrice} />
              </FormField>

              <FormField label="Distributor Rate (₹)" required error={errors.sellingPrice?.message}>
                <Input type="number" step="0.01" {...register('sellingPrice')} error={!!errors.sellingPrice} />
              </FormField>

              <FormField label="GST Rate (%)" required error={errors.gstRate?.message}>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  {...register('gstRate')}
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <FormField label="HSN Code" required error={errors.hsnCode?.message}>
                <Input placeholder="e.g. 11010000" {...register('hsnCode')} error={!!errors.hsnCode} />
              </FormField>
              <FormField label="Barcode (EAN-13)" error={errors.barcode?.message}>
                <Input placeholder="e.g. 8901030381023" {...register('barcode')} error={!!errors.barcode} />
              </FormField>
            </div>
          </div>

          {/* Packaging & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField label="Opening Stock" required error={errors.stock?.message}>
              <Input type="number" {...register('stock')} error={!!errors.stock} />
            </FormField>

            <FormField label="Reorder Level" required error={errors.reorderLevel?.message}>
              <Input type="number" {...register('reorderLevel')} error={!!errors.reorderLevel} />
            </FormField>

            <FormField label="Case Size" required error={errors.caseSize?.message}>
              <Input type="number" {...register('caseSize')} error={!!errors.caseSize} />
            </FormField>

            <FormField label="Units Per Case" required error={errors.unitsPerCase?.message}>
              <Input type="number" {...register('unitsPerCase')} error={!!errors.unitsPerCase} />
            </FormField>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
