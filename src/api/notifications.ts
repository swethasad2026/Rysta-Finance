import { AppNotification } from '@/types';
import { getUserNotifications } from './supabaseService';
import { getCurrentUserEmail } from './supabase';

export async function fetchNotifications(userEmail?: string): Promise<AppNotification[]> {
  const email = userEmail || getCurrentUserEmail();
  return getUserNotifications(email);
}

export async function markNotificationAsRead(id: string, userEmail?: string): Promise<void> {
  const email = userEmail || getCurrentUserEmail();
  const notifs = getUserNotifications(email);
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  if (typeof window !== 'undefined') {
    localStorage.setItem(`rysta_user_notifications_${email.toLowerCase().trim()}`, JSON.stringify(updated));
  }
}

export async function markAllNotificationsRead(userEmail?: string): Promise<void> {
  const email = userEmail || getCurrentUserEmail();
  const notifs = getUserNotifications(email);
  const updated = notifs.map((n) => ({ ...n, read: true }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(`rysta_user_notifications_${email.toLowerCase().trim()}`, JSON.stringify(updated));
  }
}

export async function clearAllNotifications(userEmail?: string): Promise<void> {
  const email = userEmail || getCurrentUserEmail();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`rysta_user_notifications_${email.toLowerCase().trim()}`);
  }
}
