import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
}) => {
  const [selectedLabel, setSelectedLabel] = useState<string>(value?.label || 'This Month');

  const now = new Date();
  const formatISO = (d: Date) => d.toISOString().split('T')[0];

  const presets = [
    {
      label: 'Today',
      getRange: () => ({
        startDate: formatISO(now),
        endDate: formatISO(now),
        label: 'Today',
      }),
    },
    {
      label: 'This Week',
      getRange: () => {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        return {
          startDate: formatISO(start),
          endDate: formatISO(now),
          label: 'This Week',
        };
      },
    },
    {
      label: 'This Month',
      getRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: formatISO(start),
          endDate: formatISO(now),
          label: 'This Month',
        };
      },
    },
    {
      label: 'Last Month',
      getRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: formatISO(start),
          endDate: formatISO(end),
          label: 'Last Month',
        };
      },
    },
    {
      label: 'Financial Year (FY24-25)',
      getRange: () => {
        // Indian FY starts April 1st
        const start = new Date(now.getFullYear(), 3, 1);
        return {
          startDate: formatISO(start),
          endDate: formatISO(now),
          label: 'Financial Year (FY24-25)',
        };
      },
    },
  ];

  const handleSelect = (preset: (typeof presets)[0]) => {
    setSelectedLabel(preset.label);
    if (onChange) {
      onChange(preset.getRange());
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 border-dashed text-xs font-normal gap-2 ${className || ''}`}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{selectedLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {presets.map((preset) => (
          <DropdownMenuItem
            key={preset.label}
            onClick={() => handleSelect(preset)}
            className="cursor-pointer text-xs"
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
