import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  X,
  FileCheck,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { DatasetSummary } from '@/api/analyst';

interface DatasetDropzoneProps {
  type: 'invoices' | 'expenses' | 'income';
  title: string;
  description: string;
  summary: DatasetSummary | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const DatasetDropzone: React.FC<DatasetDropzoneProps> = ({
  type,
  title,
  description,
  summary,
  onFileSelect,
  onClear,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Color mappings based on dataset type
  const config = {
    invoices: {
      accentColor: 'border-blue-500/40 hover:border-blue-500',
      dragColor: 'border-blue-600 bg-blue-500/10',
      badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      icon: FileSpreadsheet,
      iconColor: 'text-blue-600 dark:text-blue-400',
      amountColor: 'text-blue-600 dark:text-blue-400',
      typeLabel: 'Receivables / B2B Ledger',
    },
    expenses: {
      accentColor: 'border-rose-500/40 hover:border-rose-500',
      dragColor: 'border-rose-600 bg-rose-500/10',
      badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      icon: TrendingDown,
      iconColor: 'text-rose-600 dark:text-rose-400',
      amountColor: 'text-rose-600 dark:text-rose-400',
      typeLabel: 'Operating Outflows / AP',
    },
    income: {
      accentColor: 'border-emerald-500/40 hover:border-emerald-500',
      dragColor: 'border-emerald-600 bg-emerald-500/10',
      badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      amountColor: 'text-emerald-600 dark:text-emerald-400',
      typeLabel: 'Collections / Deposits',
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-200 bg-card p-4 flex flex-col justify-between min-h-[220px] ${
        isDragging
          ? config.dragColor
          : summary
          ? 'border-border shadow-sm'
          : `border-dashed ${config.accentColor}`
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isLoading}
      />

      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{title}</h3>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {config.typeLabel}
              </span>
            </div>
          </div>
          {summary && (
            <Badge variant="outline" className={`text-[10px] font-bold ${config.badgeBg}`}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Active File State vs Upload Prompt */}
      <div className="my-3">
        {summary ? (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
                <span
                  className="text-xs font-semibold text-foreground truncate"
                  title={summary.fileName}
                >
                  {summary.fileName}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  ({formatFileSize(summary.fileSize)})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                disabled={isLoading}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Quick Preview Metrics */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{summary.rowCount}</strong> rows parsed
              </span>
              <span className="font-mono font-bold">
                Total: <span className={config.amountColor}>{formatCurrency(summary.totalAmount)}</span>
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center py-6 px-3 rounded-lg bg-muted/10 hover:bg-muted/30 border border-dashed border-border/80 cursor-pointer transition-colors text-center group"
          >
            <Upload className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
            <div className="text-xs font-semibold text-foreground">
              Drop <span className="font-mono text-primary">.csv</span> here, or{' '}
              <span className="text-primary underline">browse</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Supports standard CSV formatting
            </span>
          </div>
        )}
      </div>

      {/* Footer replace action */}
      {summary && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <Upload className="h-3 w-3" /> Replace CSV
          </Button>
        </div>
      )}
    </div>
  );
};
