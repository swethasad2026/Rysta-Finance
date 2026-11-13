import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { Supplier } from '@/types';

export async function fetchSuppliers(): Promise<Supplier[]> {
  return apiWithFallback<Supplier[]>('/suppliers', {}, () => mockService.getSuppliers());
}

export async function fetchSupplierById(id: string): Promise<Supplier | undefined> {
  return apiWithFallback<Supplier | undefined>(`/suppliers/${id}`, {}, () => mockService.getSupplierById(id));
}

export async function createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
  return apiWithFallback<Supplier>(
    '/suppliers',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createSupplier(data)
  );
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
  return apiWithFallback<Supplier>(
    `/suppliers/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    () => mockService.updateSupplier(id, data)
  );
}

export async function deleteSupplier(id: string): Promise<void> {
  return apiWithFallback<void>(
    `/suppliers/${id}`,
    {
      method: 'DELETE',
    },
    () => mockService.deleteSupplier(id)
  );
}
