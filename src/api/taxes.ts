import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { TaxRate } from '@/types';

export async function fetchTaxRates(): Promise<TaxRate[]> {
  return apiWithFallback<TaxRate[]>('/taxes/rates', {}, () => mockService.getTaxRates());
}

export async function createTaxRate(data: Omit<TaxRate, 'id'>): Promise<TaxRate> {
  return apiWithFallback<TaxRate>(
    '/taxes/rates',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createTaxRate(data)
  );
}
