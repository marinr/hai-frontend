import { HOME_DASHBOARD } from './homeDashboard';
import { DailyGuestInfo, GuestDetail } from '../types';
import { RESERVATION_TASKS, STAFF_MEMBERS } from './sharedStaffData';

export { RESERVATION_TASKS, STAFF_MEMBERS };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateOnly = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const parseDateTime = (value: string): Date | null => {
  const [datePart, timePart] = value.split('T');
  if (!timePart) {
    return null;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const formatDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  const hours = `${value.getHours()}`.padStart(2, '0');
  const minutes = `${value.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const addDays = (value: Date, offset: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + offset);
  return next;
};

const shiftGuestDetail = (
  detail: GuestDetail,
  originalEntryDate: Date,
  targetEntryDate: Date,
): GuestDetail => {
  const shiftDateTimeField = (input: string): string => {
    const parsed = parseDateTime(input);
    if (!parsed) {
      return input;
    }

    const delta = parsed.getTime() - originalEntryDate.getTime();
    const shifted = new Date(targetEntryDate.getTime() + delta);
    return formatDateTime(shifted);
  };

  return {
    ...detail,
    checkIn: shiftDateTimeField(detail.checkIn),
    checkOut: shiftDateTimeField(detail.checkOut),
  };
};

export const getStaffDashboardData = (baseDate: Date): DailyGuestInfo[] => {
  if (HOME_DASHBOARD.length === 0) {
    return [];
  }

  const templateBaseDate = parseDateOnly(HOME_DASHBOARD[0].date);
  const normalizedBaseDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  return HOME_DASHBOARD.map((entry) => {
    const originalEntryDate = parseDateOnly(entry.date);
    const offsetDays = Math.round((originalEntryDate.getTime() - templateBaseDate.getTime()) / MS_PER_DAY);
    const targetEntryDate = addDays(normalizedBaseDate, offsetDays);

    const remapDetails = (details: GuestDetail[]) =>
      details.map((detail) => shiftGuestDetail(detail, originalEntryDate, targetEntryDate));

    return {
      date: formatDate(targetEntryDate),
      arrivals: remapDetails(entry.arrivals),
      departures: remapDetails(entry.departures),
      stays: remapDetails(entry.stays),
    };
  });
};
