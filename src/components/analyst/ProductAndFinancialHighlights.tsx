import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Clock,
  Receipt,
  Award,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Wheat,
  ChefHat,
  Lightbulb,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatters';
import { ProductPerformance, RawMaterialAnalysis } from '@/api/analyst';

interface ProductAndFinancialHighlightsProps {
  productPerformance: ProductPerformance;
  rawMaterialAnalysis: RawMaterialAnalysis;
}

export const ProductAndFinancialHighlights: React.FC<ProductAndFinancialHighlightsProps> = ({
  productPerformance,
  rawMaterialAnalysis,
}) => {
  const {
    mostSelling,
    lowestSelling,
    investMoreIn,
    investLessIn,
    totalPendingAmount,
    totalMonthlyExpenditure,
  } = productPerformance;

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Product Performance & Financial Highlights
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-semibold">
          Reconciled across Invoices & Income datasets
        </span>
      </div>

      {/* 2. Six Prominent Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Most Selling Product */}
        <div className="p-3.5 rounded-xl border bg-card shadow-xs space-y-1.5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Most Selling Product
            </span>
            <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-foreground truncate" title={mostSelling.name}>
              {mostSelling.name}
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(mostSelling.revenue)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
            <span>{mostSelling.units} units sold</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold">
              {mostSelling.trend}
            </Badge>
          </div>
        </div>

        {/* Card 2: Lowest Selling Product */}
        <div className="p-3.5 rounded-xl border bg-card shadow-xs space-y-1.5 flex flex-col justify-between hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Lowest Selling Product
            </span>
            <div className="h-6 w-6 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-foreground truncate" title={lowestSelling.name}>
              {lowestSelling.name}
            </div>
            <div className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
              {formatCurrency(lowestSelling.revenue)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
            <span>{lowestSelling.units} units sold</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 font-bold">
              {lowestSelling.trend}
            </Badge>
          </div>
        </div>

        {/* Card 3: Product to Invest More In */}
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1.5 flex flex-col justify-between hover:border-primary transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary">
              Product to Invest More In
            </span>
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-foreground truncate" title={investMoreIn.name}>
              {investMoreIn.name}
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
              {investMoreIn.reason}
            </p>
          </div>
          <div className="pt-1 border-t border-primary/20">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block truncate">
              {investMoreIn.roi}
            </span>
          </div>
        </div>

        {/* Card 4: Product to Invest Less In */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5 flex flex-col justify-between hover:border-amber-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              Product to Invest Less In
            </span>
            <div className="h-6 w-6 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-foreground truncate" title={investLessIn.name}>
              {investLessIn.name}
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
              {investLessIn.reason}
            </p>
          </div>
          <div className="pt-1 border-t border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block truncate">
              {investLessIn.risk}
            </span>
          </div>
        </div>

        {/* Card 5: Total Amount Pending */}
        <div className="p-3.5 rounded-xl border bg-card shadow-xs space-y-1.5 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Total Amount Pending
            </span>
            <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPendingAmount)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Unsettled client invoices
            </span>
          </div>
          <div className="pt-1 border-t flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Due Status</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold">
              Grace Period
            </Badge>
          </div>
        </div>

        {/* Card 6: Total Expenditure for the Month */}
        <div className="p-3.5 rounded-xl border bg-card shadow-xs space-y-1.5 flex flex-col justify-between hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Monthly Expenditure
            </span>
            <div className="h-6 w-6 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(totalMonthlyExpenditure)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Total OpEx & ingredient spend
            </span>
          </div>
          <div className="pt-1 border-t flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Disbursed</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 font-bold">
              100% Tracked
            </Badge>
          </div>
        </div>
      </div>

      {/* Featured Card: Top Raw Material Expense & Cheap-and-Best Alternative Suggestion */}
      <Card className="border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-card to-amber-500/10 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Column: Raw Material Metrics */}
            <div className="space-y-2 lg:max-w-md">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ChefHat className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Top Raw Material Expense
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Calculated dynamically from Ingredients category in Expenses CSV
                  </p>
                </div>
              </div>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-lg font-extrabold text-foreground font-mono">
                  {rawMaterialAnalysis.topIngredientName}
                </span>
                <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                  {formatCurrency(rawMaterialAnalysis.topIngredientSpend)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {rawMaterialAnalysis.ingredientCostPercentage}%
                </span>{' '}
                of total ingredient costs ({formatCurrency(rawMaterialAnalysis.totalIngredientCost)})
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-amber-700 dark:text-amber-300 font-medium">Largest Cost Driver</span>
              </div>
            </div>

            {/* Right Column: Smart Cheap-and-Best Alternative Suggestion */}
            <div className="flex-1 lg:max-w-xl p-3.5 rounded-xl border border-amber-500/20 bg-background/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Smart Cheap-and-Best Alternative Suggestion</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                  {rawMaterialAnalysis.potentialSavings}
                </Badge>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed">
                {rawMaterialAnalysis.recommendation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ProductAndFinancialHighlights;
