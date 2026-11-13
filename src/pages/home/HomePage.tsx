import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Zap,
  Building2,
  ChevronRight,
  Layers,
  LineChart,
  PieChart,
  DollarSign,
  Sun,
  Moon,
  Database,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export const HomePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none tracking-tight">
                Rysta <span className="text-primary font-semibold">Finance</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                AI Cash Flow & Invoicing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#ai-cash-flow" className="hover:text-foreground transition-colors">
              AI Cash Flow
            </a>
            <a href="#invoicing" className="hover:text-foreground transition-colors">
              GST Invoicing
            </a>
            <a href="#shortage-forecasting" className="hover:text-foreground transition-colors">
              Shortage Forecasting
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Security
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                  Go to Dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="ghost" className="font-medium text-sm">
                    Sign In
                  </Button>
                </Link>

                <Link to="/auth?mode=signup">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                    Get Started / Sign Up
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Badge
              variant="outline"
              className="px-3.5 py-1 mb-6 text-xs sm:text-sm font-medium border-primary/30 bg-primary/5 text-primary rounded-full flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Next-Gen FMCG Financial Intelligence Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Real-Time <span className="text-primary">Cash Flow</span>, Instant Invoicing & Predictive{' '}
              <span className="text-primary">Shortage Forecasting</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Empower your FMCG distribution and operations with autonomous cash runway forecasting,
              frictionless GST e-invoice matching, and intelligent stockout protection.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90">
                      Open Financial Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/invoices" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-border hover:bg-muted/50">
                      Track Invoices
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/auth?mode=login" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-border hover:bg-muted/50">
                      Sign In to Console
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                GST & E-Way Bill Compliant
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                n8n Webhook Connected
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" />
                Bank-Grade 256-Bit Security
              </span>
            </div>
          </div>

          {/* Interactive Platform Preview Mockup */}
          <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card p-3 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-muted-foreground ml-2">app.rysta-finance.com/dashboard</span>
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Live Financial Feed Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Metric 1 */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>30-Day Cash Flow Runway</span>
                  <LineChart className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold mt-2">₹42.8 Lakhs</div>
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                  <TrendingUp className="h-3 w-3" /> +18.4% surplus forecast
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>E-Invoices Tracked & Settled</span>
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold mt-2">1,248 Bills</div>
                <div className="text-xs text-muted-foreground mt-1">
                  99.8% auto-reconciled with GSTN
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Shortage Risk Shield</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold mt-2">3 SKUs Hedged</div>
                <div className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium">
                  Auto-PO reordered 4 days early
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars Section */}
      <section id="features" className="py-20 bg-muted/20 border-t border-border/50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built Specifically for Fast-Moving Consumer Goods Finance
            </h3>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Eliminate working capital bottlenecks, eliminate manual billing discrepancies, and keep your
              supply pipeline uninterrupted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: AI Cash Flow */}
            <div id="ai-cash-flow" className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold mb-3">AI-Powered Cash Flow</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Intelligent predictive models calculate rolling 30, 60, and 90-day working capital projections.
                  Identify receivable aging and prevent liquidity traps before they occur.
                </p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Rolling cash runway alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Debtor aging & DSO reduction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Multi-account liquidity pooling
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-border/50">
                <Link to="/auth?mode=signup" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                  Explore Cash Flow <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Invoice Tracking */}
            <div id="invoicing" className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Receipt className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold mb-3">Automated GST Invoice Tracking</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Streamline sales orders, tax invoices, and supplier bills with automated E-Way Bill generation,
                  GSTIN validation, and instant discrepancy flagging.
                </p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Direct GST e-Invoicing reconciliation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Three-way PO, Bill & GRN matching
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Instant payment collection webhooks
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-border/50">
                <Link to="/auth?mode=signup" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                  Explore Invoicing <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Shortage Forecasting */}
            <div id="shortage-forecasting" className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold mb-3">Shortage & Stockout Forecasting</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Never lose revenue to sudden stockouts. Rysta analyzes sales velocity and supplier lead times
                  to forecast inventory depletion days ahead of time.
                </p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Automated safety-stock triggers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Seasonal demand velocity modeling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Supplier replenishment suggestions
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-border/50">
                <Link to="/auth?mode=signup" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                  Explore Forecasting <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Backend Section */}
      <section id="security" className="py-16 border-t border-border/40">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary/5 border border-primary/20 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">Enterprise Reliability</Badge>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Connected with Secure Webhook & API Infrastructure
              </h3>
              <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                Rysta Finance integrates seamlessly with n8n autonomous agents and API backend endpoints
                to execute high-concurrency order processing and continuous reconciliation.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md shadow-primary/20">
                  Create Business Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button size="lg" variant="outline" className="px-6">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 bg-background mt-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              R
            </div>
            <span className="font-semibold text-foreground">Rysta Finance</span>
            <span>— FMCG Cash Flow & Invoicing Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/auth?mode=login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
            <span>© {new Date().getFullYear()} Rysta Technologies. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
