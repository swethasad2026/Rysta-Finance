import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  FileText,
  CreditCard,
  ClipboardList,
  Boxes,
  Percent,
  BookOpen,
  Receipt,
  BarChart3,
  Shield,
  Bell,
  Search,
  Plus,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BrainCircuit,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, canAccess } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SessionTimeoutDialog } from '@/components/shared/SessionTimeoutDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { getUserNotifications } from '@/api/supabaseService';
import { AIFinancialChatbot } from '@/components/chat/AIFinancialChatbot';
import { UserRole } from '@/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Executive & Analysis',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
      {
        title: 'AI Financial Analyst',
        href: '/financial-analyst',
        icon: BrainCircuit,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
      {
        title: 'Reports & Analytics',
        href: '/reports',
        icon: BarChart3,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
    ],
  },
  {
    groupTitle: 'Cash & Finance',
    items: [
      {
        title: 'Cash-flow & AI Prediction',
        href: '/cashflow',
        icon: TrendingUp,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
      {
        title: 'Invoice Management',
        href: '/invoices',
        icon: FileText,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
      {
        title: 'Payment Tracking',
        href: '/payments',
        icon: CreditCard,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
      {
        title: 'Expense Management',
        href: '/expenses',
        icon: TrendingDown,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
      {
        title: 'Income & Inflows',
        href: '/income',
        icon: ArrowUpRight,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
    ],
  },
  {
    groupTitle: 'System',
    items: [
      {
        title: 'Company Settings',
        href: '/settings',
        icon: ShoppingBag,
        allowedRoles: ['admin', 'accountant', 'sales'],
      },
    ],
  },
];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const displayName = user?.business_name || user?.name || (user?.email ? user.email.split('@')[0] : 'Business Account');
  const displayRole = user?.role ? String(user.role).toUpperCase() : 'USER';
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userNotifications = getUserNotifications(user?.email);
  const unreadNotificationsCount = userNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Quick navigation items for global search
  const searchablePages = [
    { name: 'Dashboard', path: '/dashboard', category: 'Executive' },
    { name: 'AI Financial Analyst', path: '/financial-analyst', category: 'Executive' },
    { name: 'Reports & Analytics', path: '/reports', category: 'Executive' },
    { name: 'Cash Flow & AI Prediction', path: '/cashflow', category: 'Finance' },
    { name: 'Invoice Management', path: '/invoices', category: 'Finance' },
    { name: 'Upload Invoice PDF', path: '/invoices', category: 'Finance' },
    { name: 'Payment Tracking', path: '/payments', category: 'Finance' },
    { name: 'Record Payment', path: '/payments/new', category: 'Finance' },
    { name: 'Expense Management', path: '/expenses', category: 'Finance' },
    { name: 'Income & Inflows', path: '/income', category: 'Finance' },
    { name: 'Company Settings', path: '/settings', category: 'Settings' },
    { name: 'Notifications & AI Alerts', path: '/notifications', category: 'General' },
  ];

  const filteredSearchResults = searchQuery
    ? searchablePages.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchablePages.slice(0, 6);

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      <SessionTimeoutDialog />

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Left Sidebar (Desktop) */}
        <aside
          className={`hidden lg:flex flex-col border-r bg-card transition-all duration-300 z-30 select-none ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Logo & Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!sidebarCollapsed && (
              <Link to="/dashboard" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base leading-tight tracking-tight text-foreground">
                    Rysta <span className="text-primary font-medium">FMCG</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Finance Portal
                  </span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/dashboard" className="mx-auto">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </Link>
            )}
          </div>

          {/* Sidebar Nav Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {NAVIGATION_GROUPS.map((group) => {
              // Filter items by user role
              const accessibleItems = group.items.filter((item) =>
                canAccess(user, item.allowedRoles)
              );

              if (accessibleItems.length === 0) return null;

              return (
                <div key={group.groupTitle} className="space-y-1">
                  {!sidebarCollapsed && (
                    <div className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.groupTitle}
                    </div>
                  )}
                  {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        title={sidebarCollapsed ? item.title : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* User Role Card at bottom */}
          <div className="p-3 border-t">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border/40">
                <UserAvatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-foreground" title={displayName}>
                    {displayName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase border border-primary/20">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <UserAvatar user={user} size="sm" />
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col w-72 bg-card border-r h-full p-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-base">Rysta FMCG</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                {NAVIGATION_GROUPS.map((group) => {
                  const accessibleItems = group.items.filter((item) =>
                    canAccess(user, item.allowedRoles)
                  );
                  if (accessibleItems.length === 0) return null;

                  return (
                    <div key={group.groupTitle} className="space-y-1">
                      <div className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {group.groupTitle}
                      </div>
                      {accessibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                              isActive
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 text-muted-foreground"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Sidebar toggle button (Desktop) */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <Menu className="h-4 w-4" />
              </Button>

              {/* Global search trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition-colors w-40 sm:w-64"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="truncate">Search modules, SKUs, invoices...</span>
                <kbd className="hidden sm:inline-block ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Quick Action</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">Finance Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/invoices')} className="cursor-pointer text-xs">
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    Upload Invoice PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/payments/new')} className="cursor-pointer text-xs">
                    <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
                    Record Payment / Receipt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/expenses')} className="cursor-pointer text-xs">
                    <TrendingDown className="mr-2 h-4 w-4 text-rose-500" />
                    Log Operating Expense
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/cashflow')} className="cursor-pointer text-xs">
                    <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" />
                    Cash Flow & Runway
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/financial-analyst')} className="cursor-pointer text-xs">
                    <BrainCircuit className="mr-2 h-4 w-4 text-primary" />
                    AI Financial Analyst (3-DB)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications Bell */}
              <Link to="/notifications" className="relative">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 p-1 rounded-full sm:rounded-lg sm:px-2 sm:py-1 hover:bg-muted/50 focus:outline-none transition-colors">
                    <UserAvatar user={user} size="sm" />
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[140px]" title={displayName}>
                        {displayName}
                      </span>
                      <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                        {displayRole}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1.5 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={user} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate" title={displayName}>
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={user?.email}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase border border-primary/20 inline-block">
                        {displayRole}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer text-xs">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    My Profile & Password
                  </DropdownMenuItem>
                  {canAccess(user, ['admin']) && (
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-xs">
                      <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
                      Company Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Scrollable Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* AI Financial Copilot Chatbot */}
      <AIFinancialChatbot />

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border bg-card shadow-2xl p-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-2 border-b pb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search FMCG modules, actions, pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
              {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      navigate(page.path);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span className="font-medium">{page.name}</span>
                    <span className="text-[11px] rounded bg-muted-foreground/10 px-2 py-0.5 text-muted-foreground font-semibold">
                      {page.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No matching pages found for "{searchQuery}"
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground flex justify-between">
              <span>Navigate with click or arrow keys</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
