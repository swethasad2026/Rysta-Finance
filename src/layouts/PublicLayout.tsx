import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Sun, Moon, ArrowRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-muted/20 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-foreground">
              Rysta <span className="text-primary font-semibold">Finance</span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              AI Cash Flow & Invoicing
            </span>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Home
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthPage ? (
            <Link to="/">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                Back to Home
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth?mode=login">
                <Button variant="ghost" size="sm" className="text-xs font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm">
                  Get Started
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 px-6 text-center text-xs text-muted-foreground bg-background/50">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> GST & E-Way Bill Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> AI Cash Flow & Shortage Forecasting
          </span>
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/auth?mode=login" className="hover:underline">
            Sign In
          </Link>
          <Link to="/auth?mode=signup" className="hover:underline">
            Sign Up
          </Link>
          <span>© {new Date().getFullYear()} Rysta Technologies</span>
        </div>
      </footer>
    </div>
  );
};
