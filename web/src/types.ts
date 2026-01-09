export type Channel = 'airbnb' | 'vrbo' | 'booking.com' | 'direct';

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

export interface BookingLayoutItem extends Booking {
  startCol: number;
  span: number;
  offsetDays: number;
}

export interface Message {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface CalendarMonth {
  year: number;
  month: number;
  name: string;
  daysInMonth: number;
  startDay: number;
}

export interface CalendarDay {
  day: number;
  date: Date;
  monthIdx: number;
  monthName: string;
  isFirstOfMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  absoluteDay: number;
}
