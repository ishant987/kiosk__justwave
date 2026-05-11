import { httpClient } from './httpClient';
import type { LoginResponse } from '../models/auth';

export const login = async (email: string, password: string) => {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', {
    email,
    password,
    device_name: 'web-entry-device'
  });

  return data;
};
