// SAMPLE DATA: remove when backend provides real dashboard and staff responses.
import type { DailyGuestInfo } from '@/data/homeDashboard';
import type { ReservationTask, StaffMember } from '@/data/staffAssignments';

export const SAMPLE_RESERVATION_DATE = '2020-09-25';

export const SAMPLE_HOME_DASHBOARD: DailyGuestInfo[] = [
  {
    date: SAMPLE_RESERVATION_DATE,
    arrivals: [
      {
        guestName: 'Jack Peterson',
        reservationId: 'res-101',
        property: 'West End 102',
        channel: 'vrbo',
        checkIn: '2020-09-27T16:00:00Z',
        checkOut: '2020-10-06T10:00:00Z',
        flightNumber: 'DL 992',
        transportation: 'Airport shuttle drop-off 6 PM',
        parkingReserved: true,
        parkingSpot: 'Garage B - 18',
      },
    ],
    departures: [
      {
        guestName: 'Sienna Gomez',
        reservationId: 'res-220',
        property: 'Harbor View Loft',
        channel: 'airbnb',
        checkIn: '2020-09-19T14:00:00Z',
        checkOut: '2020-09-25T09:00:00Z',
        departureTime: '09:30 AM',
        transportation: 'Town car pick-up 9 AM',
      },
    ],
    stays: [
      {
        guestName: 'Elijah Moore',
        reservationId: 'res-330',
        property: 'City Garden Flat',
        channel: 'direct',
        checkIn: '2020-09-22T15:00:00Z',
        checkOut: '2020-09-28T11:00:00Z',
        housekeeping: 'Towel refresh at 3 PM',
      },
    ],
  },
];

export const SAMPLE_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-avery',
    name: 'Avery Johnson',
    role: 'Housekeeping',
    avatarColor: 'bg-emerald-500',
  },
  {
    id: 'staff-maya',
    name: 'Maya Chen',
    role: 'Guest Services',
    avatarColor: 'bg-indigo-500',
  },
];

export const SAMPLE_RESERVATION_TASKS: ReservationTask[] = [
  {
    id: 'task-prepare-suite',
    reservationId: 'res-101',
    description: 'Prepare welcome basket for Jack Peterson',
    status: 'opened',
    suggestedStaffId: 'staff-maya',
  },
  {
    id: 'task-checkout-inspection',
    reservationId: 'res-220',
    description: 'Post-checkout inspection for Harbor View Loft',
    status: 'in-progress',
    suggestedStaffId: 'staff-avery',
  },
  {
    id: 'task-midstay-clean',
    reservationId: 'res-330',
    description: 'Mid-stay tidy for Elijah Moore',
    status: 'done',
    suggestedStaffId: 'staff-avery',
  },
];

export const SAMPLE_STAFF_SCHEDULE: DailyGuestInfo[] = SAMPLE_HOME_DASHBOARD;
