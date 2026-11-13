import React, { useState, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCompactCurrency, formatDate } from '@/utils/formatters';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  Filter,
  X,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { DetailedFinancialAnalysis, ParsedInvoiceRow } from '@/api/analyst';

interface FinancialChartsGridProps {
  analysis: DetailedFinancialAnalysis;
}

export const FinancialChartsGrid: React.FC<FinancialChartsGridProps> = ({ analysis }) => {
  const { kpis, expenseCategories, invoiceStatuses, invoiceTypeBreakdown, invoiceRows } = analysis;

  // Active filter state for clickable drill-down (PENDING, PAID, OVERDUE)
  const [selectedStatus, setSelectedStatus] = useState<'PAID' | 'PENDING' | 'OVERDUE' | null>(null);
  const drillDownTableRef = useRef<HTMLDivElement>(null);

  const handleStatusClick = (status: 'PAID' | 'PENDING' | 'OVERDUE') => {
    setSelectedStatus(status);
    setTimeout(() => {
      drillDownTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleClearFilter = () => {
    setSelectedStatus(null);
  };

  // Filtered rows matching selectedStatus (or all if none selected)
  const displayedInvoices = selectedStatus
    ? invoiceRows.filter((inv) => inv.status === selectedStatus)
    : invoiceRows;

  // 1. Data for Income vs. Expenses Bar Chart
  const comparisonData = [
    {
      metric: 'Total Income',
      amount: kpis.totalIncome,
      fill: '#10b981', // Emerald
      label: 'Gross Receipts',
    },
    {
      metric: 'Total Expenses',
      amount: kpis.totalExpenses,
      fill: '#f43f5e', // Rose
      label: 'Operating Outflows',
    },
    {
      metric: 'Net Cash Flow',
      amount: kpis.netCashFlow,
      fill: kpis.netCashFlow >= 0 ? '#0ea5e9' : '#dc2626', // Sky or Red
      label: kpis.netCashFlow >= 0 ? 'Surplus Liquidity' : 'Cash Deficit',
    },
  ];

  // 2. Data for Horizontal Invoice Status Bar Chart
  const statusData = invoiceStatuses.map((item) => ({
    status: item.status,
    amount: item.amount,
    count: item.count,
    percentage: item.percentage,
    fill: item.color,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Interactive Visual Financial Intelligence Grid
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Click any status bar to drill down
          </span>
          <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
            3-Dataset Reconciled
          </Badge>
        </div>
      </div>

      {/* Grid of 3 visual charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart 1: Income vs. Expenses Bar Chart */}
        <Card className="border border-border/80 shadow-sm bg-card flex flex-col justify-between">
          <CardHeader className="bg-muted/20 pb-2 pt-4 px-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-foreground">
                    Income vs. Expenses
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Side-by-side operational cash realization
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {kpis.totalIncome > 0 ? Math.round((kpis.netCashFlow / kpis.totalIncome) * 100) : 0}% Margin
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="metric"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7 }}
                  />
                  <YAxis
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                    tick={{ fill: 'currentColor', opacity: 0.6 }}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Quick Summary Pill Bar */}
            <div className="mt-2 pt-2 border-t grid grid-cols-3 gap-1 text-center text-[10px]">
              <div>
                <span className="text-muted-foreground block">Income</span>
                <span className="font-bold font-mono text-emerald-600">
                  {formatCompactCurrency(kpis.totalIncome)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Expenses</span>
                <span className="font-bold font-mono text-rose-600">
                  {formatCompactCurrency(kpis.totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Net Cash</span>
                <span className="font-bold font-mono text-sky-600">
                  +{formatCompactCurrency(kpis.netCashFlow)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Expense Breakdown Donut/Pie Chart */}
        <Card className="border border-border/80 shadow-sm bg-card flex flex-col justify-between">
          <CardHeader className="bg-muted/20 pb-2 pt-4 px-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <PieIcon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-foreground">
                    Expense Breakdown
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Category distribution (Rupees & %)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                {formatCompactCurrency(kpis.totalExpenses)} Total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-[160px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Expenses']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown legend chips */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t text-[11px]">
              {expenseCategories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between bg-muted/30 px-2 py-1 rounded">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-foreground font-medium truncate">{cat.category}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[10px]">
                    <span className="font-bold text-foreground">{formatCompactCurrency(cat.amount)}</span>{' '}
                    <span className="text-muted-foreground">({cat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Invoice Status & Type Horizontal Bar Chart (CLICKABLE DRILL-DOWN) */}
        <Card className="border border-border/80 shadow-sm bg-card flex flex-col justify-between">
          <CardHeader className="bg-muted/20 pb-2 pt-4 px-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-foreground">
                    Invoice Status & Ledger Type
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Click bars to inspect individual invoice items
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {formatCompactCurrency(kpis.totalInvoiced)} Invoiced
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-3 space-y-3">
            {/* Clickable Status Filter Buttons for quick mobile / desktop access */}
            <div className="flex items-center gap-1.5 justify-between">
              {statusData.map((item) => {
                const isActive = selectedStatus === item.status;
                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => handleStatusClick(item.status as any)}
                    className={`flex-1 flex flex-col items-center py-1.5 px-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-primary border-primary bg-primary/10 font-bold'
                        : 'border-border/60 bg-muted/20 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-[10px] font-bold" style={{ color: item.fill }}>
                      {item.status}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-foreground">
                      {formatCompactCurrency(item.amount)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Horizontal Bar Breakdown with onClick on every bar segment and label */}
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={statusData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <XAxis
                    type="number"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={({ x, y, payload }) => (
                      <text
                        x={x}
                        y={y}
                        dy={4}
                        textAnchor="end"
                        fill="currentColor"
                        fontWeight={600}
                        style={{ cursor: 'pointer' }}
                        className="cursor-pointer transition-opacity hover:opacity-75"
                        onClick={() => handleStatusClick(payload.value)}
                      >
                        {payload.value}
                      </text>
                    )}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Total Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(entry: any) => {
                      if (entry && entry.status) {
                        handleStatusClick(entry.status);
                      }
                    }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        style={{ cursor: 'pointer' }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Split of Client Receivables vs. Supplier Payables */}
            <div className="pt-2 border-t space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-muted-foreground">Ledger Balance Type:</span>
                <span className="text-muted-foreground text-[10px]">
                  AR vs. AP Commitments
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">Client AR</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCompactCurrency(invoiceTypeBreakdown.receivables)} ({invoiceTypeBreakdown.receivablesPercentage}%)
                  </span>
                </div>

                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-300">Supplier AP</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    {formatCompactCurrency(invoiceTypeBreakdown.payables)} ({invoiceTypeBreakdown.payablesPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 1. Highlighted Filtered Invoices Drill-Down Table right below the chart */}
      <div ref={drillDownTableRef} className="pt-2">
        <Card className={`border shadow-sm transition-all duration-300 ${selectedStatus ? 'ring-2 ring-primary border-primary' : 'border-border/80'}`}>
          <CardHeader className="bg-muted/20 py-3 px-4 sm:px-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Filter className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>Filtered Invoices Drill-Down Table</span>
                  {selectedStatus ? (
                    <Badge
                      className={`text-[10px] font-extrabold uppercase ${
                        selectedStatus === 'PENDING'
                          ? 'bg-amber-500 text-white'
                          : selectedStatus === 'OVERDUE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      Filtered by: {selectedStatus} ({displayedInvoices.length} rows)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      All Invoices ({invoiceRows.length} rows)
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Detailed row inspection from uploaded invoices CSV with party, product, due date, and amount
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {selectedStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilter}
                  className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <X className="h-3 w-3" />
                  <span>Clear Filter</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {displayedInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="font-semibold text-foreground">No invoices matching status "{selectedStatus}"</p>
                <Button size="sm" variant="ghost" onClick={handleClearFilter} className="text-xs text-primary">
                  View All Invoices
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Party Name</th>
                      <th className="px-4 py-2.5">Product Name</th>
                      <th className="px-4 py-2.5">Invoice Type</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5 text-right">Total Amount</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedInvoices.map((inv, idx) => {
                      const isOverdueHighlight = inv.status === 'OVERDUE' || inv.invoice_number === 'INV-1004';
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-muted/20 transition-colors ${
                            isOverdueHighlight ? 'bg-rose-500/5 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-primary flex items-center gap-1.5">
                            {inv.invoice_number}
                            {isOverdueHighlight && (
                              <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping inline-block" title="Flagged Overdue" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {inv.party_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">
                            {inv.product_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold">
                              {inv.invoice_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {formatDate(inv.due_date)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            {formatCurrency(inv.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              className={`text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default FinancialChartsGrid;
