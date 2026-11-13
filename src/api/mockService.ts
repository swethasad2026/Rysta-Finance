import {
  INITIAL_USERS,
  INITIAL_LOGIN_LOGS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES_ORDERS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_BILLS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_BATCHES,
  INITIAL_PROMOTIONS,
  INITIAL_PRICE_LISTS,
  INITIAL_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_TAX_RATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMPANY_SETTINGS,
} from './mockData';
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
  StockMovement,
  BatchItem,
  Promotion,
  PriceList,
  Account,
  JournalEntry,
  TaxRate,
  AppNotification,
  CompanySettings,
  SalesOrderStatus,
  InvoiceStatus,
  PurchaseOrderStatus,
} from '@/types';

// Helper to simulate network latency
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for local storage persistence of mock state
function getStored<T>(key: string, initial: T): T {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(`rysta_mock_${key}`);
      if (
        raw &&
        (raw.includes('Aashirvaad') ||
          raw.includes('Fortune') ||
          raw.includes('Parle') ||
          raw.includes('Reliance Retail') ||
          raw.includes('Krishna Kirana') ||
          raw.includes('INV-2024-0101') ||
          raw.includes('INV-2229') ||
          raw.includes('27AAACR7148F1ZX'))
      ) {
        localStorage.removeItem(`rysta_mock_${key}`);
        return initial;
      }
      return raw ? JSON.parse(raw) : initial;
    }
    return initial;
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`rysta_mock_${key}`, JSON.stringify(val));
  } catch {}
}

class MockService {
  private users: User[] = getStored('users', INITIAL_USERS);
  private loginLogs: LoginLog[] = getStored('loginLogs', INITIAL_LOGIN_LOGS);
  private products: Product[] = getStored('products', INITIAL_PRODUCTS);
  private customers: Customer[] = getStored('customers', INITIAL_CUSTOMERS);
  private suppliers: Supplier[] = getStored('suppliers', INITIAL_SUPPLIERS);
  private salesOrders: SalesOrder[] = getStored('salesOrders', INITIAL_SALES_ORDERS);
  private invoices: Invoice[] = getStored('invoices', INITIAL_INVOICES);
  private payments: Payment[] = getStored('payments', INITIAL_PAYMENTS);
  private purchaseOrders: PurchaseOrder[] = getStored('purchaseOrders', INITIAL_PURCHASE_ORDERS);
  private bills: Bill[] = getStored('bills', INITIAL_BILLS);
  private stockMovements: StockMovement[] = getStored('movements', INITIAL_STOCK_MOVEMENTS);
  private batches: BatchItem[] = getStored('batches', INITIAL_BATCHES);
  private promotions: Promotion[] = getStored('promotions', INITIAL_PROMOTIONS);
  private priceLists: PriceList[] = getStored('priceLists', INITIAL_PRICE_LISTS);
  private accounts: Account[] = getStored('accounts', INITIAL_ACCOUNTS);
  private journalEntries: JournalEntry[] = getStored('journalEntries', INITIAL_JOURNAL_ENTRIES);
  private taxRates: TaxRate[] = getStored('taxRates', INITIAL_TAX_RATES);
  private notifications: AppNotification[] = getStored('notifications', INITIAL_NOTIFICATIONS);
  private companySettings: CompanySettings = getStored('settings', INITIAL_COMPANY_SETTINGS);

  private save(key: string, data: any) {
    setStored(key, data);
  }

  // --- AUTH ---
  async login(email: string, password: string): Promise<{ token: string; user: User; authenticated: boolean }> {
    await delay(300);
    const trimmedEmail = email.toLowerCase().trim();
    
    // Find matching user or allow demo credentials
    let user = this.users.find((u) => u.email.toLowerCase() === trimmedEmail);

    // If credentials are valid (for demo password "admin123", "acc123", "sales123" or matching email prefix)
    const isValid = user && (
      password === 'admin123' ||
      password === 'acc123' ||
      password === 'sales123' ||
      password === 'password123' ||
      password.length >= 6
    );

    const logEntry: LoginLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: trimmedEmail,
      success: !!isValid,
      ip: '103.21.125.42',
      userAgent: navigator.userAgent,
      reason: isValid ? undefined : 'Invalid credentials',
    };
    this.loginLogs.unshift(logEntry);
    this.save('loginLogs', this.loginLogs);

    if (!isValid || !user) {
      throw { status: 401, message: 'Invalid email or password. Try admin@rystafmcg.com / admin123' };
    }

    // Mock JWT token (base64 encoded JSON)
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 8 * 3600,
    };
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(tokenPayload))}.mockSignature_8hrs`;

    user.lastLogin = new Date().toISOString();
    this.save('users', this.users);

    return { token, user, authenticated: true };
  }

  async register(name: string, email: string, password: string): Promise<{ message: string; user: User }> {
    await delay(350);
    const trimmedEmail = email.toLowerCase().trim();
    
    if (!name || !email || !password) {
      throw { status: 400, message: 'Missing required registration fields' };
    }

    if (this.users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw { status: 409, message: 'A user with this email address already exists' };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email: trimmedEmail,
      role: 'accountant', // default role for registered user
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.save('users', this.users);

    return { message: 'User account created successfully', user: newUser };
  }

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    await delay();
    return [...this.products];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    await delay();
    return this.products.find((p) => p.id === id);
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    await delay();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(newProduct);
    this.save('products', this.products);
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    await delay();
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');
    this.products[index] = { ...this.products[index], ...data };
    this.save('products', this.products);
    return this.products[index];
  }

  async deleteProduct(id: string): Promise<void> {
    await delay();
    this.products = this.products.filter((p) => p.id !== id);
    this.save('products', this.products);
  }

  async duplicateProduct(id: string): Promise<Product> {
    await delay();
    const original = this.products.find((p) => p.id === id);
    if (!original) throw new Error('Product not found');
    const newProduct: Product = {
      ...original,
      id: `prod-${Date.now()}`,
      sku: `${original.sku}-COPY`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(newProduct);
    this.save('products', this.products);
    return newProduct;
  }

  // --- CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    await delay();
    return [...this.customers];
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    await delay();
    return this.customers.find((c) => c.id === id);
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    await delay();
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    this.save('customers', this.customers);
    return newCustomer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    await delay();
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    this.customers[index] = { ...this.customers[index], ...data };
    this.save('customers', this.customers);
    return this.customers[index];
  }

  async deleteCustomer(id: string): Promise<void> {
    await delay();
    this.customers = this.customers.filter((c) => c.id !== id);
    this.save('customers', this.customers);
  }

  async toggleCustomerBlock(id: string): Promise<Customer> {
    await delay();
    const cust = this.customers.find((c) => c.id === id);
    if (!cust) throw new Error('Customer not found');
    cust.status = cust.status === 'active' ? 'blocked' : 'active';
    this.save('customers', this.customers);
    return { ...cust };
  }

  // --- SUPPLIERS ---
  async getSuppliers(): Promise<Supplier[]> {
    await delay();
    return [...this.suppliers];
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    await delay();
    return this.suppliers.find((s) => s.id === id);
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
    await delay();
    const newSupplier: Supplier = {
      ...data,
      id: `supp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.suppliers.unshift(newSupplier);
    this.save('suppliers', this.suppliers);
    return newSupplier;
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    await delay();
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Supplier not found');
    this.suppliers[index] = { ...this.suppliers[index], ...data };
    this.save('suppliers', this.suppliers);
    return this.suppliers[index];
  }

  async deleteSupplier(id: string): Promise<void> {
    await delay();
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.save('suppliers', this.suppliers);
  }

  // --- SALES ORDERS ---
  async getSalesOrders(): Promise<SalesOrder[]> {
    await delay();
    return [...this.salesOrders];
  }

  async getSalesOrderById(id: string): Promise<SalesOrder | undefined> {
    await delay();
    return this.salesOrders.find((so) => so.id === id);
  }

  async createSalesOrder(data: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt'>): Promise<SalesOrder> {
    await delay();
    const orderNum = `SO-2024-${String(this.salesOrders.length + 1).padStart(3, '0')}`;
    const newOrder: SalesOrder = {
      ...data,
      id: `so-${Date.now()}`,
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
    };
    this.salesOrders.unshift(newOrder);
    this.save('salesOrders', this.salesOrders);
    return newOrder;
  }

  async updateSalesOrderStatus(id: string, status: SalesOrderStatus): Promise<SalesOrder> {
    await delay();
    const order = this.salesOrders.find((so) => so.id === id);
    if (!order) throw new Error('Sales order not found');
    order.status = status;
    this.save('salesOrders', this.salesOrders);
    return { ...order };
  }

  async convertOrderToInvoice(orderId: string): Promise<Invoice> {
    await delay();
    const order = this.salesOrders.find((so) => so.id === orderId);
    if (!order) throw new Error('Sales order not found');

    const customer = this.customers.find((c) => c.id === order.customerId);
    const invoiceNumber = `INV-2024-${String(this.invoices.length + 102).padStart(4, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (customer?.creditPeriodDays || 30));

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerGstin: customer?.gstin || '27AAACR7148F1ZX',
      customerAddress: `${customer?.address || ''}, ${customer?.city || ''}, ${customer?.state || ''} - ${customer?.pincode || ''}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'sent',
      items: order.items,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxableTotal: order.taxableTotal,
      cgstTotal: order.cgstTotal,
      sgstTotal: order.sgstTotal,
      igstTotal: order.igstTotal,
      grandTotal: order.grandTotal,
      amountPaid: 0,
      balanceDue: order.grandTotal,
      isInterstate: order.isInterstate,
      bankDetails: this.companySettings.bankDetails,
      notes: order.notes,
      terms: customer?.paymentTerms || 'Payment due as per agreed terms.',
      createdAt: new Date().toISOString(),
    };

    order.status = 'invoiced';
    this.invoices.unshift(newInvoice);

    // Update customer outstanding balance
    if (customer) {
      customer.currentBalance += newInvoice.grandTotal;
      this.save('customers', this.customers);
    }

    this.save('salesOrders', this.salesOrders);
    this.save('invoices', this.invoices);
    return newInvoice;
  }

  // --- INVOICES ---
  async getInvoices(): Promise<Invoice[]> {
    await delay();
    return [...this.invoices];
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    await delay();
    return this.invoices.find((inv) => inv.id === id);
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Invoice> {
    await delay();
    const invNum = `INV-2024-${String(this.invoices.length + 105).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      createdAt: new Date().toISOString(),
    };
    this.invoices.unshift(newInvoice);

    // Update customer outstanding
    const customer = this.customers.find((c) => c.id === data.customerId);
    if (customer) {
      customer.currentBalance += data.balanceDue;
      this.save('customers', this.customers);
    }

    this.save('invoices', this.invoices);
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    await delay();
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = status;
    this.save('invoices', this.invoices);
    return { ...inv };
  }

  async voidInvoice(id: string): Promise<Invoice> {
    await delay();
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = 'void';

    // Reverse customer balance for outstanding amount
    const customer = this.customers.find((c) => c.id === inv.customerId);
    if (customer) {
      customer.currentBalance = Math.max(0, customer.currentBalance - inv.balanceDue);
      this.save('customers', this.customers);
    }

    this.save('invoices', this.invoices);
    return { ...inv };
  }

  // --- PAYMENTS ---
  async getPayments(): Promise<Payment[]> {
    await delay();
    return [...this.payments];
  }

  async createPayment(data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>): Promise<Payment> {
    await delay();
    const prefix = data.type === 'receipt' ? 'REC-2024-' : 'PAY-2024-';
    const payNum = `${prefix}${String(this.payments.length + 50).padStart(4, '0')}`;

    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      paymentNumber: payNum,
      createdAt: new Date().toISOString(),
    };

    // If receipt from customer, update invoices & customer balance
    if (data.type === 'receipt') {
      const customer = this.customers.find((c) => c.id === data.partyId);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - data.amount);
        this.save('customers', this.customers);
      }

      data.allocations.forEach((alloc) => {
        const inv = this.invoices.find((i) => i.id === alloc.invoiceId);
        if (inv) {
          inv.amountPaid += alloc.allocatedAmount;
          inv.balanceDue = Math.max(0, inv.grandTotal - inv.amountPaid);
          inv.status = inv.balanceDue === 0 ? 'paid' : 'partially_paid';
        }
      });
      this.save('invoices', this.invoices);
    } else {
      // Payment to supplier
      const supplier = this.suppliers.find((s) => s.id === data.partyId);
      if (supplier) {
        supplier.currentBalance = Math.max(0, supplier.currentBalance - data.amount);
        this.save('suppliers', this.suppliers);
      }
    }

    this.payments.unshift(newPayment);
    this.save('payments', this.payments);
    return newPayment;
  }

  // --- PURCHASE ORDERS & BILLS ---
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    await delay();
    return [...this.purchaseOrders];
  }

  async createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): Promise<PurchaseOrder> {
    await delay();
    const poNum = `PO-2024-${String(this.purchaseOrders.length + 20).padStart(4, '0')}`;
    const newPO: PurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      poNumber: poNum,
      createdAt: new Date().toISOString(),
    };
    this.purchaseOrders.unshift(newPO);
    this.save('purchaseOrders', this.purchaseOrders);
    return newPO;
  }

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    await delay();
    const po = this.purchaseOrders.find((p) => p.id === id);
    if (!po) throw new Error('Purchase order not found');
    po.status = status;
    this.save('purchaseOrders', this.purchaseOrders);
    return { ...po };
  }

  async convertPOToBill(poId: string): Promise<Bill> {
    await delay();
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase order not found');

    const billNumber = `BILL-${po.supplierName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber,
      poId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending',
      items: po.items,
      grandTotal: po.grandTotal,
      amountPaid: 0,
      balanceDue: po.grandTotal,
      createdAt: new Date().toISOString(),
    };

    po.status = 'billed';
    this.bills.unshift(newBill);

    // Update supplier payables balance
    const supplier = this.suppliers.find((s) => s.id === po.supplierId);
    if (supplier) {
      supplier.currentBalance += newBill.grandTotal;
      this.save('suppliers', this.suppliers);
    }

    this.save('purchaseOrders', this.purchaseOrders);
    this.save('bills', this.bills);
    return newBill;
  }

  async getBills(): Promise<Bill[]> {
    await delay();
    return [...this.bills];
  }

  // --- INVENTORY ---
  async getStockMovements(): Promise<StockMovement[]> {
    await delay();
    return [...this.stockMovements];
  }

  async getBatches(): Promise<BatchItem[]> {
    await delay();
    return [...this.batches];
  }

  async recordStockAdjustment(data: {
    productId: string;
    qtyDelta: number;
    reason: string;
    warehouse: string;
    doneBy: string;
  }): Promise<StockMovement> {
    await delay();
    const product = this.products.find((p) => p.id === data.productId);
    if (!product) throw new Error('Product not found');

    product.stock = Math.max(0, product.stock + data.qtyDelta);
    this.save('products', this.products);

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      date: new Date().toISOString(),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      type: data.qtyDelta >= 0 ? 'adjustment_gain' : 'adjustment_loss',
      qty: data.qtyDelta,
      referenceDoc: `ADJ-${Date.now().toString().slice(-4)}`,
      sourceLocation: data.warehouse,
      doneBy: data.doneBy,
      notes: data.reason,
    };

    this.stockMovements.unshift(movement);
    this.save('movements', this.stockMovements);
    return movement;
  }

  // --- PROMOTIONS & PRICE LISTS ---
  async getPromotions(): Promise<Promotion[]> {
    await delay();
    return [...this.promotions];
  }

  async createPromotion(data: Omit<Promotion, 'id'>): Promise<Promotion> {
    await delay();
    const newPromo: Promotion = { ...data, id: `promo-${Date.now()}` };
    this.promotions.unshift(newPromo);
    this.save('promotions', this.promotions);
    return newPromo;
  }

  async updatePromotionStatus(id: string, status: 'active' | 'paused' | 'expired'): Promise<Promotion> {
    await delay();
    const promo = this.promotions.find((p) => p.id === id);
    if (!promo) throw new Error('Promotion not found');
    promo.status = status;
    this.save('promotions', this.promotions);
    return { ...promo };
  }

  async getPriceLists(): Promise<PriceList[]> {
    await delay();
    return [...this.priceLists];
  }

  async createPriceList(data: Omit<PriceList, 'id'>): Promise<PriceList> {
    await delay();
    const newPL: PriceList = { ...data, id: `pl-${Date.now()}` };
    this.priceLists.unshift(newPL);
    this.save('priceLists', this.priceLists);
    return newPL;
  }

  // --- ACCOUNTING ---
  async getAccounts(): Promise<Account[]> {
    await delay();
    return [...this.accounts];
  }

  async createAccount(data: Omit<Account, 'id'>): Promise<Account> {
    await delay();
    const newAcc: Account = { ...data, id: `acc-${Date.now()}` };
    this.accounts.push(newAcc);
    this.save('accounts', this.accounts);
    return newAcc;
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    await delay();
    return [...this.journalEntries];
  }

  async createJournalEntry(data: Omit<JournalEntry, 'id' | 'entryNumber' | 'createdAt'>): Promise<JournalEntry> {
    await delay();
    const entryNum = `JE-2024-${String(this.journalEntries.length + 35).padStart(4, '0')}`;
    const newJE: JournalEntry = {
      ...data,
      id: `je-${Date.now()}`,
      entryNumber: entryNum,
      createdAt: new Date().toISOString(),
    };
    this.journalEntries.unshift(newJE);
    this.save('journalEntries', this.journalEntries);
    return newJE;
  }

  // --- TAXES ---
  async getTaxRates(): Promise<TaxRate[]> {
    await delay();
    return [...this.taxRates];
  }

  async createTaxRate(data: Omit<TaxRate, 'id'>): Promise<TaxRate> {
    await delay();
    const newTR: TaxRate = { ...data, id: `tr-${Date.now()}` };
    this.taxRates.push(newTR);
    this.save('taxRates', this.taxRates);
    return newTR;
  }

  // --- USERS & ADMIN ---
  async getUsers(): Promise<User[]> {
    await delay();
    return [...this.users];
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await delay();
    const newUser: User = {
      ...data,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.save('users', this.users);
    return newUser;
  }

  async updateUserRole(id: string, role: User['role'], status: User['status']): Promise<User> {
    await delay();
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.role = role;
    user.status = status;
    this.save('users', this.users);
    return { ...user };
  }

  async getLoginLogs(): Promise<LoginLog[]> {
    await delay();
    return [...this.loginLogs];
  }

  // --- SETTINGS ---
  async getCompanySettings(): Promise<CompanySettings> {
    await delay();
    return { ...this.companySettings };
  }

  async updateCompanySettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    await delay();
    this.companySettings = { ...this.companySettings, ...data };
    this.save('settings', this.companySettings);
    return { ...this.companySettings };
  }

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<AppNotification[]> {
    await delay();
    return [...this.notifications];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await delay(50);
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save('notifications', this.notifications);
    }
  }

  async markAllNotificationsRead(): Promise<void> {
    await delay(50);
    this.notifications.forEach((n) => (n.read = true));
    this.save('notifications', this.notifications);
  }

  async clearAllNotifications(): Promise<void> {
    await delay(50);
    this.notifications = [];
    this.save('notifications', this.notifications);
  }
}

export const mockService = new MockService();
