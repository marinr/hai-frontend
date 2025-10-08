import { ReservationTask, StaffMember } from '../types';

export const STAFF_MEMBERS: StaffMember[] = [
  { id: 'staff-mary', name: 'Mary Johns', role: 'Housekeeping Lead', avatarColor: '#10b981' },
  { id: 'staff-bob', name: 'Bob Johns', role: 'Maintenance Technician', avatarColor: '#0ea5e9' },
  { id: 'staff-avery', name: 'Avery Chen', role: 'Guest Experience', avatarColor: '#6366f1' },
  { id: 'staff-sam', name: 'Samantha Rivera', role: 'Logistics Coordinator', avatarColor: '#f59e0b' },
];

export const RESERVATION_TASKS: ReservationTask[] = [
  {
    id: 'task-b1-grocery-delivery',
    reservationId: 'b1',
    description: 'Confirm grocery delivery and stage welcome basket for Richard Thompson.',
    status: 'in-progress',
    suggestedStaffId: 'staff-mary',
  },
  {
    id: 'task-b1-late-checkin',
    reservationId: 'b1',
    description: 'Send late check-in instructions and keypad code refresh.',
    status: 'opened',
    suggestedStaffId: 'staff-avery',
  },
  {
    id: 'task-b19-waiver',
    reservationId: 'b19',
    description: 'Verify late checkout waiver is documented and calendar is updated.',
    status: 'done',
    suggestedStaffId: 'staff-sam',
  },
  {
    id: 'task-b19-inspection',
    reservationId: 'b19',
    description: 'Inspect Montrose Upstairs after departure and restock amenities.',
    status: 'opened',
    suggestedStaffId: 'staff-bob',
  },
  {
    id: 'task-b25-pet-kit',
    reservationId: 'b25',
    description: 'Swap linens and restock pet amenities for Gina Howard.',
    status: 'in-progress',
    suggestedStaffId: 'staff-mary',
  },
  {
    id: 'task-b21-vegan-hamper',
    reservationId: 'b21',
    description: 'Stock vegan breakfast hamper before Haley Barnes arrives.',
    status: 'opened',
    suggestedStaffId: 'staff-mary',
  },
  {
    id: 'task-b21-parking',
    reservationId: 'b21',
    description: 'Confirm parking and gate code instructions for Lot C - 7.',
    status: 'done',
    suggestedStaffId: 'staff-avery',
  },
  {
    id: 'task-b8-tour-tickets',
    reservationId: 'b8',
    description: 'Deliver city tour tickets and confirm guest received them.',
    status: 'done',
    suggestedStaffId: 'staff-avery',
  },
  {
    id: 'task-b8-fridge-sweep',
    reservationId: 'b8',
    description: 'Empty fridge and discard perishables before checkout.',
    status: 'in-progress',
    suggestedStaffId: 'staff-bob',
  },
  {
    id: 'task-b23-plan',
    reservationId: 'b23',
    description: 'Do this and that for Jack Peterson arrival prep.',
    status: 'done',
    suggestedStaffId: 'staff-mary',
  },
  {
    id: 'task-b23-towels',
    reservationId: 'b23',
    description: 'Bring new towels and confirm linen preferences.',
    status: 'opened',
    suggestedStaffId: 'staff-mary',
  },
  {
    id: 'task-b23-shuttle',
    reservationId: 'b23',
    description: 'Coordinate airport shuttle confirmation and send ETA update.',
    status: 'in-progress',
    suggestedStaffId: 'staff-sam',
  },
  {
    id: 'task-b5-crib',
    reservationId: 'b5',
    description: 'Set up portable crib and verify bedroom safety for Christa Lee.',
    status: 'done',
    suggestedStaffId: 'staff-bob',
  },
  {
    id: 'task-b5-midstay',
    reservationId: 'b5',
    description: 'Schedule mid-stay clean and confirm housekeeping timing.',
    status: 'opened',
    suggestedStaffId: 'staff-mary',
  },
];
