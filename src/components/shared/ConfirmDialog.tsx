import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default' | 'success';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center sm:items-start">
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm text-muted-foreground text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : variant === 'success' ? 'success' : 'default'}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
