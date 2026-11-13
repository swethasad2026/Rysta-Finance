import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { PriceList, Promotion } from '@/types';

export async function fetchPromotions(): Promise<Promotion[]> {
  return apiWithFallback<Promotion[]>('/promotions', {}, () => mockService.getPromotions());
}

export async function createPromotion(data: Omit<Promotion, 'id'>): Promise<Promotion> {
  return apiWithFallback<Promotion>(
    '/promotions',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createPromotion(data)
  );
}

export async function updatePromotionStatus(id: string, status: 'active' | 'paused' | 'expired'): Promise<Promotion> {
  return apiWithFallback<Promotion>(
    `/promotions/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    () => mockService.updatePromotionStatus(id, status)
  );
}

export async function fetchPriceLists(): Promise<PriceList[]> {
  return apiWithFallback<PriceList[]>('/price-lists', {}, () => mockService.getPriceLists());
}

export async function createPriceList(data: Omit<PriceList, 'id'>): Promise<PriceList> {
  return apiWithFallback<PriceList>(
    '/price-lists',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createPriceList(data)
  );
}
