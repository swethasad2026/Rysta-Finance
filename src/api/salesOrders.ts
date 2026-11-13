import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { Invoice, SalesOrder, SalesOrderStatus } from '@/types';

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  return apiWithFallback<SalesOrder[]>('/sales-orders', {}, () => mockService.getSalesOrders());
}

export async function fetchSalesOrderById(id: string): Promise<SalesOrder | undefined> {
  return apiWithFallback<SalesOrder | undefined>(`/sales-orders/${id}`, {}, () => mockService.getSalesOrderById(id));
}

export async function createSalesOrder(data: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt'>): Promise<SalesOrder> {
  return apiWithFallback<SalesOrder>(
    '/sales-orders',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createSalesOrder(data)
  );
}

export async function updateSalesOrderStatus(id: string, status: SalesOrderStatus): Promise<SalesOrder> {
  return apiWithFallback<SalesOrder>(
    `/sales-orders/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    () => mockService.updateSalesOrderStatus(id, status)
  );
}

export async function convertOrderToInvoice(orderId: string): Promise<Invoice> {
  return apiWithFallback<Invoice>(
    `/sales-orders/${orderId}/convert-to-invoice`,
    {
      method: 'POST',
    },
    () => mockService.convertOrderToInvoice(orderId)
  );
}
