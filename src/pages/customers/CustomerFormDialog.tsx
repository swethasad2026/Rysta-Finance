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
import { Customer } from '@/types';

const customerSchema = z.object({
  code: z.string().min(2, 'Customer code is required'),
  name: z.string().min(3, 'Customer name is required'),
  type: z.enum(['retailer', 'distributor', 'modern_trade']),
  gstin: z.string().min(15, 'Valid 15-character GSTIN required'),
  pan: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid 6-digit PIN code required'),
  region: z.string().min(2, 'Region is required'),
  creditLimit: z.coerce.number().min(0, 'Credit limit required'),
  creditPeriodDays: z.coerce.number().min(0, 'Credit period days required'),
  paymentTerms: z.string().min(2, 'Payment terms required'),
  salespersonName: z.string().min(2, 'Salesperson name required'),
  status: z.enum(['active', 'blocked']).default('active'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  onOpenChange,
  customer,
  onSave,
  isLoading = false,
}) => {
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'retailer',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      region: 'West',
      creditLimit: 500000,
      creditPeriodDays: 30,
      paymentTerms: 'Net 30 Days',
      salespersonName: 'Vikram Malhotra',
      status: 'active',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        code: customer.code,
        name: customer.name,
        type: customer.type,
        gstin: customer.gstin,
        pan: customer.pan || '',
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        region: customer.region,
        creditLimit: customer.creditLimit,
        creditPeriodDays: customer.creditPeriodDays,
        paymentTerms: customer.paymentTerms,
        salespersonName: customer.salespersonName,
        status: customer.status,
      });
    } else {
      reset({
        code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        type: 'retailer',
        gstin: '27AABCR' + Math.floor(1000 + Math.random() * 9000) + 'K1Z5',
        pan: '',
        email: '',
        phone: '+91 ',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        region: 'West',
        creditLimit: 300000,
        creditPeriodDays: 21,
        paymentTerms: 'Net 21 Days',
        salespersonName: 'Vikram Malhotra',
        status: 'active',
      });
    }
  }, [customer, reset, open]);

  const onSubmit = async (data: CustomerFormData) => {
    await onSave({
      ...data,
      salespersonId: 'usr-3',
      currentBalance: customer ? customer.currentBalance : 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? `Edit Customer: ${customer.name}` : 'Add New Customer / Retailer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Customer Code" required error={errors.code?.message}>
              <Input placeholder="CUST-RET-010" {...register('code')} error={!!errors.code} />
            </FormField>

            <FormField label="Customer Type" required error={errors.type?.message}>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                {...register('type')}
              >
                <option value="retailer">Retailer (General Trade)</option>
                <option value="distributor">Super Distributor (Wholesale)</option>
                <option value="modern_trade">Modern Trade (Supermarket Chain)</option>
              </select>
            </FormField>

            <FormField label="Region" required error={errors.region?.message}>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                {...register('region')}
              >
                <option value="West">West Zone</option>
                <option value="North">North Zone</option>
                <option value="South">South Zone</option>
                <option value="East">East Zone</option>
                <option value="Central">Central Zone</option>
              </select>
            </FormField>
          </div>

          <FormField label="Trade Legal Name" required error={errors.name?.message}>
            <Input placeholder="e.g. Metro Cash & Carry India Pvt Ltd" {...register('name')} error={!!errors.name} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="GSTIN (15 Digits)" required error={errors.gstin?.message}>
              <Input placeholder="27AAACR7148F1ZX" {...register('gstin')} error={!!errors.gstin} />
            </FormField>

            <FormField label="PAN" error={errors.pan?.message}>
              <Input placeholder="AAACR7148F" {...register('pan')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Contact Email" required error={errors.email?.message}>
              <Input type="email" placeholder="orders@partner.com" {...register('email')} error={!!errors.email} />
            </FormField>

            <FormField label="Phone Number" required error={errors.phone?.message}>
              <Input placeholder="+91 98200 12345" {...register('phone')} error={!!errors.phone} />
            </FormField>
          </div>

          <FormField label="Billing & Shipping Address" required error={errors.address?.message}>
            <Input placeholder="Shop No, Building, Street, Landmark" {...register('address')} error={!!errors.address} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="City" required error={errors.city?.message}>
              <Input placeholder="Mumbai" {...register('city')} error={!!errors.city} />
            </FormField>
            <FormField label="State" required error={errors.state?.message}>
              <Input placeholder="Maharashtra" {...register('state')} error={!!errors.state} />
            </FormField>
            <FormField label="PIN Code" required error={errors.pincode?.message}>
              <Input placeholder="400001" {...register('pincode')} error={!!errors.pincode} />
            </FormField>
          </div>

          {/* Credit & Terms */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Credit Policy & Assigned Salesperson
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Credit Limit (₹)" required error={errors.creditLimit?.message}>
                <Input type="number" {...register('creditLimit')} error={!!errors.creditLimit} />
              </FormField>

              <FormField label="Credit Days" required error={errors.creditPeriodDays?.message}>
                <Input type="number" {...register('creditPeriodDays')} error={!!errors.creditPeriodDays} />
              </FormField>

              <FormField label="Payment Terms" required error={errors.paymentTerms?.message}>
                <Input placeholder="Net 30 Days" {...register('paymentTerms')} error={!!errors.paymentTerms} />
              </FormField>
            </div>

            <FormField label="Assigned Sales Representative" required error={errors.salespersonName?.message}>
              <Input placeholder="Vikram Malhotra" {...register('salespersonName')} error={!!errors.salespersonName} />
            </FormField>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? 'Save Customer' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
