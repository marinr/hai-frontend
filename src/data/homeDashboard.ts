import type { Channel } from '@/types';

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

const demoDashboard: DailyGuestInfo[] = [
  {
    date: '2020-09-25',
    arrivals: [
      {
        guestName: 'Richard Thompson',
        reservationId: 'b1',
        property: '1124 Chapman Avenue',
        channel: 'airbnb',
        checkIn: '2020-09-25T15:00',
        checkOut: '2020-10-05T11:00',
        parkingReserved: true,
        parkingSpot: 'Garage A - 12',
        specialRequests: ['Late check-in clearance', 'Grocery delivery on arrival'],
        flightNumber: 'UA 1245',
        transportation: 'Black car pickup 4:30 PM',
        notes: 'Guest requested local dining recommendations',
        eta: '16:45',
        delay: '15m',
      },
    ],
    departures: [
      {
        guestName: 'Evan Morris',
        reservationId: 'b19',
        property: 'Montrose Upstairs',
        channel: 'direct',
        checkIn: '2020-09-25T15:00',
        checkOut: '2020-10-03T11:00',
        parkingReserved: false,
        specialRequests: ['Late checkout waiver confirmed'],
        transportation: 'Uber scheduled for 9:30 AM',
        departureTime: '11:00',
        notes: 'Confirm late checkout waiver',
      },
    ],
    stays: [
      {
        guestName: 'Gina Howard',
        reservationId: 'b25',
        property: 'West End 105',
        channel: 'airbnb',
        checkIn: '2020-09-24T14:00',
        checkOut: '2020-10-02T11:00',
        parkingReserved: true,
        parkingSpot: 'Lot B - 5',
        specialRequests: ['Guest travelling with dog'],
        requests: ['Extra towels daily'],
        housekeeping: 'Change linens today',
        notes: 'Travels with small dog (approved)',
      },
    ],
  },
  {
    date: '2020-09-26',
    arrivals: [
      {
        guestName: 'Haley Barnes',
        reservationId: 'b21',
        property: 'Teardrop Trailer',
        channel: 'airbnb',
        checkIn: '2020-09-26T14:00',
        checkOut: '2020-10-07T11:00',
        parkingReserved: true,
        parkingSpot: 'Lot C - 7',
        specialRequests: ['Vegan breakfast hamper'],
        transportation: 'Driving, ETA 5 PM',
        notes: 'Vegan breakfast items requested',
      },
    ],
    departures: [],
    stays: [
      {
        guestName: 'Francisco Davis',
        reservationId: 'b8',
        property: '801 Campbell Unit A',
        channel: 'direct',
        checkIn: '2020-09-02T14:00',
        checkOut: '2020-09-04T11:00',
        parkingReserved: false,
        specialRequests: ['Coordinate ticket delivery'],
        requests: ['Fresh coffee beans delivery'],
        housekeeping: 'No service requested',
        notes: 'Deliver city tour tickets to room',
      },
    ],
  },
  {
    date: '2020-09-27',
    arrivals: [
      {
        guestName: 'Jack Peterson',
        reservationId: 'b23',
        property: 'West End 102',
        channel: 'vrbo',
        checkIn: '2020-09-27T16:00',
        checkOut: '2020-10-06T10:00',
        parkingReserved: true,
        parkingSpot: 'Garage B - 18',
        specialRequests: ['Feather-free bedding'],
        flightNumber: 'DL 992',
        transportation: 'Airport shuttle drop-off 6 PM',
        notes: 'Allergic to feather pillows',
      },
    ],
    departures: [
      {
        guestName: 'Francisco Davis',
        reservationId: 'b8',
        property: '801 Campbell Unit A',
        channel: 'direct',
        checkIn: '2020-09-02T14:00',
        checkOut: '2020-09-04T11:00',
        parkingReserved: false,
        specialRequests: ['Pre-departure fridge sweep'],
        transportation: 'Rental car drop-off 11 AM',
        departureTime: '10:00',
        notes: 'Ensure fridge is emptied',
      },
    ],
    stays: [
      {
        guestName: 'Christa Lee',
        reservationId: 'b5',
        property: '430 Church Bedford Hills',
        channel: 'vrbo',
        checkIn: '2020-09-02T16:00',
        checkOut: '2020-09-07T10:00',
        parkingReserved: true,
        parkingSpot: 'Lot A - 3',
        specialRequests: ['Portable crib setup'],
        requests: ['Add portable crib'],
        housekeeping: 'Mid-stay clean tomorrow',
        notes: 'Family of four, baby on site',
      },
    ],
  },
];

export function getDemoDashboardData(): DailyGuestInfo[] {
  return demoDashboard;
}
