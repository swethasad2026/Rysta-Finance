import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalized = status?.toLowerCase().replace(/_/g, ' ') || 'unknown';

  let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' = 'default';

  switch (status?.toLowerCase()) {
    case 'paid':
    case 'cleared':
    case 'delivered':
    case 'approved':
    case 'active':
    case 'good':
      variant = 'success';
      break;

    case 'confirmed':
    case 'invoiced':
    case 'billed':
    case 'sent':
      variant = 'info';
      break;

    case 'partially_paid':
    case 'pending':
    case 'dispatched':
    case 'received':
    case 'near_expiry':
    case 'paused':
      variant = 'warning';
      break;

    case 'overdue':
    case 'cancelled':
    case 'void':
    case 'blocked':
    case 'reversed':
    case 'expired':
    case 'out_of_stock':
      variant = 'destructive';
      break;

    case 'draft':
    case 'inactive':
    default:
      variant = 'secondary';
      break;
  }

  return (
    <Badge variant={variant} className={`capitalize font-medium text-xs ${className || ''}`}>
      {normalized}
    </Badge>
  );
};
