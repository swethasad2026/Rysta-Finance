import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  expiresAt: number | null; // Timestamp in ms
  isAuthenticated: boolean;
  rememberMe: boolean;
  showSessionWarning: boolean;
  
  // Actions
  setAuth: (token: string, user: User, rememberMe?: boolean, expiresInHours?: number) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  extendSession: () => void;
  setShowSessionWarning: (show: boolean) => void;
  checkTokenExpiration: () => boolean; // returns true if expired
}

const STORAGE_KEYS = {
  TOKEN: 'fmcg_auth_token',
  USER: 'fmcg_auth_user',
  EXPIRES: 'fmcg_auth_expires',
  REMEMBER: 'fmcg_auth_remember',
};

// Retrieve initial state from localStorage or sessionStorage
function getInitialState() {
  const isRemembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
  const storage = isRemembered ? localStorage : sessionStorage;

  const token = storage.getItem(STORAGE_KEYS.TOKEN);
  const userJson = storage.getItem(STORAGE_KEYS.USER);
  const expiresStr = storage.getItem(STORAGE_KEYS.EXPIRES);

  let user: User | null = null;
  let expiresAt: number | null = expiresStr ? parseInt(expiresStr, 10) : null;

  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }

  // Check if expired
  if (token && expiresAt && Date.now() > expiresAt) {
    storage.removeItem(STORAGE_KEYS.TOKEN);
    storage.removeItem(STORAGE_KEYS.USER);
    storage.removeItem(STORAGE_KEYS.EXPIRES);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    return {
      token: null,
      user: null,
      expiresAt: null,
      isAuthenticated: false,
      rememberMe: false,
      showSessionWarning: false,
    };
  }

  return {
    token,
    user,
    expiresAt,
    isAuthenticated: !!token && !!user,
    rememberMe: isRemembered,
    showSessionWarning: false,
  };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getInitialState();

  return {
    token: initial.token,
    user: initial.user,
    expiresAt: initial.expiresAt,
    isAuthenticated: initial.isAuthenticated,
    rememberMe: initial.rememberMe,
    showSessionWarning: false,

    setAuth: (token: string, user: User, rememberMe = true, expiresInHours = 8) => {
      const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
      const storage = rememberMe ? localStorage : sessionStorage;

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER);
      }

      // Clear the other storage just in case
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem(STORAGE_KEYS.TOKEN);
      otherStorage.removeItem(STORAGE_KEYS.USER);
      otherStorage.removeItem(STORAGE_KEYS.EXPIRES);

      storage.setItem(STORAGE_KEYS.TOKEN, token);
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      storage.setItem(STORAGE_KEYS.EXPIRES, expiresAt.toString());

      set({
        token,
        user,
        expiresAt,
        isAuthenticated: true,
        rememberMe,
        showSessionWarning: false,
      });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER);

      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.EXPIRES);

      set({
        token: null,
        user: null,
        expiresAt: null,
        isAuthenticated: false,
        showSessionWarning: false,
      });
    },

    updateUser: (updatedUser: Partial<User>) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const newUser = { ...currentUser, ...updatedUser };
      const storage = get().rememberMe ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      set({ user: newUser });
    },

    extendSession: () => {
      const { token, rememberMe } = get();
      if (!token) return;
      const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.EXPIRES, expiresAt.toString());
      set({ expiresAt, showSessionWarning: false });
    },

    setShowSessionWarning: (show: boolean) => {
      set({ showSessionWarning: show });
    },

    checkTokenExpiration: () => {
      const { expiresAt, isAuthenticated } = get();
      if (!isAuthenticated || !expiresAt) return false;

      const now = Date.now();
      const timeLeft = expiresAt - now;

      // Warn if less than 15 minutes remain
      if (timeLeft > 0 && timeLeft <= 15 * 60 * 1000) {
        set({ showSessionWarning: true });
      }

      // Expired
      if (timeLeft <= 0) {
        get().logout();
        return true;
      }
      return false;
    },
  };
});

/**
 * Role check helpers
 */
export function hasRole(currentRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
}

export function canAccess(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'ADMIN') return true;
  if (allowedRoles.includes(user.role)) return true;
  if ((user.role === 'USER' || user.role === 'user' || user.role === 'sales') && (allowedRoles.includes('sales') || allowedRoles.includes('USER'))) return true;
  return false;
}
