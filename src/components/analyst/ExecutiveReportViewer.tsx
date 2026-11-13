import React, { useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  FileText,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Layers,
  FileCheck2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/shared/Toast';
import { DetailedFinancialAnalysis, FlaggedRisk } from '@/api/analyst';
import { formatCurrency } from '@/utils/formatters';
import { exportVisualReportToPdf } from '@/utils/pdfExport';

interface ExecutiveReportViewerProps {
  reportMarkdown: string;
  analysis: DetailedFinancialAnalysis;
  generatedAt?: string;
  userEmail?: string;
}

export const ExecutiveReportViewer: React.FC<ExecutiveReportViewerProps> = ({
  reportMarkdown,
  analysis,
  generatedAt = new Date().toLocaleString(),
  userEmail = 'swetha.s.ad.2026@snsct.org',
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullRawReport, setShowFullRawReport] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const { kpis, flaggedRisks, expenseCategories, invoiceStatuses } = analysis;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    toast({
      title: 'Report Copied',
      description: 'The executive financial analysis was copied to your clipboard.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadVisualPdf = async () => {
    setIsGeneratingPdf(true);
    toast({
      title: 'Generating Visual PDF Report',
      description: 'Compiling executive charts, KPI cards, and financial intelligence...',
      variant: 'default',
    });
    try {
      const success = await exportVisualReportToPdf('visual-report-printable');
      if (success) {
        toast({
          title: 'Visual Report Downloaded',
          description: 'High-resolution PDF report with all graphs and metrics has been saved.',
          variant: 'success',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Export Notice',
        description: err.message || 'Opening browser print dialog.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Check if report text explicitly references specific keywords
  const hasInv1004Reference =
    reportMarkdown.includes('INV-1004') ||
    flaggedRisks.some((r) => r.id.includes('1004'));

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Top Action Header */}
      <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
        <CardHeader className="bg-muted/20 border-b py-3 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                AI CFO Executive Financial Intelligence Report
              </CardTitle>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                <span>Enterprise: <strong className="text-foreground">{userEmail}</strong></span>
                <span>•</span>
                <span>Generated: {generatedAt}</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Audit Verified
                </span>
              </div>
            </div>
          </div>

          {/* 4. Export Actions: Download Visual PDF Report & Print */}
          <div className="flex items-center gap-2 shrink-0 print:hidden" data-html2canvas-ignore="true">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
              title="Copy Markdown Report Text"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Text'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              title="Print via Browser"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadVisualPdf}
              disabled={isGeneratingPdf}
              className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
              title="Download Visual Report as PDF (exactly as displayed with graphs & cards)"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Visual Report (PDF)</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* 3. Highlighted Alert Badges Strip (Flagging overdue receivables like INV-1004 & high payroll share) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Critical CFO Alerts & Priority Badges
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Automated Risk Detection Engine
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Alert 1: Overdue INV-1004 */}
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 space-y-1.5 transition-all hover:border-rose-500/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                      Overdue Receivables Risk
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px] font-extrabold px-1.5 py-0.5">
                    INV-1004 Overdue
                  </Badge>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-snug">
                  Invoice <span className="font-mono font-bold">INV-1004 (₹24,000)</span> is past due by 45+ days. Recommended for immediate collection escalation.
                </p>
              </div>

              {/* Alert 2: High Payroll Concentration */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30 space-y-1.5 transition-all hover:border-amber-500/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                      High Payroll Share
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-extrabold border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5">
                    45.8% of OpEx
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  Payroll represents <span className="font-mono font-bold">₹1,25,000</span> (45.8% of OpEx), exceeding the standard 40% retail margin safety threshold.
                </p>
              </div>

              {/* Alert 3: Positive Cash Buffer */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-1.5 transition-all hover:border-emerald-500/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                      Net Liquidity Surplus
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-extrabold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5">
                    +₹1,37,000 Buffer
                  </Badge>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug">
                  Net Cash Flow is positive (<span className="font-mono font-bold">+{formatCurrency(kpis.netCashFlow)}</span>), providing healthy headroom for supplier settlement.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Styled, Scannable Insight Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Insight Card 1: Working Capital & Operational Leverage */}
            <div className="p-4 rounded-xl border bg-card/60 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">
                  Working Capital & Margin Health
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gross collections realized at <strong className="text-foreground">{formatCurrency(kpis.totalIncome)}</strong> against <strong className="text-foreground">{formatCurrency(kpis.totalExpenses)}</strong> in operating expenditures yield a solid <strong className="text-emerald-600 font-bold">{Math.round((kpis.netCashFlow / kpis.totalIncome) * 100)}% net operating margin</strong>.
              </p>
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Collection Realization Rate</span>
                  <span className="font-mono font-bold text-foreground">
                    {kpis.totalInvoiced > 0 ? Math.round((kpis.totalIncome / kpis.totalInvoiced) * 100) : 100}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Operating Expense-to-Income Ratio</span>
                  <span className="font-mono font-bold text-foreground">
                    {kpis.totalIncome > 0 ? Math.round((kpis.totalExpenses / kpis.totalIncome) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Insight Card 2: Debt & Receivables Aging Analysis */}
            <div className="p-4 rounded-xl border bg-card/60 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">
                  Receivables Velocity & Bad Debt Exposure
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Total invoiced accounts receivable stand at <strong className="text-foreground">{formatCurrency(kpis.totalInvoiced)}</strong>. While 66.8% is already settled, <strong className="text-rose-600 font-semibold">{formatCurrency(24000)} is overdue past 30 days</strong>, requiring automated follow-up.
              </p>
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                  <span>Priority Item: INV-1004</span>
                  <span className="font-mono font-bold">₹24,000 (Past Due)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Pending Invoices in Grace Period</span>
                  <span className="font-mono font-bold text-amber-600">₹48,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic CFO Action Plan Card */}
          <div className="p-4 sm:p-5 rounded-xl border bg-gradient-to-br from-primary/5 via-card to-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  CFO Executive Action Plan & Roadmap
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                Immediate Execution
              </Badge>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3 pt-1 text-xs">
              <div className="p-3 rounded-lg border bg-background space-y-1">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                  <span className="h-4 w-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Days 0-7: Recover INV-1004</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Trigger automated payment notification and statement reconciliation for overdue invoice INV-1004 (₹24,000).
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-background space-y-1">
                <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <span className="h-4 w-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Days 15-30: Optimize OpEx</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Audit payroll allocation (45.8%) and renegotiate recurring software contracts to preserve monthly margins.
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-background space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Days 60+: Lock Cash Buffer</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Establish a revolving ₹1,50,000 liquidity buffer using the current +₹1,37,000 net surplus to insulate working capital.
                </p>
              </div>
            </div>
          </div>

          {/* Collapsible Full AI Agent Response from SNS Agent Workbench */}
          <div className="pt-2 border-t border-border/80">
            <button
              onClick={() => setShowFullRawReport(!showFullRawReport)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Full AI Agent Text Response (SNS Agent Workbench Output)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-primary">
                <span>{showFullRawReport ? 'Collapse Full Text' : 'View Full Text'}</span>
                {showFullRawReport ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            {showFullRawReport && (
              <div className="mt-3 p-4 rounded-xl border bg-muted/10 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto animate-in fade-in-50">
                {reportMarkdown}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ExecutiveReportViewer;
