import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  change?: number; // e.g., +12.5 or -3.2
  changeLabel?: string; // e.g. "vs last month"
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  changeLabel = 'vs last month',
  variant = 'default',
  className,
}) => {
  const iconColors = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    destructive: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <Card className={cn('relative overflow-hidden border transition-all hover:shadow-sm', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          <div className={cn('rounded-lg p-2.5', iconColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        {change !== undefined && (
          <div className="mt-3 flex items-center text-xs">
            {change > 0 ? (
              <span className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                +{change}%
              </span>
            ) : change < 0 ? (
              <span className="flex items-center font-medium text-rose-600 dark:text-rose-400">
                <TrendingDown className="mr-1 h-3.5 w-3.5" />
                {change}%
              </span>
            ) : (
              <span className="flex items-center font-medium text-muted-foreground">
                <Minus className="mr-1 h-3.5 w-3.5" />
                0%
              </span>
            )}
            <span className="ml-1.5 text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
