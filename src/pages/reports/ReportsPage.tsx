import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Mail,
  Play,
  Bookmark,
  Calendar,
  Layers,
  PieChart as PieIcon,
  DollarSign,
  Receipt,
  Scale,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ChartCard } from '@/components/shared/ChartCard';
import { DateRangePicker, DateRange } from '@/components/shared/DateRangePicker';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('receivables_aging');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    label: 'This Month',
  });
  const [regionFilter, setRegionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { toast } = useToast();

  const handleRunReport = () => {
    toast({
      title: 'Report Generated',
      description: `Calculated metrics for ${selectedReport.replace(/_/g, ' ').toUpperCase()}.`,
      variant: 'success',
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    toast({
      title: 'Excel Export Initiated',
      description: `${selectedReport}.xlsx generated and downloading.`,
      variant: 'success',
    });
  };

  const handleScheduleEmail = () => {
    toast({
      title: 'Email Schedule Activated',
      description: 'Recurring monthly digest scheduled via n8n cron workflow to finance@rystafmcg.com.',
      variant: 'info',
    });
  };

  const handleSaveFilter = () => {
    toast({
      title: 'Filter Preset Saved',
      description: 'Preset saved as default view for this report.',
      variant: 'success',
    });
  };

  // Mock Data for Various Reports
  const agingData = [
    { period: '0-30 Days', amount: 2540000, count: 28 },
    { period: '31-60 Days', amount: 1120000, count: 12 },
    { period: '61-90 Days', amount: 560000, count: 6 },
    { period: '90+ Days', amount: 215600, count: 3 },
  ];

  const pnlData = [
    { month: 'Jul', revenue: 3120000, cogs: 2100000, expenses: 420000, netProfit: 600000 },
    { month: 'Aug', revenue: 3450000, cogs: 2350000, expenses: 450000, netProfit: 650000 },
    { month: 'Sep', revenue: 3200000, cogs: 2180000, expenses: 440000, netProfit: 580000 },
    { month: 'Oct', revenue: 4100000, cogs: 2750000, expenses: 510000, netProfit: 840000 },
    { month: 'Nov', revenue: 3845200, cogs: 2580000, expenses: 490000, netProfit: 775200 },
  ];

  const salesByRegion = [
    { region: 'West (MH & GA)', revenue: 1680000, orders: 45 },
    { region: 'North (Delhi & UP)', revenue: 1120000, orders: 32 },
    { region: 'South (KA & TN)', revenue: 750000, orders: 20 },
    { region: 'Central (MP)', revenue: 295200, orders: 9 },
  ];

  const reportCatalog = [
    { id: 'receivables_aging', name: 'Receivables Aging Report', icon: Receipt, category: 'Credit' },
    { id: 'payables_aging', name: 'Payables Aging Report', icon: Receipt, category: 'Credit' },
    { id: 'sales_performance', name: 'Sales by SKU & Region', icon: TrendingUp, category: 'Sales' },
    { id: 'margin_analysis', name: 'Gross Margin & Discount Analysis', icon: Percent, category: 'Profitability' },
    { id: 'stock_valuation', name: 'Stock Valuation (FIFO)', icon: Layers, category: 'Inventory' },
    { id: 'pnl_statement', name: 'Monthly Profit & Loss (P&L)', icon: DollarSign, category: 'Financials' },
    { id: 'balance_sheet', name: 'Consolidated Balance Sheet', icon: Scale, category: 'Financials' },
    { id: 'cash_flow', name: 'Direct Cash Flow Statement', icon: BarChart3, category: 'Financials' },
    { id: 'trade_spend', name: 'Trade Promotion Scheme ROI', icon: PieIcon, category: 'Marketing' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FMCG Financial Reports & Analytics"
        description="Comprehensive receivables aging, territorial margin analysis, P&L, balance sheet, and trade spend efficacy"
        actions={
          <>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button size="sm" onClick={handleRunReport} className="h-9 gap-1.5 text-xs">
              <Play className="h-3.5 w-3.5" />
              <span>Run Report</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 gap-1.5 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Excel</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleScheduleEmail} className="h-9 gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Schedule Email</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSaveFilter} className="h-9 gap-1.5 text-xs">
              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Save Filter</span>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Report Selector Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Standard Financial Reports
          </div>
          {reportCatalog.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedReport === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-card border hover:bg-muted text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Report Canvas */}
        <div className="space-y-6 lg:col-span-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border text-xs">
            <span className="font-semibold text-muted-foreground">Filters:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-8 rounded-md border bg-background px-2.5 text-xs"
            >
              <option value="all">All Regions</option>
              <option value="West">West Zone</option>
              <option value="North">North Zone</option>
              <option value="South">South Zone</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-md border bg-background px-2.5 text-xs"
            >
              <option value="all">All FMCG Categories</option>
              <option value="Staples & Grains">Staples & Grains</option>
              <option value="Edible Oils">Edible Oils</option>
              <option value="Packaged Foods & Snacks">Packaged Foods & Snacks</option>
            </select>

            <span className="ml-auto font-mono text-muted-foreground text-[11px]">
              Active: {dateRange.label}
            </span>
          </div>

          {/* Dynamic Content Based on Selected Report */}
          {selectedReport === 'receivables_aging' && (
            <div className="space-y-6">
              <ChartCard
                title="Trade Receivables Aging Distribution"
                description="Overdue invoice distribution across credit windows"
              >
                <div className="h-[260px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="period" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(val) => formatCompactCurrency(val)} />
                      <Tooltip formatter={(val: number) => [formatCurrency(val), 'Receivables']} />
                      <Bar dataKey="amount" name="Outstanding Balance (₹)" fill="#be185d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Aging Breakdown Table</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5">Aging Slab</th>
                        <th className="px-4 py-2.5">Invoice Count</th>
                        <th className="px-4 py-2.5 text-right">Outstanding (₹)</th>
                        <th className="px-4 py-2.5 text-right">% of Book</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {agingData.map((d) => (
                        <tr key={d.period} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-semibold text-foreground">{d.period}</td>
                          <td className="px-4 py-3">{d.count} Invoices</td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(d.amount)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {((d.amount / 4435600) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50 font-bold border-t">
                      <tr>
                        <td colSpan={2} className="px-4 py-3">Total Receivables Outstanding</td>
                        <td className="px-4 py-3 text-right text-primary text-sm">₹44,35,600.00</td>
                        <td className="px-4 py-3 text-right">100.0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedReport === 'pnl_statement' && (
            <div className="space-y-6">
              <ChartCard
                title="Monthly Profit & Loss Trend (MTD)"
                description="Revenue vs COGS and Net Operating Margin"
              >
                <div className="h-[260px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pnlData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(val) => formatCompactCurrency(val)} />
                      <Tooltip formatter={(val: number) => [formatCurrency(val), '']} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Line type="monotone" dataKey="revenue" name="Sales Revenue" stroke="#be185d" strokeWidth={2} />
                      <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Monthly Income Statement (P&L)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b font-semibold text-sm">
                    <span>Gross Sales Revenue</span>
                    <span className="text-primary">₹38,45,200.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-muted-foreground pl-4">
                    <span>Less: Cost of Goods Sold (Raw materials & packaging)</span>
                    <span>- ₹25,80,000.00</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b font-bold">
                    <span>Gross Operating Profit (32.9%)</span>
                    <span>₹12,65,200.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-muted-foreground pl-4">
                    <span>Less: Outward Logistics & Freight</span>
                    <span>- ₹1,40,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-muted-foreground pl-4">
                    <span>Less: Warehouse Leases & Utilities</span>
                    <span>- ₹1,80,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-muted-foreground pl-4">
                    <span>Less: Trade Promotion Schemes & Slabs</span>
                    <span>- ₹1,70,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Net Operating Income (EBITDA)</span>
                    <span>₹7,75,200.00</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedReport !== 'receivables_aging' && selectedReport !== 'pnl_statement' && (
            <div className="space-y-6">
              <ChartCard
                title={`${selectedReport.replace(/_/g, ' ').toUpperCase()} Analysis`}
                description="Territorial performance and margin distribution"
              >
                <div className="h-[260px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByRegion}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="region" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(val) => formatCompactCurrency(val)} />
                      <Tooltip formatter={(val: number) => [formatCurrency(val), 'Revenue']} />
                      <Bar dataKey="revenue" name="Gross Revenue (₹)" fill="#be185d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Regional Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5">Region</th>
                        <th className="px-4 py-2.5">Dispatched Orders</th>
                        <th className="px-4 py-2.5 text-right">Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesByRegion.map((r) => (
                        <tr key={r.region} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-semibold text-foreground">{r.region}</td>
                          <td className="px-4 py-3">{r.orders} Orders</td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
