import axios, { AxiosError } from 'axios';
import { clearSession, getAccessToken } from '../features/auth/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const httpClient = axios.create({
  baseURL: baseURL.replace(/\/$/, ''),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

const duplicatePhonePatterns = ['parent_guardians_phone_unique', 'duplicate entry', '1062'];

export const isDuplicateParentPhoneError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;

  const data = error.response?.data as { message?: string; error?: string } | undefined;
  const text = `${data?.message ?? ''} ${data?.error ?? ''}`.toLowerCase();
  return duplicatePhonePatterns.some((pattern) => text.includes(pattern));
};

export const isConflictError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 409;

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string; errors?: Record<string, string[]> } | undefined;
    if (isDuplicateParentPhoneError(error)) {
      return 'This mobile number already exists. Please select the existing child from the lookup result.';
    }
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.errors) {
      return Object.values(data.errors).flat().join(' ');
    }
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 409) return 'This child already has an active pass or inside session. Please select another child.';
    if (error.response?.status === 422) return 'Please check the entered details.';
    if (!error.response) {
      return `Unable to reach the server at ${baseURL}. Check the API connection and try again.`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
