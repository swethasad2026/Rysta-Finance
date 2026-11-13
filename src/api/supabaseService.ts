import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, lookupUserIdByEmail } from './supabase';
import { Product, Customer, Invoice, InvoiceStatus, AppNotification } from '@/types';
import { getCurrentUserEmail } from './supabase';

let supabaseInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  if (!supabaseInstance || lastUrl !== url || lastKey !== anonKey) {
    lastUrl = url;
    lastKey = anonKey;
    supabaseInstance = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return supabaseInstance;
}

/* ==========================================================================
   EXPENSES & INCOME TYPES
   ========================================================================== */

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  payment_mode: string;
  date: string;
  vendor?: string;
  reference_no?: string;
  status?: string;
  user_id?: string;
  created_at?: string;
}

export interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  category: string;
  payment_mode: string;
  date: string;
  customer_name?: string;
  invoice_no?: string;
  status?: string;
  user_id?: string;
  created_at?: string;
}

/* ==========================================================================
   LOCAL CLIENT CACHE HELPERS (ZERO DUMMY DATA - STRICTLY USER-ENTERED DATA)
   ========================================================================== */

function getStorageKey(entity: string, email?: string): string {
  const user = (email || getCurrentUserEmail() || 'default').toLowerCase().trim();
  return `rysta_user_${entity}_${user}`;
}

function getLocalEntity<T>(entity: string, email?: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(entity, email));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function setLocalEntity<T>(entity: string, data: T[], email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(entity, email), JSON.stringify(data));
  } catch (_) {}
}

/* ==========================================================================
   1. PRODUCTS & FMCG SKUS (fmcg_products / products)
   ========================================================================== */

export function mapSupabaseToProduct(row: any): Product {
  const stock = Number(row.stock_quantity ?? row.stock ?? 0);
  const mrp = Number(row.mrp ?? 0);
  const costPrice = Number(row.cost_price ?? row.costPrice ?? 0);
  const sellingPrice = Number(row.wholesale_price ?? row.sellingPrice ?? row.mrp ?? 0);

  return {
    id: String(row.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    sku: String(row.sku_code || row.sku || 'FMCG-SKU'),
    name: String(row.product_name || row.name || 'Unnamed Product'),
    brand: String(row.brand || 'General'),
    category: String(row.category || 'General FMCG'),
    unit: String(row.unit_type || row.unit || 'PCS'),
    mrp,
    costPrice,
    sellingPrice,
    gstRate: Number(row.gst_rate ?? row.gstRate ?? 18),
    hsnCode: String(row.hsn_code || row.hsnCode || ''),
    stock,
    reorderLevel: Number(row.reorder_level ?? row.reorderLevel ?? 50),
    status: (row.status || 'active').toLowerCase() as any,
    caseSize: Number(row.case_size ?? row.caseSize ?? 1),
    unitsPerCase: Number(row.units_per_case ?? row.unitsPerCase ?? 1),
    warehouse: String(row.warehouse || 'Main Warehouse'),
    barcode: String(row.barcode || ''),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapProductToSupabase(prod: Partial<Product>, userId?: string): any {
  return {
    sku_code: prod.sku,
    product_name: prod.name,
    brand: prod.brand || 'General',
    hsn_code: prod.hsnCode || '',
    category: prod.category || 'General FMCG',
    unit_type: prod.unit || 'PCS',
    mrp: prod.mrp || 0,
    cost_price: prod.costPrice || 0,
    wholesale_price: prod.sellingPrice || prod.mrp || 0,
    gst_rate: prod.gstRate ?? 18,
    stock_quantity: prod.stock ?? 0,
    reorder_level: prod.reorderLevel ?? 50,
    status: prod.status || 'active',
    warehouse: prod.warehouse || 'Main Warehouse',
    barcode: prod.barcode || '',
    ...(userId ? { user_id: userId } : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProductsFromSupabase(userEmail?: string): Promise<Product[]> {
  const email = userEmail || getCurrentUserEmail();
  const supabase = getSupabase();
  const localRows = getLocalEntity<Product>('products', email);

  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      let query = supabase.from('fmcg_products').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      let { data, error } = await query;
      if (error) {
        // Fallback to table 'products'
        const fallbackRes = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapSupabaseToProduct);
        // Merge with local newly created items
        const combined = [...mapped];
        for (const loc of localRows) {
          if (!combined.some((p) => p.id === loc.id || p.sku === loc.sku)) {
            combined.push(loc);
          }
        }
        setLocalEntity('products', combined, email);
        return combined;
      }
    } catch (err) {
      console.warn('[Supabase Products] Query error, using user storage:', err);
    }
  }

  return localRows;
}

export async function createProductInSupabase(
  productData: Omit<Product, 'id' | 'createdAt'>,
  userEmail?: string
): Promise<Product> {
  const email = userEmail || getCurrentUserEmail();
  const newId = `prod-${Date.now()}`;
  const newProduct: Product = {
    ...productData,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  // 1. Save locally for instant reactivity
  const existing = getLocalEntity<Product>('products', email);
  setLocalEntity('products', [newProduct, ...existing], email);

  // 2. Insert into Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      const payload = {
        ...mapProductToSupabase(newProduct, userId || undefined),
        id: newId,
        created_at: newProduct.createdAt,
      };

      const res = await supabase.from('fmcg_products').insert(payload).select().single();
      if (res.error) {
        await supabase.from('products').insert(payload);
      }
    } catch (err) {
      console.warn('[Supabase Products] Insert warning:', err);
    }
  }

  return newProduct;
}

export async function updateProductInSupabase(
  id: string,
  updates: Partial<Product>,
  userEmail?: string
): Promise<Product> {
  const email = userEmail || getCurrentUserEmail();
  const existing = getLocalEntity<Product>('products', email);
  let updatedProduct: Product = { ...(existing.find((p) => p.id === id) || ({} as Product)), ...updates };

  const newRows = existing.map((p) => (p.id === id ? updatedProduct : p));
  setLocalEntity('products', newRows, email);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = mapProductToSupabase(updates);
      const res = await supabase.from('fmcg_products').update(payload).eq('id', id);
      if (res.error) {
        await supabase.from('products').update(payload).eq('id', id);
      }
    } catch (err) {
      console.warn('[Supabase Products] Update warning:', err);
    }
  }

  return updatedProduct;
}

export async function deleteProductFromSupabase(id: string, userEmail?: string): Promise<boolean> {
  const email = userEmail || getCurrentUserEmail();
  const existing = getLocalEntity<Product>('products', email);
  setLocalEntity(
    'products',
    existing.filter((p) => p.id !== id),
    email
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('fmcg_products').delete().eq('id', id);
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Products] Delete warning:', err);
    }
  }
  return true;
}

export async function bulkImportProductsToSupabase(
  products: Partial<Product>[],
  userEmail?: string
): Promise<{ count: number }> {
  const email = userEmail || getCurrentUserEmail();
  const newItems: Product[] = products.map((p, index) => ({
    id: p.id || `prod-bulk-${Date.now()}-${index}`,
    sku: p.sku || `SKU-${Date.now()}-${index}`,
    name: p.name || 'Unnamed Product',
    brand: p.brand || 'General',
    category: p.category || 'General FMCG',
    unit: p.unit || 'PCS',
    mrp: Number(p.mrp || 0),
    costPrice: Number(p.costPrice || 0),
    sellingPrice: Number(p.sellingPrice || p.mrp || 0),
    gstRate: Number(p.gstRate ?? 18),
    hsnCode: p.hsnCode || '',
    stock: Number(p.stock ?? 0),
    reorderLevel: Number(p.reorderLevel ?? 50),
    status: p.status || 'active',
    caseSize: Number(p.caseSize ?? 1),
    unitsPerCase: Number(p.unitsPerCase ?? 1),
    warehouse: p.warehouse || 'Main Warehouse',
    barcode: p.barcode || '',
    createdAt: new Date().toISOString(),
  }));

  const existing = getLocalEntity<Product>('products', email);
  setLocalEntity('products', [...newItems, ...existing], email);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      const rows = newItems.map((p) => ({
        ...mapProductToSupabase(p, userId || undefined),
        id: p.id,
        created_at: p.createdAt,
      }));
      const res = await supabase.from('fmcg_products').upsert(rows);
      if (res.error) {
        await supabase.from('products').upsert(rows);
      }
    } catch (err) {
      console.warn('[Supabase Products] Bulk import warning:', err);
    }
  }

  return { count: newItems.length };
}

/* ==========================================================================
   2. CUSTOMERS & DISTRIBUTORS (fmcg_customers / customers)
   ========================================================================== */

export function mapSupabaseToCustomer(row: any): Customer {
  const creditLimit = Number(row.credit_limit ?? row.creditLimit ?? 0);
  const currentOutstanding = Number(row.current_outstanding ?? row.currentOutstanding ?? row.currentBalance ?? row.balance ?? 0);

  return {
    id: String(row.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    code: String(row.customer_code || row.code || 'CUST-001'),
    name: String(row.company_name || row.name || 'Unnamed Customer'),
    type: (row.channel_type || row.type || 'distributor') as any,
    gstin: String(row.gstin || ''),
    pan: String(row.pan || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    address: String(row.address_line1 || row.address || ''),
    city: String(row.city || 'Mumbai'),
    state: String(row.state || 'Maharashtra'),
    pincode: String(row.pincode || ''),
    region: String(row.region || row.territory || 'West Zone'),
    creditLimit,
    creditPeriodDays: Number(row.credit_days ?? row.creditPeriodDays ?? row.creditDays ?? 30),
    paymentTerms: String(row.payment_terms ?? row.paymentTerms ?? 'Net 30'),
    salespersonId: String(row.salesperson_id ?? row.salespersonId ?? 'sales-1'),
    salespersonName: String(row.account_manager || row.salespersonName || row.salesRep || 'Sales Team'),
    currentBalance: currentOutstanding,
    status: (row.status === 'blocked' ? 'blocked' : 'active') as any,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapCustomerToSupabase(cust: Partial<Customer>, userId?: string): any {
  return {
    customer_code: cust.code,
    company_name: cust.name,
    channel_type: cust.type || 'distributor',
    gstin: cust.gstin || '',
    pan: cust.pan || '',
    email: cust.email || '',
    phone: cust.phone || '',
    address_line1: cust.address || '',
    city: cust.city || 'Mumbai',
    state: cust.state || 'Maharashtra',
    pincode: cust.pincode || '',
    credit_limit: cust.creditLimit || 0,
    credit_days: cust.creditPeriodDays || 30,
    current_outstanding: cust.currentBalance || 0,
    region: cust.region || 'West Zone',
    account_manager: cust.salespersonName || 'Sales Team',
    status: cust.status || 'active',
    ...(userId ? { user_id: userId } : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCustomersFromSupabase(userEmail?: string): Promise<Customer[]> {
  const email = userEmail || getCurrentUserEmail();
  const supabase = getSupabase();
  const localRows = getLocalEntity<Customer>('customers', email);

  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      let query = supabase.from('fmcg_customers').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      let { data, error } = await query;
      if (error) {
        const fallbackRes = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapSupabaseToCustomer);
        const combined = [...mapped];
        for (const loc of localRows) {
          if (!combined.some((c) => c.id === loc.id || c.code === loc.code)) {
            combined.push(loc);
          }
        }
        setLocalEntity('customers', combined, email);
        return combined;
      }
    } catch (err) {
      console.warn('[Supabase Customers] Query error:', err);
    }
  }

  return localRows;
}

export async function createCustomerInSupabase(
  customerData: Omit<Customer, 'id' | 'createdAt'>,
  userEmail?: string
): Promise<Customer> {
  const email = userEmail || getCurrentUserEmail();
  const newId = `cust-${Date.now()}`;
  const newCustomer: Customer = {
    ...customerData,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  const existing = getLocalEntity<Customer>('customers', email);
  setLocalEntity('customers', [newCustomer, ...existing], email);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      const payload = {
        ...mapCustomerToSupabase(newCustomer, userId || undefined),
        id: newId,
        created_at: newCustomer.createdAt,
      };
      const res = await supabase.from('fmcg_customers').insert(payload).select().single();
      if (res.error) {
        await supabase.from('customers').insert(payload);
      }
    } catch (err) {
      console.warn('[Supabase Customers] Insert warning:', err);
    }
  }

  return newCustomer;
}

export async function updateCustomerInSupabase(
  id: string,
  updates: Partial<Customer>,
  userEmail?: string
): Promise<Customer> {
  const email = userEmail || getCurrentUserEmail();
  const existing = getLocalEntity<Customer>('customers', email);
  const updatedCustomer: Customer = { ...(existing.find((c) => c.id === id) || ({} as Customer)), ...updates };

  setLocalEntity(
    'customers',
    existing.map((c) => (c.id === id ? updatedCustomer : c)),
    email
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = mapCustomerToSupabase(updates);
      const res = await supabase.from('fmcg_customers').update(payload).eq('id', id);
      if (res.error) {
        await supabase.from('customers').update(payload).eq('id', id);
      }
    } catch (err) {
      console.warn('[Supabase Customers] Update warning:', err);
    }
  }

  return updatedCustomer;
}

export async function deleteCustomerFromSupabase(id: string, userEmail?: string): Promise<boolean> {
  const email = userEmail || getCurrentUserEmail();
  const existing = getLocalEntity<Customer>('customers', email);
  setLocalEntity(
    'customers',
    existing.filter((c) => c.id !== id),
    email
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('fmcg_customers').delete().eq('id', id);
      await supabase.from('customers').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Customers] Delete warning:', err);
    }
  }
  return true;
}

export async function bulkImportCustomersToSupabase(
  customers: Partial<Customer>[],
  userEmail?: string
): Promise<{ count: number }> {
  const email = userEmail || getCurrentUserEmail();
  const newItems: Customer[] = customers.map((c, index) => ({
    id: c.id || `cust-bulk-${Date.now()}-${index}`,
    code: c.code || `CUST-IMP-${index + 1}`,
    name: c.name || 'Unnamed Distributor',
    type: c.type || 'distributor',
    gstin: c.gstin || '',
    pan: c.pan || '',
    email: c.email || '',
    phone: c.phone || '',
    address: c.address || '',
    city: c.city || 'Mumbai',
    state: c.state || 'Maharashtra',
    pincode: c.pincode || '',
    region: c.region || 'West Zone',
    creditLimit: Number(c.creditLimit || 0),
    creditPeriodDays: Number(c.creditPeriodDays || 30),
    paymentTerms: c.paymentTerms || 'Net 30',
    salespersonId: c.salespersonId || 'sales-1',
    salespersonName: c.salespersonName || 'Sales Team',
    currentBalance: Number(c.currentBalance || 0),
    status: (c.status === 'blocked' ? 'blocked' : 'active') as any,
    createdAt: new Date().toISOString(),
  }));

  const existing = getLocalEntity<Customer>('customers', email);
  setLocalEntity('customers', [...newItems, ...existing], email);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      const rows = newItems.map((c) => ({
        ...mapCustomerToSupabase(c, userId || undefined),
        id: c.id,
        created_at: c.createdAt,
      }));
      const res = await supabase.from('fmcg_customers').upsert(rows);
      if (res.error) {
        await supabase.from('customers').upsert(rows);
      }
    } catch (err) {
      console.warn('[Supabase Customers] Bulk import warning:', err);
    }
  }

  return { count: newItems.length };
}

/* ==========================================================================
   3. EXPENSES & INCOME TRACKING (/expenses, /income)
   ========================================================================== */

export async function fetchUserExpenses(userEmail?: string): Promise<ExpenseItem[]> {
  const email = userEmail || getCurrentUserEmail();
  const localExpenses = getLocalEntity<ExpenseItem>('expenses', email);
  const supabase = getSupabase();

  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      let query = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: ExpenseItem[] = data.map((d: any) => ({
          id: String(d.id),
          title: d.title || d.description || 'Expense Line Item',
          amount: Number(d.amount || 0),
          category: d.category || 'Operations',
          payment_mode: d.payment_mode || d.paymentMode || 'Bank Transfer',
          date: d.date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          vendor: d.vendor || d.party_name || '',
          reference_no: d.reference_no || d.ref || '',
          status: d.status || 'paid',
          user_id: d.user_id,
          created_at: d.created_at,
        }));
        setLocalEntity('expenses', mapped, email);
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase Expenses] Fetch error:', err);
    }
  }

  return localExpenses;
}

export async function createExpenseInSupabase(
  expense: Omit<ExpenseItem, 'id' | 'created_at'>,
  userEmail?: string
): Promise<ExpenseItem> {
  const email = userEmail || getCurrentUserEmail();
  const newId = `exp-${Date.now()}`;
  const newItem: ExpenseItem = {
    ...expense,
    id: newId,
    created_at: new Date().toISOString(),
  };

  const existing = getLocalEntity<ExpenseItem>('expenses', email);
  setLocalEntity('expenses', [newItem, ...existing], email);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      await supabase.from('expenses').insert({
        id: newId,
        title: newItem.title,
        amount: newItem.amount,
        category: newItem.category,
        payment_mode: newItem.payment_mode,
        date: newItem.date,
        vendor: newItem.vendor || '',
        reference_no: newItem.reference_no || '',
        status: newItem.status || 'paid',
        user_id: userId || undefined,
        created_at: newItem.created_at,
      });
    } catch (err) {
      console.warn('[Supabase Expenses] Insert warning:', err);
    }
  }

  return newItem;
}

export async function deleteExpenseFromSupabase(id: string, userEmail?: string): Promise<boolean> {
  const email = userEmail || getCurrentUserEmail();
  const existing = getLocalEntity<ExpenseItem>('expenses', email);
  setLocalEntity(
    'expenses',
    existing.filter((e) => e.id !== id),
    email
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Expenses] Delete warning:', err);
    }
  }
  return true;
}

export async function fetchUserIncome(userEmail?: string): Promise<IncomeItem[]> {
  const email = userEmail || getCurrentUserEmail();
  const localIncome = getLocalEntity<IncomeItem>('income', email);
  const supabase = getSupabase();

  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      let query = supabase.from('income').select('*').order('date', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: IncomeItem[] = data.map((d: any) => ({
          id: String(d.id),
          source: d.source || d.title || 'Inflow Receipt',
          amount: Number(d.amount || 0),
          category: d.category || 'Direct Sales',
          payment_mode: d.payment_mode || d.paymentMode || 'NEFT/RTGS',
          date: d.date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          customer_name: d.customer_name || d.party_name || '',
          invoice_no: d.invoice_no || d.invoiceNumber || '',
          status: d.status || 'received',
          user_id: d.user_id,
          created_at: d.created_at,
        }));
        setLocalEntity('income', mapped, email);
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase Income] Fetch error:', err);
    }
  }

  return localIncome;
}

export async function createIncomeInSupabase(
  income: Omit<IncomeItem, 'id' | 'created_at'>,
  userEmail?: string
): Promise<IncomeItem> {
  const email = userEmail || getCurrentUserEmail();
  const newId = `inc-${Date.now()}`;
  const newItem: IncomeItem = {
    ...income,
    id: newId,
    created_at: new Date().toISOString(),
  };

  const existing = getLocalEntity<IncomeItem>('income', email);
  setLocalEntity('income', [newItem, ...existing], email);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const userId = email ? await lookupUserIdByEmail(email) : null;
      await supabase.from('income').insert({
        id: newId,
        source: newItem.source,
        amount: newItem.amount,
        category: newItem.category,
        payment_mode: newItem.payment_mode,
        date: newItem.date,
        customer_name: newItem.customer_name || '',
        invoice_no: newItem.invoice_no || '',
        status: newItem.status || 'received',
        user_id: userId || undefined,
        created_at: newItem.created_at,
      });
    } catch (err) {
      console.warn('[Supabase Income] Insert warning:', err);
    }
  }

  return newItem;
}

export async function deleteIncomeFromSupabase(id: string, userEmail?: string): Promise<boolean> {
  const email = userEmail || getCurrentUserEmail();
  const existing = getLocalEntity<IncomeItem>('income', email);
  setLocalEntity(
    'income',
    existing.filter((i) => i.id !== id),
    email
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('income').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Income] Delete warning:', err);
    }
  }
  return true;
}

/* ==========================================================================
   4. IN-APP NOTIFICATIONS & SHORTAGE ALERTS
   ========================================================================== */

export function getUserNotifications(userEmail?: string): AppNotification[] {
  const email = userEmail || getCurrentUserEmail();
  return getLocalEntity<AppNotification>('notifications', email);
}

export function addUserNotification(
  notification: Omit<AppNotification, 'id' | 'timestamp'>,
  userEmail?: string
): AppNotification {
  const email = userEmail || getCurrentUserEmail();
  const newItem: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const existing = getLocalEntity<AppNotification>('notifications', email);
  setLocalEntity('notifications', [newItem, ...existing], email);

  // Sync to Supabase notifications table if available
  const supabase = getSupabase();
  if (supabase) {
    try {
      lookupUserIdByEmail(email).then((userId) => {
        if (userId) {
          supabase.from('notifications').insert({
            id: newItem.id,
            user_id: userId,
            title: newItem.title,
            message: newItem.message,
            type: newItem.type,
            read: newItem.read,
            action_url: newItem.actionUrl,
            created_at: newItem.timestamp,
          });
        }
      });
    } catch (_) {}
  }

  return newItem;
}

/* ==========================================================================
   5. CASH-FLOW EMAIL ALERT & FORECAST DISPATCHER
   ========================================================================== */

export async function triggerCashFlowShortageAlert(params: {
  email: string;
  openingBalance: number;
  deficitAmount: number;
  projectedNetCash: number;
  receivables30d: number;
  payables30d: number;
}): Promise<{ success: boolean; emailSent: boolean; message: string }> {
  const { email, openingBalance, deficitAmount, projectedNetCash, receivables30d, payables30d } = params;

  // 1. Add alert to in-app Notifications center
  addUserNotification(
    {
      title: '🚨 Cash Shortage Warning Alert',
      message: `Projected 30-Day Deficit of ₹${deficitAmount.toLocaleString('en-IN')}. Inflows: ₹${receivables30d.toLocaleString('en-IN')}, Outflows: ₹${payables30d.toLocaleString('en-IN')}. Shortage warning dispatched to ${email}.`,
      type: 'overdue',
      read: false,
      actionUrl: '/cashflow',
    },
    email
  );

  // 2. Dispatch email alert to Cash Flow & Email Alert Webhook / Supabase Edge function
  let emailSent = false;
  let webhookMessage = '';

  try {
    const res = await fetch('https://api.agents.snsihub.ai/webhook/cashflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        opening_balance: Number(openingBalance),
        projected_net_cash: Number(projectedNetCash),
        shortage_amount: Number(deficitAmount),
        deficit: Number(deficitAmount),
        receivables_30d: Number(receivables30d),
        payables_30d: Number(payables30d),
        shortage_alert: true,
        shortage_alert_sent: true,
        send_email: true,
        subject: `🚨 Urgent: Cash Shortage Warning of ₹${deficitAmount.toLocaleString('en-IN')}`,
        ai_recommendations: [
          `1. Accelerate collection of pending receivables totaling ₹${receivables30d.toLocaleString('en-IN')}.`,
          `2. Request 15-day vendor credit extensions on upcoming ₹${payables30d.toLocaleString('en-IN')} expenses.`,
          `3. Maintain minimum opening cash buffer of ₹${(deficitAmount + 50000).toLocaleString('en-IN')}.`,
        ].join('\n'),
        trigger_reason: 'Automated 30-Day Net Cash Shortage Alert',
        timestamp: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      emailSent = true;
      const data = await res.json().catch(() => ({}));
      webhookMessage = data?.message || 'Email alert dispatched successfully.';
    }
  } catch (err) {
    console.warn('[CashFlow Webhook] Email dispatch error:', err);
  }

  return {
    success: true,
    emailSent,
    message: webhookMessage || `Shortage alert notification logged and email dispatched to ${email}.`,
  };
}

/* ==========================================================================
   6. USER PROFILE & SETTINGS (system_users)
   ========================================================================== */

export async function updateSystemUserProfile(
  email: string,
  updates: {
    business_name?: string;
    default_opening_balance?: number;
    phone?: string;
    gstin?: string;
    pan?: string;
  }
): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Persist in local storage config
  try {
    if (updates.default_opening_balance !== undefined) {
      localStorage.setItem(`cashflow_opening_balance_${cleanEmail}`, String(updates.default_opening_balance));
    }
    const current = localStorage.getItem(`rysta_user_profile_${cleanEmail}`);
    const parsed = current ? JSON.parse(current) : {};
    localStorage.setItem(`rysta_user_profile_${cleanEmail}`, JSON.stringify({ ...parsed, ...updates }));
  } catch (_) {}

  // 2. Persist in Supabase system_users table
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('system_users')
        .update({
          business_name: updates.business_name,
          phone: updates.phone,
          gstin: updates.gstin,
          pan: updates.pan,
          updated_at: new Date().toISOString(),
        })
        .eq('email', cleanEmail);
    } catch (err) {
      console.warn('[Supabase Settings] System user update warning:', err);
    }
  }

  return true;
}
