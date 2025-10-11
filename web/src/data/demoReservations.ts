import type { Booking, Listing, Channel } from '@/types';
import { apiFetch } from '@/services/api';

interface PropertyApiItem {
  id: string;
  room_number: string;
  room_name: string;
}

interface ReservationApiItem {
  id: string;
  room_id: string;
  checkin_date: string; // DDMMYYYY
  checkout_date: string; // DDMMYYYY
  guest_id: string;
  origin: string;
}

interface GuestApiItem {
  id: string;
  name: string;
  surname: string;
}

const ddmmyyyyToIso = (value: string): string => {
  if (!value || value.length !== 8) {
    return value;
  }
  const day = value.substring(0, 2);
  const month = value.substring(2, 4);
  const year = value.substring(4, 8);
  return `${year}-${month}-${day}`;
};

const mapOriginToChannel = (origin: string | undefined): Channel => {
  if (!origin) {
    return 'direct';
  }

  const normalized = origin.trim().toLowerCase();
  if (normalized.includes('airbnb')) {
    return 'airbnb';
  }
  if (normalized.includes('vrbo')) {
    return 'vrbo';
  }

  return 'direct';
};

export const fetchListings = async (token?: string): Promise<Listing[]> => {
  const properties = await apiFetch<PropertyApiItem[]>('/properties', {}, token);

  return properties.map((property) => ({
    id: property.id,
    name: property.room_name || `Room ${property.room_number}`,
    thumbnail: '',
    channels: ['direct'],
  }));
};

export const fetchBookings = async (token?: string): Promise<Booking[]> => {
  const [reservations, guests] = await Promise.all([
    apiFetch<ReservationApiItem[]>('/reservations', {}, token),
    apiFetch<GuestApiItem[]>('/guests', {}, token),
  ]);

  const guestById = new Map(guests.map((guest) => [guest.id, guest] as const));

  return reservations.map((reservation) => {
    const guest = guestById.get(reservation.guest_id);
    const guestName = [guest?.name, guest?.surname].filter(Boolean).join(' ').trim() || 'Guest';

    return {
      id: reservation.id,
      listingId: reservation.room_id,
      guestName,
      source: mapOriginToChannel(reservation.origin),
      startDate: ddmmyyyyToIso(reservation.checkin_date),
      endDate: ddmmyyyyToIso(reservation.checkout_date),
    };
  });
};
