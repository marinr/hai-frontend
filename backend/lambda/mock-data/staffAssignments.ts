import { DailyGuestInfo, GuestDetail, ReservationTask, StaffMember } from '../types';

type ReservationType = 'arrival' | 'departure' | 'stay';

interface GuestTemplate extends Omit<GuestDetail, 'checkIn' | 'checkOut'> {
  checkInOffset: number;
  checkOutOffset: number;
  checkInHour?: number;
  checkOutHour?: number;
}

interface ScheduleTemplateDay {
  offset: number;
  arrivals?: GuestTemplate[];
  departures?: GuestTemplate[];
  stays?: GuestTemplate[];
}

const pad = (value: number) => value.toString().padStart(2, '0');

const createDateKey = (baseDate: Date, offsetDays: number) => {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const createDateTime = (baseDate: Date, offsetDays: number, hours: number, minutes = 0) => {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const createGuestDetail = (baseDate: Date, template: GuestTemplate, type: ReservationType): GuestDetail => {
  const {
    reservationId,
    guestName,
    property,
    channel,
    checkInOffset,
    checkOutOffset,
    checkInHour = 15,
    checkOutHour = 11,
    notes,
    parkingReserved,
    parkingSpot,
    specialRequests,
    requests,
    transportation,
    flightNumber,
    eta,
    delay,
    departureTime,
    housekeeping,
  } = template;

  const base: GuestDetail = {
    guestName,
    reservationId,
    property,
    channel,
    checkIn: createDateTime(baseDate, checkInOffset, checkInHour),
    checkOut: createDateTime(baseDate, checkOutOffset, checkOutHour),
    parkingReserved,
    parkingSpot,
    specialRequests,
    requests,
    transportation,
    flightNumber,
    eta,
    delay,
    departureTime,
    housekeeping,
    notes,
  };

  if (type === 'stay' && housekeeping) {
    base.housekeeping = housekeeping;
  }

  return base;
};

const scheduleTemplate: ScheduleTemplateDay[] = [
  {
    offset: 0,
    arrivals: [
      {
        reservationId: 'sr-101',
        guestName: 'Camila Ortiz',
        property: '1124 Chapman Avenue',
        channel: 'airbnb',
        checkInOffset: 0,
        checkOutOffset: 4,
        checkInHour: 15,
        checkOutHour: 11,
        parkingReserved: true,
        parkingSpot: 'Garage A - 08',
        specialRequests: ['Fresh flowers on dining table', 'Portable crib set up'],
        transportation: 'Scheduled Lyft pickup 15:30',
        flightNumber: 'DL 443',
        eta: '15:20',
        delay: '10m',
        notes: 'Travelling with toddler; prefers hypoallergenic detergent.',
      },
      {
        reservationId: 'sr-102',
        guestName: 'Noah Walters',
        property: '430 Church Bedford Hills',
        channel: 'vrbo',
        checkInOffset: 0,
        checkOutOffset: 2,
        checkInHour: 16,
        checkOutHour: 10,
        parkingReserved: false,
        specialRequests: ['Pre-stock sparkling water'],
        transportation: 'Driving from Boston, ETA 18:00',
        notes: 'Celebrating anniversary; leave hand-written card.',
      },
    ],
    stays: [
      {
        reservationId: 'sr-103',
        guestName: 'Elena Brooks',
        property: '801 Campbell Unit A',
        channel: 'direct',
        checkInOffset: -2,
        checkOutOffset: 1,
        checkInHour: 14,
        checkOutHour: 11,
        parkingReserved: true,
        parkingSpot: 'Lot C - 11',
        requests: ['Daily fruit bowl refresh'],
        housekeeping: 'Full-service refresh today before 2 PM',
        notes: 'Working remotely, conference call at 13:00.',
      },
    ],
    departures: [
      {
        reservationId: 'sr-104',
        guestName: 'Maya Patel',
        property: 'Montrose Upstairs',
        channel: 'airbnb',
        checkInOffset: -5,
        checkOutOffset: 0,
        checkInHour: 15,
        checkOutHour: 10,
        parkingReserved: false,
        transportation: 'Uber reserved 09:45',
        departureTime: '10:30',
        notes: 'Confirm late checkout waiver before 9 AM.',
      },
    ],
  },
  {
    offset: 1,
    arrivals: [
      {
        reservationId: 'sr-105',
        guestName: 'Jonah Rivera',
        property: '801 Campbell Unit B',
        channel: 'direct',
        checkInOffset: 1,
        checkOutOffset: 5,
        checkInHour: 15,
        checkOutHour: 11,
        parkingReserved: true,
        parkingSpot: 'Garage C - 03',
        specialRequests: ['Grocery delivery inside fridge'],
        transportation: 'Arriving via rental car, ETA 17:15',
      },
    ],
    stays: [
      {
        reservationId: 'sr-106',
        guestName: 'Ivy Nguyen',
        property: 'Teardrop Trailer',
        channel: 'airbnb',
        checkInOffset: 0,
        checkOutOffset: 3,
        checkInHour: 14,
        checkOutHour: 10,
        parkingReserved: true,
        parkingSpot: 'Lot T - 02',
        requests: ['Refill campfire wood bundle'],
        housekeeping: 'Quick refresh tomorrow 09:00',
        notes: 'Guest travelling with dog (approved).',
      },
    ],
    departures: [
      {
        reservationId: 'sr-107',
        guestName: 'Theo Martin',
        property: 'West End 102',
        channel: 'vrbo',
        checkInOffset: -4,
        checkOutOffset: 1,
        checkInHour: 16,
        checkOutHour: 10,
        parkingReserved: true,
        parkingSpot: 'Garage B - 12',
        transportation: 'Guest driving out 08:30',
        departureTime: '09:45',
        notes: 'Collect spare keys from guest.',
      },
    ],
  },
  {
    offset: 2,
    arrivals: [
      {
        reservationId: 'sr-108',
        guestName: 'Sofia Russo',
        property: '1124 Chapman Avenue',
        channel: 'airbnb',
        checkInOffset: 2,
        checkOutOffset: 6,
        checkInHour: 15,
        checkOutHour: 11,
        parkingReserved: false,
        specialRequests: ['Espresso pods restocked'],
        transportation: 'Airport transfer at 14:40',
        flightNumber: 'UA 982',
        eta: '15:10',
      },
      {
        reservationId: 'sr-109',
        guestName: 'Marcus Reed',
        property: 'Montrose Downstairs',
        channel: 'direct',
        checkInOffset: 2,
        checkOutOffset: 3,
        checkInHour: 16,
        checkOutHour: 10,
        parkingReserved: true,
        parkingSpot: 'Driveway',
        transportation: 'Rideshare at 17:00',
        notes: 'Bring extra yoga mats to unit.',
      },
    ],
    stays: [
      {
        reservationId: 'sr-110',
        guestName: 'Anaïs Dubois',
        property: 'West End 105',
        channel: 'airbnb',
        checkInOffset: 1,
        checkOutOffset: 4,
        checkInHour: 15,
        checkOutHour: 11,
        requests: ['Daily sparkling water restock'],
        housekeeping: 'Deep clean scheduled day after tomorrow',
        notes: 'Allergic to peanuts—double-check welcome snacks.',
      },
    ],
    departures: [
      {
        reservationId: 'sr-111',
        guestName: 'Logan Carter',
        property: 'Teardrop Trailer',
        channel: 'airbnb',
        checkInOffset: -3,
        checkOutOffset: 2,
        checkInHour: 14,
        checkOutHour: 10,
        transportation: 'Guest hiking out at 07:00',
        departureTime: '08:30',
        notes: 'Collect rental gear checklist before departure.',
      },
    ],
  },
  {
    offset: 3,
    arrivals: [
      {
        reservationId: 'sr-112',
        guestName: 'Sienna Clarke',
        property: '801 Campbell Unit C',
        channel: 'vrbo',
        checkInOffset: 3,
        checkOutOffset: 7,
        checkInHour: 15,
        checkOutHour: 11,
        parkingReserved: true,
        parkingSpot: 'Lot C - 04',
        specialRequests: ['Extra desk chair for workspace'],
        transportation: 'Rental SUV, ETA 19:00',
      },
    ],
    stays: [
      {
        reservationId: 'sr-113',
        guestName: 'Beatrice Olsen',
        property: '430 Church Bedford Hills',
        channel: 'airbnb',
        checkInOffset: 2,
        checkOutOffset: 5,
        checkInHour: 16,
        checkOutHour: 11,
        specialRequests: ['Restock herbal tea assortment'],
        housekeeping: 'Turn-down service at 18:00',
      },
    ],
    departures: [
      {
        reservationId: 'sr-114',
        guestName: 'Darius Hall',
        property: 'Montrose Downstairs',
        channel: 'direct',
        checkInOffset: -2,
        checkOutOffset: 3,
        checkInHour: 16,
        checkOutHour: 10,
        parkingReserved: true,
        parkingSpot: 'Driveway',
        transportation: 'Guest requests luggage help 09:30',
        departureTime: '10:00',
      },
    ],
  },
];

export const STAFF_MEMBERS: StaffMember[] = [
  { id: 's1', name: 'Jordan Miles', role: 'Housekeeping Lead', avatarColor: '#2563eb' },
  { id: 's2', name: 'Priya Desai', role: 'Guest Experience', avatarColor: '#059669' },
  { id: 's3', name: 'Alex Chen', role: 'Maintenance', avatarColor: '#f59e0b' },
  { id: 's4', name: 'Morgan Lee', role: 'Concierge', avatarColor: '#7c3aed' },
  { id: 's5', name: 'Casey Taylor', role: 'Housekeeping', avatarColor: '#ef4444' },
];

export const RESERVATION_TASKS: ReservationTask[] = [
  { id: 't-sr-101-1', reservationId: 'sr-101', description: 'Assemble crib, steam linens, and set hypoallergenic pillows.', status: 'opened', suggestedStaffId: 's5' },
  { id: 't-sr-101-2', reservationId: 'sr-101', description: 'Coordinate Lyft pickup confirmation and share updated ETA.', status: 'in-progress', suggestedStaffId: 's4' },
  { id: 't-sr-102-1', reservationId: 'sr-102', description: 'Place anniversary card and sparkling water in fridge.', status: 'opened', suggestedStaffId: 's2' },
  { id: 't-sr-103-1', reservationId: 'sr-103', description: 'Deliver fresh fruit bowl and check coffee supplies.', status: 'opened', suggestedStaffId: 's2' },
  { id: 't-sr-103-2', reservationId: 'sr-103', description: 'Run full-service refresh before 13:30 meeting.', status: 'in-progress', suggestedStaffId: 's1' },
  { id: 't-sr-104-1', reservationId: 'sr-104', description: 'Confirm late checkout waiver and update calendar blocks.', status: 'opened', suggestedStaffId: 's3' },
  { id: 't-sr-105-1', reservationId: 'sr-105', description: 'Stage fridge with grocery delivery by 16:00.', status: 'opened', suggestedStaffId: 's2' },
  { id: 't-sr-106-1', reservationId: 'sr-106', description: 'Restock campfire wood bundle near trailer.', status: 'in-progress', suggestedStaffId: 's3' },
  { id: 't-sr-107-1', reservationId: 'sr-107', description: 'Collect spare keys and audit linens after departure.', status: 'opened', suggestedStaffId: 's1' },
  { id: 't-sr-108-1', reservationId: 'sr-108', description: 'Ensure espresso pods and welcome snacks meet dietary notes.', status: 'opened', suggestedStaffId: 's5' },
  { id: 't-sr-108-2', reservationId: 'sr-108', description: 'Share flight arrival updates with transport vendor.', status: 'in-progress', suggestedStaffId: 's4' },
  { id: 't-sr-109-1', reservationId: 'sr-109', description: 'Deliver extra yoga mats and roll out aromatherapy diffuser.', status: 'opened', suggestedStaffId: 's2' },
  { id: 't-sr-110-1', reservationId: 'sr-110', description: 'Swap snack basket for peanut-free assortment.', status: 'opened', suggestedStaffId: 's5' },
  { id: 't-sr-111-1', reservationId: 'sr-111', description: 'Collect gear checklist and check trailer inventory.', status: 'in-progress', suggestedStaffId: 's3' },
  { id: 't-sr-112-1', reservationId: 'sr-112', description: 'Set up ergonomic desk chair and tidy workspace area.', status: 'opened', suggestedStaffId: 's1' },
  { id: 't-sr-113-1', reservationId: 'sr-113', description: 'Restock tea assortment and prep evening turn-down.', status: 'opened', suggestedStaffId: 's5' },
  { id: 't-sr-114-1', reservationId: 'sr-114', description: 'Coordinate luggage assistance and valet cart.', status: 'done', suggestedStaffId: 's4' },
];

export const getStaffDashboardData = (baseDate: Date): DailyGuestInfo[] =>
  scheduleTemplate.map(({ offset, arrivals = [], departures = [], stays = [] }) => ({
    date: createDateKey(baseDate, offset),
    arrivals: arrivals.map((template) => createGuestDetail(baseDate, template, 'arrival')),
    departures: departures.map((template) => createGuestDetail(baseDate, template, 'departure')),
    stays: stays.map((template) => createGuestDetail(baseDate, template, 'stay')),
  }));
