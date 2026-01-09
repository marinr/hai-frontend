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

export type GuestDetail = GuestReservation &
  Partial<ArrivalInfo & DepartureInfo & StayInfo> & {
    taskIds?: string[];
    cleaningScheduledFor?: string;
    isCleaningTask?: boolean;
  };

export interface DailyGuestInfo {
  date: string;
  arrivals: GuestDetail[];
  departures: GuestDetail[];
  stays: GuestDetail[];
  cleanings: GuestDetail[];
}

interface ReservationApiItem {
  id: string;
  room_id: string;
  checkin_date: string;
  checkout_date: string;
  guest_id: string;
  number_of_guests: number;
  origin: string;
  origin_confirmation_id: string;
  required_crib: boolean;
  required_high_chair: boolean;
  required_parking: boolean;
  departure_ET: string;
  arrival_ET: string;
  flight_number: string;
  diatery_requests: string;
  special_requests: string;
  required_taxi: boolean;
}

interface GuestApiItem {
  id: string;
  name: string;
  surname: string;
}

interface PropertyApiItem {
  id: string;
  room_number: string;
  room_name: string;
}

interface FetchDashboardParams {
  token?: string;
  startDate?: Date;
  days?: number;
}

const startOfDay = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const addDays = (value: Date, increment: number): Date => {
  const next = new Date(value);
  next.setDate(value.getDate() + increment);
  return startOfDay(next);
};

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseYyyymmdd = (value: string): Date | null => {
  if (!value || value.length !== 8) {
    return null;
  }
  const year = Number.parseInt(value.slice(0, 4), 10);
  const month = Number.parseInt(value.slice(4, 6), 10) - 1;
  const day = Number.parseInt(value.slice(6, 8), 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  return new Date(year, month, day);
};

const toLocalDateTime = (date: Date, hours: number, minutes: number): string => {
  const paddedHours = `${hours}`.padStart(2, '0');
  const paddedMinutes = `${minutes}`.padStart(2, '0');
  return `${toDateKey(date)}T${paddedHours}:${paddedMinutes}:00`;
};

const splitRequests = (input: string): string[] | undefined => {
  if (!input) {
    return undefined;
  }
  const parts = input
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
};

const normalizeChannel = (origin: string): Channel => {
  const normalized = origin?.toLowerCase().trim();
  if (normalized === 'airbnb') return 'airbnb';
  if (normalized === 'booking.com' || normalized === 'booking') return 'booking.com';
  if (normalized === 'vrbo') return 'vrbo';
  return 'direct';
};

const createGuestDetail = (
  reservation: ReservationApiItem,
  guest: GuestApiItem | undefined,
  property: PropertyApiItem | undefined,
  checkIn: Date,
  checkOut: Date,
): GuestDetail => {
  const guestName = [guest?.name, guest?.surname].filter(Boolean).join(' ').trim() || 'Unknown guest';
  const propertyName = property?.room_name || property?.room_number || reservation.room_id;

  return {
    guestName,
    reservationId: reservation.id,
    property: propertyName,
    channel: normalizeChannel(reservation.origin),
    checkIn: toLocalDateTime(checkIn, 15, 0),
    checkOut: toLocalDateTime(checkOut, 11, 0),
    parkingReserved: reservation.required_parking,
    specialRequests: splitRequests(reservation.special_requests),
    flightNumber: reservation.flight_number || undefined,
    transportation: reservation.required_taxi ? 'Taxi requested' : undefined,
    eta: reservation.arrival_ET || undefined,
    departureTime: reservation.departure_ET || undefined,
    notes: reservation.special_requests || undefined,
  };
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const fetchDashboardData = async (
  params: FetchDashboardParams = {},
): Promise<DailyGuestInfo[]> => {
  const { token, startDate, days = 10 } = params;
  const baseDate = startOfDay(startDate ?? new Date());
  const horizonDates = Array.from({ length: days }, (_, index) => addDays(baseDate, index));

  const [reservations, guests, properties] = await Promise.all([
    apiFetch<ReservationApiItem[]>('/reservations', {}, token),
    apiFetch<GuestApiItem[]>('/guests', {}, token),
    apiFetch<PropertyApiItem[]>('/properties', {}, token),
  ]);

  const guestById = new Map(guests.map((guest) => [guest.id, guest] as const));
  const propertyById = new Map(properties.map((property) => [property.id, property] as const));

  const horizonStart = baseDate.getTime();
  const horizonEnd = addDays(baseDate, days).getTime();

  const relevantReservations = reservations.filter((reservation) => {
    const checkIn = parseYyyymmdd(reservation.checkin_date);
    const checkOut = parseYyyymmdd(reservation.checkout_date);

    if (!checkIn || !checkOut) {
      return false;
    }

    const checkInTime = checkIn.getTime();
    const checkOutTime = checkOut.getTime();

    return checkOutTime >= horizonStart && checkInTime < horizonEnd;
  });

  const daily: DailyGuestInfo[] = horizonDates.map((date) => ({
    date: toDateKey(date),
    arrivals: [],
    departures: [],
    stays: [],
    cleanings: [],
  }));

  relevantReservations.forEach((reservation) => {
    const checkInDate = parseYyyymmdd(reservation.checkin_date);
    const checkOutDate = parseYyyymmdd(reservation.checkout_date);

    if (!checkInDate || !checkOutDate) {
      return;
    }

    const guest = guestById.get(reservation.guest_id);
    const property = propertyById.get(reservation.room_id);
    const baseDetail = createGuestDetail(reservation, guest, property, checkInDate, checkOutDate);

    daily.forEach((entry, index) => {
      const currentDay = horizonDates[index];
      const dateKey = entry.date;

      if (isSameDay(currentDay, checkInDate)) {
        entry.arrivals.push({ ...baseDetail });
      }

      if (isSameDay(currentDay, checkOutDate)) {
        const departureDetail: GuestDetail = {
          ...baseDetail,
          cleaningScheduledFor: dateKey,
        };
        entry.departures.push(departureDetail);

        const cleaningDetail: GuestDetail = {
          ...baseDetail,
          cleaningScheduledFor: dateKey,
          isCleaningTask: true,
        };
        entry.cleanings.push(cleaningDetail);
      }

      const isDuringStay =
        currentDay.getTime() >= checkInDate.getTime() && currentDay.getTime() < checkOutDate.getTime();

      if (isDuringStay && !isSameDay(currentDay, checkInDate)) {
        entry.stays.push({ ...baseDetail });
      }
    });
  });

  return daily;
};
