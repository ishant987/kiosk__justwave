import { httpClient } from './httpClient';
import type { RazorpaySuccessPayload } from '../models/payment';

export const createEntryPassRazorpayOrder = async (ids: string[]) => {
  const { data } = await httpClient.post('/entry-exit/passes/razorpay-order', { ids });
  return data;
};

export const verifyEntryPassRazorpayPayment = async (payload: RazorpaySuccessPayload & { ids: string[] }) => {
  const { data } = await httpClient.post('/entry-exit/passes/razorpay-verify', payload);
  return data;
};

export const createBookingRazorpayOrder = async (bookingId: string) => {
  const { data } = await httpClient.post(`/bookings/${bookingId}/razorpay-order`);
  return data;
};

export const verifyBookingRazorpayPayment = async (bookingId: string, payload: RazorpaySuccessPayload) => {
  const { data } = await httpClient.post(`/bookings/${bookingId}/razorpay-verify`, payload);
  return data;
};
