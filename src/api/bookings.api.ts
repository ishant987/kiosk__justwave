import { httpClient } from './httpClient';
import type { Booking } from '../models/booking';

export const createBooking = async (payload: unknown) => {
  const { data } = await httpClient.post<Booking>('/bookings', payload);
  return data;
};

export const getBooking = async (bookingId: string) => {
  const { data } = await httpClient.get<Booking>(`/bookings/${bookingId}`);
  return data;
};
