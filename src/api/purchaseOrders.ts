import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { Bill, PurchaseOrder, PurchaseOrderStatus } from '@/types';

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  return apiWithFallback<PurchaseOrder[]>('/purchase-orders', {}, () => mockService.getPurchaseOrders());
}

export async function createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): Promise<PurchaseOrder> {
  return apiWithFallback<PurchaseOrder>(
    '/purchase-orders',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createPurchaseOrder(data)
  );
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
  return apiWithFallback<PurchaseOrder>(
    `/purchase-orders/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    () => mockService.updatePurchaseOrderStatus(id, status)
  );
}

export async function convertPOToBill(poId: string): Promise<Bill> {
  return apiWithFallback<Bill>(
    `/purchase-orders/${poId}/convert-to-bill`,
    {
      method: 'POST',
    },
    () => mockService.convertPOToBill(poId)
  );
}

export async function fetchBills(): Promise<Bill[]> {
  return apiWithFallback<Bill[]>('/bills', {}, () => mockService.getBills());
}
