import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/shared/Toast';
import { useAuthStore } from '@/store/authStore';
import { uploadInvoicePdf, INVOICE_UPLOAD_WEBHOOK_URL } from '@/api/invoices';

interface InvoiceUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const userEmail = user?.email || 'finance@rystafmcg.com';

  const resetState = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setIsUploading(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      resetState();
      onOpenChange(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // Validate PDF
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage('Please select a valid PDF file. Other file formats are not supported.');
      return;
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // POST request using FormData:
      // key "data" -> selectedFile
      // key "email" -> userEmail
      await uploadInvoicePdf(selectedFile, userEmail);

      toast({
        title: 'Invoice Uploaded Successfully',
        description: `Invoice "${selectedFile.name}" was sent to the extraction webhook.`,
        variant: 'success',
      });

      // Reset and trigger refresh callback
      resetState();
      onOpenChange(false);

      // 4. Auto-Refresh After Upload: Immediately re-fetch from Supabase 1 second after upload completes
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('rysta-invoices-refresh'));
          window.dispatchEvent(new CustomEvent('rysta-cashflow-refresh'));
        }
      }, 1000);
    } catch (err: any) {
      const msg = err.message || 'Invoice PDF upload failed. Please verify your connection.';
      setErrorMessage(msg);
      toast({
        title: 'Upload Failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Upload Invoice PDF</DialogTitle>
              <DialogDescription className="text-xs">
                Upload GST tax invoices for autonomous AI extraction & ledger reconciliation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Webhook Destination Info */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px]">
            <span className="text-muted-foreground">Submitting as:</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]" title={userEmail}>
              {userEmail}
            </span>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="max-w-[260px] truncate">
                  <p className="font-semibold text-xs text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatFileSize(selectedFile.size)} • PDF Ready</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  className="h-6 text-[11px] text-muted-foreground hover:text-destructive"
                  disabled={isUploading}
                >
                  <X className="h-3 w-3 mr-1" /> Remove File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to browse or drag & drop invoice PDF
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports GST e-Invoices, vendor tax bills up to 25MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Compliance Badge */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> GSTN Format Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Auto-Extraction Enabled
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
            className="text-xs h-9"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
          >
            {isUploading ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Uploading & Processing...</span>
              </>
            ) : (
              <>
                <FileUp className="h-3.5 w-3.5" />
                <span>Submit Invoice PDF</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
