import { httpClient } from './httpClient';
import type { Branch } from '../models/branch';

export const getLocations = async () => {
  const { data } = await httpClient.get<Branch[] | { data?: Branch[]; locations?: Branch[] }>('/booking-catalog/locations');
  if (Array.isArray(data)) return data;
  return data.data ?? data.locations ?? [];
};
