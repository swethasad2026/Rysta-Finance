export type UserRole = 'admin' | 'accountant' | 'sales' | 'USER' | 'user' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  business_name?: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface LoginLog {
  id: string;
  timestamp: string;
  email: string;
  success: boolean;
  ip: string;
  userAgent?: string;
  reason?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  unit: string; // e.g., 'PCS', 'BOX', 'CASE', 'KG', 'LTR'
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  gstRate: number; // e.g. 5, 12, 18, 28
  hsnCode: string;
  stock: number;
  reorderLevel: number;
  status: 'active' | 'inactive';
  caseSize: number;
  unitsPerCase: number;
  imageUrl?: string;
  warehouse?: string;
  barcode?: string;
  createdAt: string;
}

export type CustomerType = 'retailer' | 'distributor' | 'modern_trade';

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  gstin: string;
  pan?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  region: string; // North, South, East, West, Central
  creditLimit: number;
  creditPeriodDays: number;
  paymentTerms: string;
  salespersonId: string;
  salespersonName: string;
  currentBalance: number; // Outstanding receivables
  status: 'active' | 'blocked';
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
  };
  paymentTerms: string;
  currentBalance: number; // Outstanding payables
  status: 'active' | 'blocked';
  createdAt: string;
}

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'invoiced'
  | 'cancelled';

export interface SalesOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  qty: number;
  rate: number;
  mrp?: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  hsnCode: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerType?: CustomerType;
  date: string;
  expectedDeliveryDate: string;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  notes?: string;
  appliedPromotionId?: string;
  appliedPromotionCode?: string;
  isInterstate: boolean;
  creditWarning?: boolean;
  createdBy: string;
  createdAt: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void';

export interface InvoiceItem extends SalesOrderItem {}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  customerAddress: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  isInterstate: boolean;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch?: string;
  };
  notes?: string;
  terms?: string;
  eWayBillNo?: string;
  createdAt: string;
}

export type PaymentType = 'receipt' | 'payment';
export type PaymentMode = 'upi' | 'neft' | 'cheque' | 'cash';
export type PaymentStatus = 'cleared' | 'pending' | 'reversed';

export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotal: number;
  allocatedAmount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  type: PaymentType; // receipt (from customer) or payment (to supplier)
  partyId: string;
  partyName: string;
  partyType: 'customer' | 'supplier';
  amount: number;
  date: string;
  mode: PaymentMode;
  referenceNo: string;
  bankAccount?: string;
  status: PaymentStatus;
  notes?: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'approved'
  | 'sent'
  | 'received'
  | 'billed'
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  qty: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  poId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: PurchaseOrderItem[];
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
}

export interface StockLevel {
  productId: string;
  sku: string;
  productName: string;
  category: string;
  warehouse: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  unit: string;
  valuation: number;
  avgCost: number;
  status: 'optimal' | 'low_stock' | 'out_of_stock';
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  sku: string;
  productName: string;
  type: 'inward_po' | 'outward_sales' | 'adjustment_loss' | 'adjustment_gain' | 'transfer';
  qty: number;
  referenceDoc: string;
  sourceLocation?: string;
  destinationLocation?: string;
  doneBy: string;
  notes?: string;
}

export interface BatchItem {
  id: string;
  batchNumber: string;
  productId: string;
  sku: string;
  productName: string;
  mfgDate: string;
  expiryDate: string;
  qty: number;
  status: 'good' | 'near_expiry' | 'expired';
  daysToExpiry: number;
  warehouse: string;
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  type: 'discount_percent' | 'buy_x_get_y' | 'slab_volume';
  value: number; // e.g. 10 for 10%
  buyQty?: number;
  getQty?: number;
  minOrderAmount?: number;
  budget: number;
  actualSpend: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'expired';
  applicableCategories: string[];
  applicableCustomerTypes: CustomerType[];
}

export interface PriceList {
  id: string;
  name: string;
  customerType: CustomerType;
  region: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'inactive';
  itemsCount: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  subcategory: string;
  balance: number;
  currency: string;
  isCredit: boolean;
  parentId?: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  narration: string;
  status: 'posted' | 'draft';
  lines: JournalEntryLine[];
  total: number;
  createdAt: string;
}

export interface GeneralLedgerItem {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  refNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  isActive: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'overdue' | 'low_stock' | 'approval' | 'auth' | 'info';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface CompanySettings {
  companyName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  pincode: string;
  logoUrl?: string;
  invoicePrefix: string;
  poPrefix: string;
  paymentPrefix: string;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
  currency: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
  };
  n8nWebhookUrl: string;
  notificationPreferences: {
    emailNotifications: boolean;
    whatsappNotifications: boolean;
    lowStockAlerts: boolean;
    overdueAlerts: boolean;
  };
}
