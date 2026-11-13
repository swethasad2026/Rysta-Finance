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
import { Supplier } from '@/types';

const supplierSchema = z.object({
  code: z.string().min(2, 'Supplier code is required'),
  name: z.string().min(3, 'Supplier name is required'),
  gstin: z.string().min(15, 'Valid 15-character GSTIN required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid 6-digit PIN code required'),
  paymentTerms: z.string().min(2, 'Payment terms required'),
  bankDetails: z.object({
    accountName: z.string().min(2, 'Account name required'),
    accountNumber: z.string().min(6, 'Account number required'),
    ifsc: z.string().min(4, 'IFSC required'),
    bankName: z.string().min(2, 'Bank name required'),
    branch: z.string().min(2, 'Branch required'),
  }),
  status: z.enum(['active', 'blocked']).default('active'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  open,
  onOpenChange,
  supplier,
  onSave,
  isLoading = false,
}) => {
  const isEditing = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: '',
      name: '',
      gstin: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      paymentTerms: 'Net 30 Days',
      bankDetails: {
        accountName: '',
        accountNumber: '',
        ifsc: '',
        bankName: '',
        branch: '',
      },
      status: 'active',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        code: supplier.code,
        name: supplier.name,
        gstin: supplier.gstin,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        pincode: supplier.pincode,
        paymentTerms: supplier.paymentTerms,
        bankDetails: supplier.bankDetails,
        status: supplier.status,
      });
    } else {
      reset({
        code: `SUP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        gstin: '27AAACS' + Math.floor(1000 + Math.random() * 9000) + 'K1Z2',
        email: '',
        phone: '+91 ',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        paymentTerms: 'Net 30 Days',
        bankDetails: {
          accountName: '',
          accountNumber: '',
          ifsc: 'HDFC0000180',
          bankName: 'HDFC Bank',
          branch: 'Main Branch',
        },
        status: 'active',
      });
    }
  }, [supplier, reset, open]);

  const onSubmit = async (data: SupplierFormData) => {
    await onSave({
      ...data,
      currentBalance: supplier ? supplier.currentBalance : 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? `Edit Supplier: ${supplier.name}` : 'Add New FMCG Supplier / Vendor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Supplier Code" required error={errors.code?.message}>
              <Input placeholder="SUP-AGR-005" {...register('code')} error={!!errors.code} />
            </FormField>

            <FormField label="Payment Terms" required error={errors.paymentTerms?.message}>
              <Input placeholder="Net 30 Days" {...register('paymentTerms')} error={!!errors.paymentTerms} />
            </FormField>
          </div>

          <FormField label="Company / Entity Name" required error={errors.name?.message}>
            <Input placeholder="e.g. Agro Commodities India Ltd" {...register('name')} error={!!errors.name} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="GSTIN" required error={errors.gstin?.message}>
              <Input placeholder="27AAACA5544C1ZZ" {...register('gstin')} error={!!errors.gstin} />
            </FormField>

            <FormField label="Email" required error={errors.email?.message}>
              <Input type="email" placeholder="vendor@supplier.in" {...register('email')} error={!!errors.email} />
            </FormField>
          </div>

          <FormField label="Office Address" required error={errors.address?.message}>
            <Input placeholder="Plot 45, APMC Market 2" {...register('address')} error={!!errors.address} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="City" required error={errors.city?.message}>
              <Input placeholder="Navi Mumbai" {...register('city')} error={!!errors.city} />
            </FormField>
            <FormField label="State" required error={errors.state?.message}>
              <Input placeholder="Maharashtra" {...register('state')} error={!!errors.state} />
            </FormField>
            <FormField label="PIN Code" required error={errors.pincode?.message}>
              <Input placeholder="400703" {...register('pincode')} error={!!errors.pincode} />
            </FormField>
          </div>

          {/* Bank Details */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bank Details for NEFT / RTGS Payouts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Account Beneficiary Name" required error={errors.bankDetails?.accountName?.message}>
                <Input placeholder="Agro Commodities India Ltd" {...register('bankDetails.accountName')} />
              </FormField>
              <FormField label="Account Number" required error={errors.bankDetails?.accountNumber?.message}>
                <Input placeholder="920020045561122" {...register('bankDetails.accountNumber')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Bank Name" required error={errors.bankDetails?.bankName?.message}>
                <Input placeholder="Axis Bank" {...register('bankDetails.bankName')} />
              </FormField>
              <FormField label="IFSC Code" required error={errors.bankDetails?.ifsc?.message}>
                <Input placeholder="UTIB0000045" {...register('bankDetails.ifsc')} />
              </FormField>
              <FormField label="Branch Name" required error={errors.bankDetails?.branch?.message}>
                <Input placeholder="Vashi Sector 17" {...register('bankDetails.branch')} />
              </FormField>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? 'Save Supplier' : 'Create Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
