import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './guards';

// Landing Page
import { HomePage } from '@/pages/home/HomePage';

// Auth Pages
import { AuthPage } from '@/pages/auth/AuthPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { UnauthorizedPage, NotFoundPage } from '@/pages/auth/UnauthorizedPage';

// App Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProductsListPage } from '@/pages/products/ProductsListPage';
import { CustomersListPage } from '@/pages/customers/CustomersListPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { SuppliersListPage } from '@/pages/suppliers/SuppliersListPage';
import { SupplierDetailPage } from '@/pages/suppliers/SupplierDetailPage';
import { SalesOrdersListPage } from '@/pages/sales-orders/SalesOrdersListPage';
import { SalesOrderFormPage } from '@/pages/sales-orders/SalesOrderFormPage';
import { InvoicesListPage } from '@/pages/invoices/InvoicesListPage';
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage';
import { PaymentsListPage } from '@/pages/payments/PaymentsListPage';
import { PaymentFormPage } from '@/pages/payments/PaymentFormPage';
import { PurchaseOrdersPage } from '@/pages/purchase-orders/PurchaseOrdersPage';
import { PurchaseOrderFormPage } from '@/pages/purchase-orders/PurchaseOrderFormPage';
import { BillsListPage } from '@/pages/purchase-orders/BillsListPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { PromotionsPage } from '@/pages/promotions/PromotionsPage';
import { PriceListsPage } from '@/pages/promotions/PriceListsPage';
import { AccountingPage } from '@/pages/accounting/AccountingPage';
import { CashFlowPage } from '@/pages/accounting/CashFlowPage';
import { ExpensesPage } from '@/pages/accounting/ExpensesPage';
import { IncomePage } from '@/pages/accounting/IncomePage';
import { AIFinancialAnalystPage } from '@/pages/analyst/AIFinancialAnalystPage';
import { TaxesPage } from '@/pages/taxes/TaxesPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/settings/ProfilePage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';

export const router = createBrowserRouter([
  // Landing / Home Page (Default Route /)
  {
    path: '/',
    element: <HomePage />,
  },

  // Public Auth Routes
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/auth',
        element: (
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/login',
        element: <Navigate to="/auth?mode=login" replace />,
      },
      {
        path: '/register',
        element: <Navigate to="/auth?mode=signup" replace />,
      },
      {
        path: '/forgot-password',
        element: (
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },
    ],
  },

  // Protected App Routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/products/*',
        element: <Navigate to="/invoices" replace />,
      },
      {
        path: '/customers/*',
        element: <Navigate to="/invoices" replace />,
      },
      {
        path: '/suppliers/*',
        element: <Navigate to="/expenses" replace />,
      },
      {
        path: '/sales-orders/*',
        element: <Navigate to="/invoices" replace />,
      },
      {
        path: '/purchase-orders/*',
        element: <Navigate to="/expenses" replace />,
      },
      {
        path: '/bills/*',
        element: <Navigate to="/expenses" replace />,
      },
      {
        path: '/inventory/*',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/promotions/*',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/price-lists/*',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/invoices',
        element: <InvoicesListPage />,
      },
      {
        path: '/invoices/:id',
        element: <InvoiceDetailPage />,
      },
      {
        path: '/payments',
        element: <PaymentsListPage />,
      },
      {
        path: '/payments/new',
        element: <PaymentFormPage />,
      },
      {
        path: '/expenses',
        element: <ExpensesPage />,
      },
      {
        path: '/income',
        element: <IncomePage />,
      },
      {
        path: '/cashflow',
        element: <CashFlowPage />,
      },
      {
        path: '/cash-flow',
        element: <CashFlowPage />,
      },
      {
        path: '/accounting/cash-flow',
        element: <CashFlowPage />,
      },
      {
        path: '/financial-analyst',
        element: <AIFinancialAnalystPage />,
      },
      {
        path: '/ai-financial-analyst',
        element: <AIFinancialAnalystPage />,
      },
      {
        path: '/analyst',
        element: <AIFinancialAnalystPage />,
      },
      {
        path: '/accounting',
        element: <Navigate to="/expenses" replace />,
      },
      {
        path: '/taxes',
        element: <Navigate to="/reports" replace />,
      },
      {
        path: '/reports',
        element: <ReportsPage />,
      },
      {
        path: '/admin/users',
        element: <Navigate to="/settings" replace />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
    ],
  },

  // 404 Catch-All
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
