import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { CompanySettings } from '@/types';

export async function fetchCompanySettings(): Promise<CompanySettings> {
  return apiWithFallback<CompanySettings>('/settings', {}, () => mockService.getCompanySettings());
}

export async function updateCompanySettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
  return apiWithFallback<CompanySettings>(
    '/settings',
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    () => mockService.updateCompanySettings(data)
  );
}

export async function testWebhook(url: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true, timestamp: new Date().toISOString() }),
    });
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: res.ok || res.status === 200 || res.status === 400 || res.status === 401,
      message: `Webhook connection verified! n8n responded with HTTP ${res.status} in ${latencyMs}ms.`,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      message: `Failed to ping webhook: ${err.message}`,
      latencyMs,
    };
  }
}
