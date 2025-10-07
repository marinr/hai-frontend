import type { Booking, Listing } from '@/types';
import { apiFetch } from '@/services/api';

export const fetchListings = async (token?: string): Promise<Listing[]> => {
  return apiFetch<Listing[]>('/api/listings', {}, token);
};

export const fetchBookings = async (token?: string): Promise<Booking[]> => {
  return apiFetch<Booking[]>('/api/bookings', {}, token);
};
