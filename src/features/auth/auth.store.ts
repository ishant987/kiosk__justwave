import { create } from 'zustand';
import type { AuthUser } from '../../models/auth';

const TOKEN_KEY = 'justwave.accessToken';
const USER_KEY = 'justwave.user';

const getSessionItem = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSessionItem = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in embedded previews or strict privacy modes.
  }
};

const removeSessionItem = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in embedded previews or strict privacy modes.
  }
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user?: AuthUser | null) => void;
  clearSession: () => void;
}

const getInitialUser = (): AuthUser | null => {
  const raw = getSessionItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    removeSessionItem(USER_KEY);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getSessionItem(TOKEN_KEY),
  user: getInitialUser(),
  setSession: (token, user) => {
    setSessionItem(TOKEN_KEY, token);
    if (user) {
      setSessionItem(USER_KEY, JSON.stringify(user));
    } else {
      removeSessionItem(USER_KEY);
    }
    set({ token, user: user ?? null });
  },
  clearSession: () => {
    removeSessionItem(TOKEN_KEY);
    removeSessionItem(USER_KEY);
    set({ token: null, user: null });
  }
}));

export const getAccessToken = () => useAuthStore.getState().token;
export const clearSession = () => useAuthStore.getState().clearSession();
