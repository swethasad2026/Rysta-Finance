import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { BatchItem, StockMovement } from '@/types';

export async function fetchStockMovements(): Promise<StockMovement[]> {
  return apiWithFallback<StockMovement[]>('/inventory/movements', {}, () => mockService.getStockMovements());
}

export async function fetchBatches(): Promise<BatchItem[]> {
  return apiWithFallback<BatchItem[]>('/inventory/batches', {}, () => mockService.getBatches());
}

export async function recordStockAdjustment(data: {
  productId: string;
  qtyDelta: number;
  reason: string;
  warehouse: string;
  doneBy: string;
}): Promise<StockMovement> {
  return apiWithFallback<StockMovement>(
    '/inventory/adjustments',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.recordStockAdjustment(data)
  );
}
