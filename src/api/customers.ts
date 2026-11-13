import { Customer } from '@/types';
import {
  fetchCustomersFromSupabase,
  createCustomerInSupabase,
  updateCustomerInSupabase,
  deleteCustomerFromSupabase,
  bulkImportCustomersToSupabase,
} from './supabaseService';

export async function fetchCustomers(userEmail?: string): Promise<Customer[]> {
  return fetchCustomersFromSupabase(userEmail);
}

export async function fetchCustomerById(id: string, userEmail?: string): Promise<Customer | undefined> {
  const customers = await fetchCustomersFromSupabase(userEmail);
  return customers.find((c) => c.id === id);
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'createdAt'>,
  userEmail?: string
): Promise<Customer> {
  return createCustomerInSupabase(data, userEmail);
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
  userEmail?: string
): Promise<Customer> {
  return updateCustomerInSupabase(id, data, userEmail);
}

export async function deleteCustomer(id: string, userEmail?: string): Promise<void> {
  await deleteCustomerFromSupabase(id, userEmail);
}

export async function toggleCustomerBlock(id: string, userEmail?: string): Promise<Customer> {
  const existing = await fetchCustomerById(id, userEmail);
  if (!existing) throw new Error('Customer not found');

  const newStatus = existing.status === 'blocked' ? 'active' : 'blocked';
  return updateCustomerInSupabase(id, { status: newStatus as any }, userEmail);
}

export async function bulkImportCustomers(
  customers: Partial<Customer>[],
  userEmail?: string
): Promise<{ count: number }> {
  return bulkImportCustomersToSupabase(customers, userEmail);
}
