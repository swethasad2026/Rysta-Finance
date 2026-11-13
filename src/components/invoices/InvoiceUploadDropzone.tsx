import React, { useState, useRef } from 'react';
import { Upload, FileUp, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/Toast';
import { useAuthStore } from '@/store/authStore';
import { uploadInvoicePdf } from '@/api/invoices';

interface InvoiceUploadDropzoneProps {
  onUploadSuccess?: () => void;
  className?: string;
}

export const InvoiceUploadDropzone: React.FC<InvoiceUploadDropzoneProps> = ({
  onUploadSuccess,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const userEmail = user?.email || 'finance@rystafmcg.com';

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setLastUploadedName(null);

    // Validate PDF
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage('Only PDF invoice documents are supported. Please select a valid .pdf file.');
      toast({
        title: 'Invalid File Format',
        description: 'Please upload a PDF document.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit.');
      toast({
        title: 'File Too Large',
        description: 'Maximum PDF file size is 25MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // POST request using FormData:
      // data -> file
      // email -> userEmail
      await uploadInvoicePdf(file, userEmail);

      setLastUploadedName(file.name);
      toast({
        title: 'Invoice Uploaded Successfully',
        description: `"${file.name}" has been sent to the invoice processing webhook.`,
        variant: 'success',
      });

      // 4. Auto-Refresh After Upload: Immediately re-fetch from Supabase 1 second after upload completes
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('rysta-invoices-refresh'));
        }
      }, 1000);
    } catch (err: any) {
      const msg = err.message || 'Invoice upload failed. Please verify your connection.';
      setErrorMessage(msg);
      toast({
        title: 'Upload Failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`relative group rounded-xl border-2 border-dashed transition-all cursor-pointer p-6 sm:p-8 text-center ${
        isDragging
          ? 'border-primary bg-primary/10 scale-[1.005]'
          : 'border-border hover:border-primary/50 hover:bg-muted/30 bg-card/60'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isUploading}
      />

      <div className="flex flex-col items-center justify-center space-y-3 max-w-lg mx-auto">
        {/* Icon */}
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${
            isUploading
              ? 'bg-primary text-primary-foreground animate-pulse'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm sm:text-base text-foreground flex items-center justify-center gap-1.5">
            {isUploading ? (
              <span>Uploading & Processing Invoice with AI...</span>
            ) : (
              <>
                <span>Drag & drop your Invoice PDF here, or</span>{' '}
                <span className="text-primary underline font-bold">browse</span>
              </>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            Supports GST tax invoices, procurement bills, and party receipts (PDF up to 25MB)
          </p>
        </div>

        {/* Meta info pill */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>AI Automated Webhook Ingestion</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
            <span>Account:</span>
            <strong className="text-foreground">{userEmail}</strong>
          </span>
        </div>

        {/* Success or Error banners */}
        {lastUploadedName && !isUploading && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Uploaded: <strong>{lastUploadedName}</strong> (Ledger refreshed)</span>
          </div>
        )}

        {errorMessage && !isUploading && (
          <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
