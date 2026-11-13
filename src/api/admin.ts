import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { LoginLog, User } from '@/types';

export async function fetchUsers(): Promise<User[]> {
  return apiWithFallback<User[]>('/users', {}, () => mockService.getUsers());
}

export async function createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  return apiWithFallback<User>(
    '/users',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createUser(data)
  );
}

export async function updateUserRole(id: string, role: User['role'], status: User['status']): Promise<User> {
  return apiWithFallback<User>(
    `/users/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role, status }),
    },
    () => mockService.updateUserRole(id, role, status)
  );
}

export async function fetchLoginLogs(): Promise<LoginLog[]> {
  return apiWithFallback<LoginLog[]>('/login-log', {}, () => mockService.getLoginLogs());
}
