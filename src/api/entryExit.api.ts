import axios from 'axios';
import { httpClient } from './httpClient';
import type { DurationPackage } from '../models/durationPackage';
import type { CreatePassPayload, EntryPassCreateResult } from '../models/entryPass';
import type { ParentLookupResponse } from '../models/parent';

export const getDurationPrices = async () => {
  const { data } = await httpClient.get<DurationPackage[] | { data?: DurationPackage[]; prices?: DurationPackage[] }>(
    '/entry-exit/duration-prices',
    { params: { price_type: 'standard' } }
  );
  if (Array.isArray(data)) return data;
  return data.data ?? data.prices ?? [];
};

const normalizeParentLookup = (response: ParentLookupResponse, phone: string): ParentLookupResponse => {
  const payload = response.data ?? response;
  const parent = payload.parent ?? payload.customer ?? null;
  const children = payload.children ?? parent?.children ?? [];
  const activeSessions = payload.active_sessions ?? parent?.active_sessions ?? [];

  return {
    ...response,
    parent: parent ? { ...parent, phone: parent.phone ?? phone, children, active_sessions: activeSessions } : null,
    customer: payload.customer ?? response.customer ?? null,
    children,
    active_sessions: activeSessions,
    found: Boolean(parent)
  };
};

export const lookupParent = async (phone: string) => {
  try {
    const { data } = await httpClient.get<ParentLookupResponse>('/entry-exit/parents/lookup', { params: { phone } });
    return normalizeParentLookup(data, phone);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        parent: null,
        children: [],
        active_sessions: [],
        found: false,
        message: 'Parent not found.'
      };
    }
    throw error;
  }
};

export const createPasses = async (payload: CreatePassPayload) => {
  const { data } = await httpClient.post<EntryPassCreateResult>('/entry-exit/passes', payload);
  return data;
};

export const recordPrint = async (ids: string[]) => {
  const { data } = await httpClient.post('/entry-exit/passes/record-print', { ids });
  return data;
};
