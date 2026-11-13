import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { Payment } from '@/types';

export async function fetchPayments(): Promise<Payment[]> {
  return apiWithFallback<Payment[]>('/payments', {}, () => mockService.getPayments());
}

export async function createPayment(data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>): Promise<Payment> {
  return apiWithFallback<Payment>(
    '/payments',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createPayment(data)
  );
}
