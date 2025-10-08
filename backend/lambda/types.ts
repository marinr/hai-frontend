export type Channel = 'airbnb' | 'vrbo' | 'direct';

export interface Listing {
  id: string;
  name: string;
  thumbnail: string;
  channels: Channel[];
}

export interface Booking {
  id: string;
  listingId: string;
  guestName: string;
  guestAvatar?: string;
  source: Channel;
  startDate: string;
  endDate: string;
}

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
  };

export interface DailyGuestInfo {
  date: string;
  arrivals: GuestDetail[];
  departures: GuestDetail[];
  stays: GuestDetail[];
}

export type TaskStatus = 'opened' | 'in-progress' | 'done';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}

export interface ReservationTask {
  id: string;
  reservationId: string;
  description: string;
  status: TaskStatus;
  suggestedStaffId?: string;
}
