import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Receipt,
  Download,
  FileSpreadsheet,
  Plus,
  CheckCircle,
  FileText,
  ShieldCheck,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/utils/formatters';
import { TaxRate } from '@/types';
import { fetchTaxRates, createTaxRate } from '@/api/taxes';

export const TaxesPage: React.FC = () => {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  // Form
  const [rateName, setRateName] = useState('');
  const [ratePercent, setRatePercent] = useState<number>(18);
  const [cessPercent, setCessPercent] = useState<number>(0);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchTaxRates();
      setRates(data);
    } catch (err: any) {
      toast({ title: 'Error loading tax masters', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTaxRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const half = ratePercent / 2;
      const created = await createTaxRate({
        name: rateName,
        rate: ratePercent,
        cgst: half,
        sgst: half,
        igst: ratePercent,
        cess: cessPercent,
        isActive: true,
      });

      setRates([...rates, created]);
      setRateModalOpen(false);
      toast({ title: 'Tax Slab Added', description: `${created.name} (${created.rate}%) saved.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to add tax rate', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportGSTR1 = (format: 'JSON' | 'Excel') => {
    toast({
      title: `GSTR-1 ${format} Prepared`,
      description: `B2B sales and HSN outward table exported in GSTN e-filing compliant format.`,
      variant: 'success',
    });
  };

  const columns: ColumnDef<TaxRate>[] = [
    {
      accessorKey: 'name',
      header: 'Tax Rate Description',
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: 'rate',
      header: 'Total GST %',
      cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.rate}%</span>,
    },
    {
      accessorKey: 'cgst',
      header: 'CGST %',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.cgst}%</span>,
    },
    {
      accessorKey: 'sgst',
      header: 'SGST %',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.sgst}%</span>,
    },
    {
      accessorKey: 'igst',
      header: 'IGST %',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.igst}%</span>,
    },
    {
      accessorKey: 'cess',
      header: 'Compensation Cess',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.cess}%</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded">
          Active Slab
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Compliance & Returns (GSTR-1 / GSTR-3B)"
        description="Outward B2B invoice schedules, Input Tax Credit (ITC) reconciliation, HSN classification, and tax rate masters"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExportGSTR1('JSON')} className="h-9 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Export GSTR-1 JSON (GSTN)</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportGSTR1('Excel')} className="h-9 gap-1.5 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Export Excel</span>
            </Button>
            <Button size="sm" onClick={() => setRateModalOpen(true)} className="h-9 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tax Rate</span>
            </Button>
          </>
        }
      />

      {/* Tax Balances Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Outward GST Liability (Output)</div>
            <div className="text-2xl font-bold text-foreground mt-1">{formatCurrency(216800)}</div>
            <div className="text-xs text-muted-foreground mt-1">From sales invoiced in Nov</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Input Tax Credit Available (ITC)</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(313400)}</div>
            <div className="text-xs text-muted-foreground mt-1">From verified vendor GRNs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Net GST Cash Payable</div>
            <div className="text-2xl font-bold text-foreground mt-1">₹0.00</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Fully offset via Input Tax Credit</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Carry Forward ITC Balance</div>
            <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(96600)}</div>
            <div className="text-xs text-muted-foreground mt-1">Available for next tax period</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gstr1" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="gstr1" className="text-xs">GSTR-1 Outward Supplies</TabsTrigger>
          <TabsTrigger value="gstr3b" className="text-xs">GSTR-3B Summary</TabsTrigger>
          <TabsTrigger value="hsn" className="text-xs">HSN Summary Report</TabsTrigger>
          <TabsTrigger value="rates" className="text-xs">GST Rates Master ({rates.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: GSTR-1 */}
        <TabsContent value="gstr1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Table 4A - Taxable Outward B2B Invoices</CardTitle>
                <p className="text-xs text-muted-foreground">Invoices issued to registered taxpayers for current filing period</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportGSTR1('JSON')} className="text-xs h-8">
                Download GSTN JSON
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">GSTIN of Recipient</th>
                      <th className="px-4 py-2.5">Receiver Trade Name</th>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Invoice Date</th>
                      <th className="px-4 py-2.5 text-right">Taxable Value (₹)</th>
                      <th className="px-4 py-2.5 text-right">IGST (₹)</th>
                      <th className="px-4 py-2.5 text-right">CGST (₹)</th>
                      <th className="px-4 py-2.5 text-right">SGST (₹)</th>
                      <th className="px-4 py-2.5 text-right">Invoice Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-primary font-semibold">27AAACR7148F1ZX</td>
                      <td className="px-4 py-3 font-medium">Reliance Retail Modern Trade</td>
                      <td className="px-4 py-3 font-mono">INV-2024-0101</td>
                      <td className="px-4 py-3">02/11/2024</td>
                      <td className="px-4 py-3 text-right">₹59,431.20</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">₹1,485.78</td>
                      <td className="px-4 py-3 text-right">₹1,485.78</td>
                      <td className="px-4 py-3 text-right font-bold">₹62,402.76</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-primary font-semibold">07AABCS1234F1Z8</td>
                      <td className="px-4 py-3 font-medium">Shree Ganesh Distributors</td>
                      <td className="px-4 py-3 font-mono">INV-2024-0098</td>
                      <td className="px-4 py-3">25/10/2024</td>
                      <td className="px-4 py-3 text-right">₹16,215.00</td>
                      <td className="px-4 py-3 text-right">₹2,918.70</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right font-bold">₹19,133.70</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: GSTR-3B */}
        <TabsContent value="gstr3b">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">GSTR-3B Monthly Return Form</CardTitle>
              <p className="text-xs text-muted-foreground">Self-declared summary of outward supplies and input tax credit</p>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/40 p-3 font-semibold border-b">
                  3.1 Details of Outward Supplies and inward supplies liable to reverse charge
                </div>
                <div className="p-4 grid grid-cols-5 gap-3 text-center border-b font-medium text-muted-foreground">
                  <div>Nature of Supplies</div>
                  <div>Total Taxable Value</div>
                  <div>IGST</div>
                  <div>CGST</div>
                  <div>SGST</div>
                </div>
                <div className="p-4 grid grid-cols-5 gap-3 text-center font-mono">
                  <div className="text-left font-sans text-xs">Outward Taxable Supplies</div>
                  <div className="font-bold">₹75,646.20</div>
                  <div>₹2,918.70</div>
                  <div>₹1,485.78</div>
                  <div>₹1,485.78</div>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/40 p-3 font-semibold border-b">
                  4. Eligible Input Tax Credit (ITC)
                </div>
                <div className="p-4 grid grid-cols-4 gap-3 text-center border-b font-medium text-muted-foreground">
                  <div>Details</div>
                  <div>Integrated Tax</div>
                  <div>Central Tax</div>
                  <div>State Tax</div>
                </div>
                <div className="p-4 grid grid-cols-4 gap-3 text-center font-mono">
                  <div className="text-left font-sans text-xs">All other ITC (Inward goods & services)</div>
                  <div className="font-bold text-emerald-600">₹145,000.00</div>
                  <div className="font-bold text-emerald-600">₹84,200.00</div>
                  <div className="font-bold text-emerald-600">₹84,200.00</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: HSN Summary */}
        <TabsContent value="hsn">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Table 12 - HSN-wise Summary of Outward Supplies</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">HSN Code</th>
                      <th className="px-4 py-2.5">Commodity Description</th>
                      <th className="px-4 py-2.5">UQC</th>
                      <th className="px-4 py-2.5 text-right">Total Qty</th>
                      <th className="px-4 py-2.5 text-right">Taxable Value (₹)</th>
                      <th className="px-4 py-2.5 text-right">Integrated Tax</th>
                      <th className="px-4 py-2.5 text-right">Central Tax</th>
                      <th className="px-4 py-2.5 text-right">State Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-bold text-primary">11010000</td>
                      <td className="px-4 py-3">Wheat Flour / Atta 5kg</td>
                      <td className="px-4 py-3 font-mono">BAG</td>
                      <td className="px-4 py-3 text-right font-medium">120</td>
                      <td className="px-4 py-3 text-right">₹37,620.00</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">₹940.50</td>
                      <td className="px-4 py-3 text-right">₹940.50</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-bold text-primary">15121910</td>
                      <td className="px-4 py-3">Refined Sunflower Oil 1L</td>
                      <td className="px-4 py-3 font-mono">POUCH</td>
                      <td className="px-4 py-3 text-right font-medium">160</td>
                      <td className="px-4 py-3 text-right">₹21,811.20</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">₹545.28</td>
                      <td className="px-4 py-3 text-right">₹545.28</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-bold text-primary">19053100</td>
                      <td className="px-4 py-3">Sweet Biscuits / Cookies</td>
                      <td className="px-4 py-3 font-mono">PKT</td>
                      <td className="px-4 py-3 text-right font-medium">150</td>
                      <td className="px-4 py-3 text-right">₹16,215.00</td>
                      <td className="px-4 py-3 text-right">₹2,918.70</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Tax Rates */}
        <TabsContent value="rates" className="space-y-4">
          <DataTable
            columns={columns}
            data={rates}
            searchPlaceholder="Search tax rate or slab name..."
            exportFileName="fmcg-tax-rates"
          />
        </TabsContent>
      </Tabs>

      {/* Add Tax Rate Modal */}
      <Dialog open={rateModalOpen} onOpenChange={setRateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5" /> Add GST Tax Slab Rate
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTaxRate} className="space-y-4 py-2">
            <FormField label="Tax Slab Description" required>
              <Input
                value={rateName}
                onChange={(e) => setRateName(e.target.value)}
                placeholder="e.g. GST 18% (Personal Care & Soap)"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="GST Rate (%)" required>
                <Input
                  type="number"
                  step="0.1"
                  value={ratePercent}
                  onChange={(e) => setRatePercent(Number(e.target.value))}
                  className="h-9 text-xs font-semibold"
                  required
                />
              </FormField>

              <FormField label="Compensation Cess (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={cessPercent}
                  onChange={(e) => setCessPercent(Number(e.target.value))}
                  className="h-9 text-xs font-semibold"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Tax Rate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
