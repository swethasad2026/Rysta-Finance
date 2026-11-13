import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-destructive">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};
