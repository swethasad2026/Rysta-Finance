import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  extra?: any;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string, option?: ComboboxOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = query
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left',
          !selectedOption && 'text-muted-foreground'
        )}
      >
        <span className="truncate">
          {selectedOption ? (
            <span>
              <span className="font-medium text-foreground">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-muted-foreground ml-2 text-xs">({selectedOption.sublabel})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-50">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-1 divide-y divide-border/30">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value, opt);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2.5 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors',
                      isSelected && 'bg-accent/60 font-semibold'
                    )}
                  >
                    <div>
                      <div className="text-foreground">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[11px] text-muted-foreground">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary ml-2 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No matching results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
