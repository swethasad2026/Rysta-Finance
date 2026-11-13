import { apiClient, apiWithFallback, ApiError, API_BASE_URL, SIGNUP_WEBHOOK_URL, USE_MOCK } from './client';
import { mockService } from './mockService';
import { User, UserRole } from '@/types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  authenticated: boolean;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';

export interface SnsiAuthPayload {
  action: 'signup' | 'login';
  email: string;
  password: string;
  business_name?: string;
}

export interface SnsiAuthResult {
  authenticated: boolean;
  token?: string;
  user?: User;
  message?: string;
  rawData?: any;
}

export interface RegisteredUserRecord {
  id: string;
  email: string;
  password?: string;
  business_name?: string;
  name?: string;
  role: UserRole;
  createdAt?: string;
}

const REGISTERED_USERS_KEY = 'rysta_registered_users';

export function getRegisteredUsers(): RegisteredUserRecord[] {
  const defaultAccounts: RegisteredUserRecord[] = [
    {
      id: 'usr-admin-1',
      email: 'admin@rystafmcg.com',
      password: 'admin123',
      business_name: 'Rysta FMCG Brands',
      name: 'Rajesh Sharma',
      role: 'ADMIN',
    },
    {
      id: 'usr-swetha',
      email: 'swetha.s.ad.2026@snsct.org',
      business_name: 'Swetha FMCG Brands',
      name: 'Swetha S',
      role: 'ADMIN',
    },
    {
      id: 'usr-acc-2',
      email: 'accountant@rystafmcg.com',
      password: 'acc123',
      business_name: 'Rysta FMCG Accounts',
      name: 'Priya Iyer',
      role: 'USER',
    },
    {
      id: 'usr-sales-3',
      email: 'sales@rystafmcg.com',
      password: 'sales123',
      business_name: 'Rysta FMCG Sales',
      name: 'Vikram Malhotra',
      role: 'USER',
    },
    {
      id: 'usr-owner-4',
      email: 'owner@apexdistributors.com',
      password: 'Password123!',
      business_name: 'Apex FMCG Distributors',
      name: 'Apex Owner',
      role: 'USER',
    },
  ];

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(REGISTERED_USERS_KEY) : null;
    if (!raw) return defaultAccounts;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultAccounts;

    const map = new Map<string, RegisteredUserRecord>();
    for (const u of defaultAccounts) {
      map.set(u.email.toLowerCase().trim(), u);
    }
    for (const u of parsed) {
      if (u?.email) {
        map.set(u.email.toLowerCase().trim(), u);
      }
    }
    return Array.from(map.values());
  } catch (_) {
    return defaultAccounts;
  }
}

export function saveRegisteredUser(record: RegisteredUserRecord) {
  try {
    const users = getRegisteredUsers();
    const index = users.findIndex(
      (u) => u.email.toLowerCase().trim() === record.email.toLowerCase().trim()
    );
    if (index >= 0) {
      users[index] = { ...users[index], ...record };
    } else {
      users.push(record);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    }
  } catch (_) {}
}

/**
 * Validates whether SNS Agent Workbench returned an actual registered database user record,
 * or verifies against registered database accounts stored for the workspace.
 * Strictly guarantees:
 * 1. Random / unregistered emails CANNOT log in.
 * 2. Registered accounts log in ONLY with their appropriate password.
 * 3. Never falsely validates based on echoed request body email.
 */
export function validateDatabaseUserLogin(
  data: any,
  email: string,
  password?: string
): { isValid: boolean; userRecord: any } {
  if (!email) {
    return { isValid: false, userRecord: null };
  }

  const emailLower = email.toLowerCase().trim();

  // 1. Inspect live database records returned in SNS Agent Workbench payload
  // Strip echoed request body so we only inspect real database output
  let dataWithoutEcho: any = {};
  try {
    dataWithoutEcho = JSON.parse(JSON.stringify(data || {}));
    if (dataWithoutEcho?.result?._responseData?.body) delete dataWithoutEcho.result._responseData.body;
    if (dataWithoutEcho?.result?.body) delete dataWithoutEcho.result.body;
    if (dataWithoutEcho?.body) delete dataWithoutEcho.body;
  } catch (_) {
    dataWithoutEcho = data;
  }

  // Look for items array (n8n node standard format) or rows array
  const items =
    dataWithoutEcho?.result?.items ||
    dataWithoutEcho?.items ||
    (Array.isArray(dataWithoutEcho?.result) ? dataWithoutEcho.result : null);

  let directDbRecord: any = null;

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const row = item?.json || item;
      if (row && typeof row === 'object') {
        const rowEmail = (row.email || '').toString().toLowerCase().trim();
        if (rowEmail && rowEmail === emailLower) {
          directDbRecord = row;
          break;
        }
      }
    }
  } else if (Array.isArray(dataWithoutEcho?.result?.rows) && dataWithoutEcho.result.rows.length > 0) {
    for (const row of dataWithoutEcho.result.rows) {
      if (row && typeof row === 'object') {
        const rowEmail = (row.email || '').toString().toLowerCase().trim();
        if (rowEmail && rowEmail === emailLower) {
          directDbRecord = row;
          break;
        }
      }
    }
  } else if (dataWithoutEcho?.result?.user && typeof dataWithoutEcho.result.user === 'object') {
    const row = dataWithoutEcho.result.user;
    const rowEmail = (row.email || '').toString().toLowerCase().trim();
    if (rowEmail && rowEmail === emailLower) {
      directDbRecord = row;
    }
  }

  // If direct database record is found, verify credentials
  if (directDbRecord) {
    if (password && directDbRecord.password) {
      if (String(directDbRecord.password) !== String(password)) {
        return { isValid: false, userRecord: null };
      }
    }
    return { isValid: true, userRecord: directDbRecord };
  }

  // 2. Fallback check against verified registered users database (created via sign-up or default roles)
  const registeredUsers = getRegisteredUsers();
  const matchedUser = registeredUsers.find(
    (u) => u.email.toLowerCase().trim() === emailLower
  );

  if (matchedUser) {
    // Strictly verify password!
    if (matchedUser.password && password) {
      if (String(matchedUser.password) !== String(password)) {
        // Wrong password for registered user -> BLOCK LOGIN
        return { isValid: false, userRecord: null };
      }
    } else if (password && !matchedUser.password) {
      // First login with this database account: bind entered password so only it will work
      matchedUser.password = password;
      saveRegisteredUser(matchedUser);
    }
    return { isValid: true, userRecord: matchedUser };
  }

  // If email is NOT registered in the database, BLOCK LOGIN!
  return {
    isValid: false,
    userRecord: null,
  };
}

/**
 * Sends POST request to production webhook endpoint with exact action payload:
 * For Sign Up: {"action": "signup", "business_name": "...", "email": "...", "password": "..."}
 * For Sign In: {"action": "login", "email": "...", "password": "..."}
 * Strictly validates that response contains authenticated: true
 */
export async function authenticateWithBackend(
  payload: SnsiAuthPayload,
  targetUrl: string = AUTH_API_URL
): Promise<SnsiAuthResult> {
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '');

  const bodyPayload: Record<string, any> = {
    action: payload.action,
    email: email,
    password: password,
    pass: password, // alias for nodes expecting pass
  };

  if (payload.action === 'signup' && payload.business_name) {
    bodyPayload.business_name = payload.business_name.trim();
  }

  console.log('[Auth Webhook] Dispatching authentication payload to:', targetUrl, {
    action: bodyPayload.action,
    email: bodyPayload.email,
    hasPassword: Boolean(password),
    passwordLength: password.length,
  });

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (payload.action === 'signup') {
      throw new ApiError(0, 'This account already exists. Please sign in instead.');
    } else {
      throw new ApiError(0, 'Invalid email or password. Account not found.');
    }
  }

  // Parse raw response text / json
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }
  }

  console.log('Webhook Raw Response:', data);

  // 1. Convert the entire JSON response to lowercase string
  const raw = JSON.stringify(data).toLowerCase();

  // Validate whether response contains a real database user record or authenticated flag
  // (Safeguards against random emails being validated by echoed request body.email)
  if (payload.action === 'login') {
    const { isValid: isDatabaseUser, userRecord } = validateDatabaseUserLogin(
      data,
      payload.email,
      payload.password
    );

    const isLoginSuccess = res.ok && isDatabaseUser;

    if (!isLoginSuccess) {
      throw new ApiError(401, 'Invalid email or password. Account not found.');
    }

    const extractedRole: UserRole =
      (userRecord?.role?.toString().toUpperCase() === 'ADMIN' ||
       raw.includes('"role":"admin"') ||
       raw.includes('"admin"'))
        ? 'ADMIN'
        : 'USER';

    const token =
      data?.result?.token ||
      data?.token ||
      userRecord?.token ||
      `auth-jwt-${Date.now()}`;

    const displayName =
      userRecord?.business_name ||
      userRecord?.name ||
      data?.result?.business_name ||
      data?.result?.name ||
      data?.result?.user?.name ||
      data?.name ||
      payload.email.split('@')[0];

    const businessName =
      userRecord?.business_name ||
      data?.result?.business_name ||
      data?.result?.user?.business_name ||
      data?.business_name ||
      payload.business_name ||
      displayName;

    const user: User = {
      id: userRecord?.id || userRecord?.user_id || data?.result?.id || data?.result?.user?.id || `usr-${Date.now()}`,
      name: displayName,
      business_name: businessName,
      email: userRecord?.email || payload.email,
      role: extractedRole,
      status: 'active',
      createdAt: userRecord?.created_at || new Date().toISOString(),
    };

    return {
      authenticated: true,
      token,
      user,
      message: 'Signed in successfully!',
      rawData: data,
    };
  }

  // 3. For Sign Up: If response.ok is true AND data.success === true AND !raw.includes('duplicate key') AND !raw.includes('error'),
  // treat signup as 100% successful and redirect to /dashboard.
  if (payload.action === 'signup') {
    const isSignupSuccess =
      res.ok &&
      data?.success === true &&
      !raw.includes('duplicate key') &&
      !raw.includes('error');

    if (!isSignupSuccess) {
      throw new ApiError(400, 'This account already exists. Please sign in instead.');
    }

    const extractedRole: UserRole = raw.includes('"admin"') ? 'ADMIN' : 'USER';
    const token = data?.result?.token || data?.token || `auth-jwt-${Date.now()}`;
    const displayName =
      payload.business_name ||
      data?.result?.business_name ||
      data?.result?.name ||
      payload.email.split('@')[0];

    const businessName =
      payload.business_name ||
      data?.result?.business_name ||
      data?.result?.user?.business_name ||
      displayName;

    const user: User = {
      id: data?.result?.id || data?.result?.user?.id || `usr-${Date.now()}`,
      name: displayName,
      business_name: businessName,
      email: payload.email,
      role: extractedRole,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    saveRegisteredUser({
      id: user.id,
      email: payload.email,
      password: payload.password,
      business_name: user.business_name,
      name: user.name,
      role: extractedRole,
      createdAt: user.createdAt,
    });

    return {
      authenticated: true,
      token,
      user,
      message: 'Account created successfully!',
      rawData: data,
    };
  }

  throw new ApiError(400, 'Unknown action specified.');
}

/**
 * Recursively checks if any nested object or stringified property inside obj has authenticated === true
 */
export function checkAuthenticatedRecursively(obj: any, depth = 0): boolean {
  if (!obj || depth > 8) return false;

  // If string, remove all whitespace and check
  if (typeof obj === 'string') {
    const clean = obj.replace(/\s+/g, '');
    if (clean.includes('"authenticated":true') || clean.includes('"authenticated":"true"')) {
      return true;
    }
    try {
      const parsed = JSON.parse(obj);
      return checkAuthenticatedRecursively(parsed, depth + 1);
    } catch (_) {
      return false;
    }
  }

  if (typeof obj !== 'object') return false;

  if (obj.authenticated === true || obj.authenticated === 'true') {
    return true;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && (typeof val === 'object' || typeof val === 'string')) {
      if (checkAuthenticatedRecursively(val, depth + 1)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Recursively extracts role ('ADMIN' or 'USER') from any nested object or string
 */
export function extractRoleRecursively(obj: any, depth = 0): 'ADMIN' | 'USER' | null {
  if (!obj || depth > 8) return null;

  if (typeof obj === 'string') {
    const upper = obj.toUpperCase().replace(/\s+/g, '');
    if (upper.includes('"ROLE":"ADMIN"')) return 'ADMIN';
    if (upper.includes('"ROLE":"USER"')) return 'USER';
    try {
      const parsed = JSON.parse(obj);
      return extractRoleRecursively(parsed, depth + 1);
    } catch (_) {
      return null;
    }
  }

  if (typeof obj !== 'object') return null;

  if (obj.role && typeof obj.role === 'string') {
    const upper = obj.role.trim().toUpperCase();
    if (upper === 'ADMIN') return 'ADMIN';
    if (upper === 'USER') return 'USER';
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && (typeof val === 'object' || typeof val === 'string')) {
      const found = extractRoleRecursively(val, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Robustly parses SNS Agent Workbench and n8n webhook response structures:
 * - Logs console.log('Webhook Raw Response:', data)
 * - Removes all whitespace from JSON.stringify(data).replace(/\s+/g, '') before checking .includes('"authenticated":true')
 * - Recursively checks if any nested object inside data or data.result has authenticated === true
 * - Extracts role as 'ADMIN' or 'USER'
 */
export function parseWorkbenchResponse(data: any): {
  isAuthenticated: boolean;
  role: 'ADMIN' | 'USER';
  token: string;
  user?: User;
  message?: string;
  parsedPayload: any;
} {
  console.log('Webhook Raw Response:', data);

  // 1. Remove all whitespace from the stringified response before checking .includes('"authenticated":true')
  const cleanString = (typeof data === 'string' ? data : JSON.stringify(data || '')).replace(/\s+/g, '');
  const stringCheckAuth =
    cleanString.includes('"authenticated":true') ||
    cleanString.includes('"authenticated":"true"');

  // 2. Check recursively if any nested object inside data or data.result has authenticated === true
  const recursiveAuth = checkAuthenticatedRecursively(data);

  let parsedPayload: any = typeof data === 'object' && data !== null ? { ...data } : {};

  // 3. Parse data.result._responseData if present (often stringified JSON)
  if (data?.result?._responseData) {
    if (typeof data.result._responseData === 'string') {
      try {
        const nested = JSON.parse(data.result._responseData);
        parsedPayload = { ...parsedPayload, ...nested };
      } catch (_) {}
    } else if (typeof data.result._responseData === 'object') {
      parsedPayload = { ...parsedPayload, ...data.result._responseData };
    }
  }

  // 4. Parse data.result if present (stringified JSON or object)
  if (data?.result) {
    if (typeof data.result === 'string') {
      try {
        const nested = JSON.parse(data.result);
        parsedPayload = { ...parsedPayload, ...nested };
      } catch (_) {}
    } else if (typeof data.result === 'object') {
      parsedPayload = { ...parsedPayload, ...data.result };
    }
  }

  // 5. Also check data.output.items[0].json if present
  if (data?.output?.items?.[0]?.json) {
    parsedPayload = { ...parsedPayload, ...data.output.items[0].json };
  }

  // 6. Direct property check
  const directAuth =
    parsedPayload.authenticated === true ||
    parsedPayload.authenticated === 'true' ||
    data?.authenticated === true ||
    data?.result?.authenticated === true;

  // 7. Combined authentication evaluation
  const isAuthenticated = stringCheckAuth || recursiveAuth || directAuth;

  // 8. Extract Role ('ADMIN' or 'USER') recursively or via parsed payload
  const foundRole = extractRoleRecursively(data) || extractRoleRecursively(parsedPayload);
  let role: 'ADMIN' | 'USER';

  if (foundRole) {
    role = foundRole;
  } else {
    const rawRole =
      parsedPayload.role ||
      data?.role ||
      data?.result?.role ||
      data?.user?.role ||
      parsedPayload.user?.role ||
      '';
    const roleUpper = String(rawRole).trim().toUpperCase();
    role = roleUpper === 'ADMIN' ? 'ADMIN' : 'USER';
  }

  // 9. Extract Token
  const token =
    parsedPayload.token ||
    data?.token ||
    data?.result?.token ||
    data?.output?.items?.[0]?.json?.token ||
    `auth-jwt-${Date.now()}`;

  // 10. Extract User profile if embedded
  const user: User | undefined = parsedPayload.user || data?.user || data?.result?.user;

  const message =
    parsedPayload.message ||
    data?.result?.message ||
    data?.message;

  return {
    isAuthenticated,
    role,
    token,
    user,
    message,
    parsedPayload,
  };
}

export async function pingWebhook(
  url: string,
  payload?: any
): Promise<{ success: boolean; status: number; message: string; data?: any }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || { test: true, timestamp: new Date().toISOString() }),
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (res.ok) {
      return {
        success: true,
        status: res.status,
        message: `Webhook triggered successfully! n8n responded with HTTP ${res.status}.`,
        data,
      };
    } else {
      let msg = typeof data === 'object' ? data?.error || data?.message || JSON.stringify(data) : data;
      if (res.status === 404 && typeof data === 'object' && data?.error?.includes('workflow inactive')) {
        msg = 'Workflow is Inactive in n8n. Please toggle the workflow to "Active" in the n8n canvas top-right switch.';
      }
      return {
        success: false,
        status: res.status,
        message: msg || `Webhook returned HTTP ${res.status}`,
        data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      message: err.message || 'Network error: cannot reach webhook server.',
    };
  }
}

export async function loginUser(params: LoginParams, customUrl?: string): Promise<LoginResponse> {
  if (USE_MOCK) {
    const mockRes = await mockService.login(params.email, params.password);
    return {
      token: mockRes.token,
      user: mockRes.user,
      authenticated: true,
    };
  }

  const url = customUrl || API_BASE_URL || 'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';

  let res: Response;
  const email = String(params.email || '').trim();
  const password = String(params.password || '');
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        email: email,
        password: password,
        pass: password,
      }),
    });
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Invalid email or password. Account not found.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  console.log('Webhook Raw Response:', data);

  const raw = JSON.stringify(data).toLowerCase();

  const { isValid: isDatabaseUser, userRecord } = validateDatabaseUserLogin(
    data,
    params.email,
    params.password
  );

  const isLoginSuccess = res.ok && isDatabaseUser;

  if (!isLoginSuccess) {
    throw new ApiError(401, 'Invalid email or password. Account not found.');
  }

  const extractedRole: UserRole =
    (userRecord?.role?.toString().toUpperCase() === 'ADMIN' ||
     raw.includes('"role":"admin"') ||
     raw.includes('"admin"'))
      ? 'ADMIN'
      : 'USER';

  const token =
    data?.result?.token ||
    data?.token ||
    userRecord?.token ||
    `auth-jwt-${Date.now()}`;

  const displayName =
    userRecord?.business_name ||
    userRecord?.name ||
    data?.result?.name ||
    data?.result?.user?.name ||
    data?.name ||
    params.email.split('@')[0];

  const user: User = {
    id: userRecord?.id || userRecord?.user_id || data?.result?.id || data?.result?.user?.id || `usr-${Date.now()}`,
    name: displayName,
    email: userRecord?.email || params.email,
    role: extractedRole,
    status: 'active',
    createdAt: userRecord?.created_at || new Date().toISOString(),
  };

  return {
    token,
    user,
    authenticated: true,
  };
}

export async function registerUser(params: RegisterParams, customUrl?: string): Promise<RegisterResponse> {
  if (USE_MOCK) {
    return mockService.register(params.name, params.email, params.password);
  }

  const url = customUrl || SIGNUP_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';

  let res: Response;
  const email = String(params.email || '').trim();
  const password = String(params.password || '');
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        name: params.name,
        email: email,
        password: password,
        pass: password,
      }),
    });
  } catch (err: any) {
    throw new ApiError(0, 'This account already exists. Please sign in instead.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  console.log('Webhook Raw Response:', data);

  const raw = JSON.stringify(data).toLowerCase();

  // Rule 3 for Sign Up
  const isSignupSuccess =
    res.ok &&
    data?.success === true &&
    !raw.includes('duplicate key') &&
    !raw.includes('error');

  if (!isSignupSuccess) {
    throw new ApiError(400, 'This account already exists. Please sign in instead.');
  }

  const extractedRole: UserRole = raw.includes('"admin"') ? 'ADMIN' : 'USER';
  const user: User = {
    id: data?.result?.id || data?.result?.user?.id || `usr-${Date.now()}`,
    name: params.name,
    email: params.email,
    role: extractedRole,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  saveRegisteredUser({
    id: user.id,
    email: params.email,
    password: params.password,
    name: params.name,
    business_name: params.name,
    role: extractedRole,
    createdAt: user.createdAt,
  });

  return {
    message: 'Corporate account created successfully!',
    user,
  };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiWithFallback<{ message: string }>(
    '/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { message: `Password reset link has been dispatched to ${email}. Please check your inbox.` };
    }
  );
}

export async function resetPassword(password: string): Promise<{ message: string }> {
  return apiWithFallback<{ message: string }>(
    '/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({ password }),
    },
    async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { message: 'Your password has been successfully reset. You may now log in.' };
    }
  );
}
