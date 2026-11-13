import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';
export const SIGNUP_WEBHOOK_URL = import.meta.env.VITE_SIGNUP_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Standard fetch client wrapper with token handling, 401 interception, n8n test/live webhook resolution, and error parsing
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Determine target URL
  let url = endpoint;
  if (!endpoint.startsWith('http')) {
    // If API_BASE_URL is a specific webhook ID endpoint, target it directly
    if (API_BASE_URL.includes('/webhook/2e301a35') || API_BASE_URL.match(/\/webhook\/[a-f0-9-]+$/i)) {
      url = API_BASE_URL;
    } else {
      url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
  }

  let body = options.body;
  if (typeof body === 'string' && body.startsWith('{')) {
    try {
      const parsed = JSON.parse(body);
      if (!parsed.endpoint && endpoint && !endpoint.startsWith('http')) {
        parsed.endpoint = endpoint;
        body = JSON.stringify(parsed);
      }
    } catch (_) {}
  }

  try {
    let response = await fetch(url, {
      ...options,
      body,
      headers,
    });

    // If production /webhook/ is inactive in n8n, seamlessly retry on /webhook-test/
    if (response.status === 404 && url.includes('/webhook/')) {
      const testUrl = url.replace('/webhook/', '/webhook-test/');
      try {
        const testRes = await fetch(testUrl, {
          ...options,
          body,
          headers,
        });
        if (testRes.ok || testRes.status !== 404) {
          response = testRes;
        }
      } catch (_) {}
    }

    if (response.status === 401) {
      // Clear session on 401 and redirect to login
      useAuthStore.getState().logout();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(response.status, errorMessage, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error.message || 'Network error. Please check your backend connection.');
  }
}

/**
 * Executes a real API call if USE_MOCK is false, but gracefully falls back to mock data
 * if the specific n8n webhook route has not yet been deployed (returns 404) or encounters network error.
 */
export async function apiWithFallback<T>(
  endpoint: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  if (USE_MOCK) {
    return fallbackFn();
  }
  try {
    return await apiClient<T>(endpoint, options);
  } catch (err: any) {
    if (err.status === 404 || err.status === 0) {
      console.warn(`[n8n Webhook] Route '${endpoint}' is not yet deployed on n8n (${err.message}). Using local FMCG mock data.`);
      return fallbackFn();
    }
    throw err;
  }
}
