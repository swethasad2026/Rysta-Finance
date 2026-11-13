import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  description,
  className,
  children,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive mt-1">{error}</p>}
    </div>
  );
};
