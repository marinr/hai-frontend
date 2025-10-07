import { apiFetch } from '@/services/api';
import type { DailyGuestInfo, GuestDetail } from '@/data/homeDashboard';

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

export const fetchStaffMembers = async (token?: string): Promise<StaffMember[]> => {
  return apiFetch<StaffMember[]>('/api/staff/members', {}, token);
};

export const fetchReservationTasks = async (token?: string): Promise<ReservationTask[]> => {
  return apiFetch<ReservationTask[]>('/api/staff/tasks', {}, token);
};

const toDateString = (input?: string | Date): string | undefined => {
  if (!input) {
    return undefined;
  }
  if (typeof input === 'string') {
    return input;
  }
  return input.toISOString().slice(0, 10);
};

export const fetchStaffDashboardData = async (
  baseDate?: string | Date,
  token?: string,
): Promise<DailyGuestInfo[]> => {
  const baseDateString = toDateString(baseDate);
  const query = baseDateString ? `?baseDate=${encodeURIComponent(baseDateString)}` : '';
  return apiFetch<DailyGuestInfo[]>(`/api/staff/assignments${query}`, {}, token);
};

export type { DailyGuestInfo, GuestDetail };
