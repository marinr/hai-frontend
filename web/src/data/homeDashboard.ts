import type { Channel } from '@/types';
import { apiFetch } from '@/services/api';

export interface GuestReservation {
  guestName: string;
  reservationId: string;
  property: string;
  channel: Channel;
  checkIn: string;
  checkOut: string;
  parkingReserved?: boolean;
  parkingSpot?: string;
  specialRequests?: string[];
}

export interface ArrivalInfo {
  flightNumber?: string;
  transportation?: string;
  notes?: string;
  eta?: string;
  delay?: string;
}

export interface DepartureInfo {
  transportation?: string;
  departureTime?: string;
  notes?: string;
}

export interface StayInfo {
  requests?: string[];
  housekeeping?: string;
  notes?: string;
}

export type GuestDetail = GuestReservation & Partial<ArrivalInfo & DepartureInfo & StayInfo>;

export interface DailyGuestInfo {
  date: string;
  arrivals: GuestDetail[];
  departures: GuestDetail[];
  stays: GuestDetail[];
}

export const fetchDashboardData = async (token?: string): Promise<DailyGuestInfo[]> => {
  return apiFetch<DailyGuestInfo[]>('/api/dashboard', {}, token);
};
