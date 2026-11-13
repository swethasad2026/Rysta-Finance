import {
  User,
  LoginLog,
  Product,
  Customer,
  Supplier,
  SalesOrder,
  Invoice,
  Payment,
  PurchaseOrder,
  Bill,
  BatchItem,
  StockMovement,
  Promotion,
  PriceList,
  Account,
  JournalEntry,
  TaxRate,
  AppNotification,
  CompanySettings,
} from '@/types';

export const INITIAL_USERS: User[] = [];
export const INITIAL_LOGIN_LOGS: LoginLog[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_SALES_ORDERS: SalesOrder[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_BILLS: Bill[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_BATCHES: BatchItem[] = [];
export const INITIAL_PROMOTIONS: Promotion[] = [];
export const INITIAL_PRICE_LISTS: PriceList[] = [];
export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];
export const INITIAL_TAX_RATES: TaxRate[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'Rysta FMCG',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  address: '',
  state: 'Maharashtra',
  pincode: '',
  invoicePrefix: 'INV-',
  poPrefix: 'PO-',
  paymentPrefix: 'PAY-',
  defaultTaxRate: 18,
  defaultPaymentTerms: 'Net 30',
  currency: 'INR',
  bankDetails: {
    accountName: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
  },
  n8nWebhookUrl: '',
  notificationPreferences: {
    emailNotifications: false,
    whatsappNotifications: false,
    lowStockAlerts: true,
    overdueAlerts: true,
  },
};
