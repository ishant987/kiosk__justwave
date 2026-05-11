import { create } from 'zustand';
import type { AuthUser } from '../../models/auth';

const TOKEN_KEY = 'justwave.accessToken';
const USER_KEY = 'justwave.user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user?: AuthUser | null) => void;
  clearSession: () => void;
}

const getInitialUser = (): AuthUser | null => {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem(TOKEN_KEY),
  user: getInitialUser(),
  setSession: (token, user) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_KEY);
    }
    set({ token, user: user ?? null });
  },
  clearSession: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  }
}));

export const getAccessToken = () => useAuthStore.getState().token;
export const clearSession = () => useAuthStore.getState().clearSession();
