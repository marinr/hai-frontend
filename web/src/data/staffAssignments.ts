import { apiFetch } from '@/services/api';
import { fetchDashboardData, type DailyGuestInfo, type GuestDetail } from '@/data/homeDashboard';

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
  name: string;
  description: string;
  status: TaskStatus;
  resolution: string;
  assignedStaffId?: string;
  suggestedStaffId?: string;
}

interface StaffApiItem {
  id: string;
  name: string;
  surname: string;
  type: string;
}

interface TaskApiItem {
  id: string;
  staff_id: string | null;
  reservation_info_id: string;
  task_name: string;
  task_description: string;
  task_resolution_description: string;
  task_status?: TaskStatus | null;
}

const STAFF_COLOR_PALETTE = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

const pickColor = (input: string): string => {
  let hash = 0;
  for (let idx = 0; idx < input.length; idx += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(idx);
    hash |= 0;
  }
  const index = Math.abs(hash) % STAFF_COLOR_PALETTE.length;
  return STAFF_COLOR_PALETTE[index];
};

export const fetchStaffMembers = async (token?: string): Promise<StaffMember[]> => {
  const staff = await apiFetch<StaffApiItem[]>('/staff', {}, token);
  return staff.map((item) => {
    const fullName = [item.name, item.surname].filter(Boolean).join(' ').trim() || 'Unknown Staff';
    return {
      id: item.id,
      name: fullName,
      role: item.type || 'Team Member',
      avatarColor: pickColor(item.id || fullName),
    };
  });
};

export const fetchReservationTasks = async (token?: string): Promise<ReservationTask[]> => {
  const tasks = await apiFetch<TaskApiItem[]>('/tasks', {}, token);
  return tasks.map(mapTask);
};

const mapTask = (task: TaskApiItem): ReservationTask => {
  const assignedStaffId = task.staff_id?.trim() ? task.staff_id.trim() : undefined;
  const status = task.task_status ?? 'opened';

  return {
    id: task.id,
    reservationId: task.reservation_info_id,
    name: task.task_name || task.task_description || 'Task',
    description: task.task_description || '',
    status,
    resolution: task.task_resolution_description || '',
    assignedStaffId,
    suggestedStaffId: undefined,
  };
};

export const updateTask = async (
  taskId: string,
  updates: Partial<{
    staffId: string | null;
    status: TaskStatus;
    resolution: string;
    name: string;
    description: string;
  }>,
  token?: string,
): Promise<ReservationTask> => {
  const body: Record<string, unknown> = {};

  if ('staffId' in updates) {
    body.staff_id = updates.staffId ?? null;
  }
  if (updates.status) {
    body.task_status = updates.status;
  }
  if (typeof updates.resolution === 'string') {
    body.task_resolution_description = updates.resolution;
  }
  if (typeof updates.name === 'string') {
    body.task_name = updates.name;
  }
  if (typeof updates.description === 'string') {
    body.task_description = updates.description;
  }

  if (Object.keys(body).length === 0) {
    throw new Error('No updates provided for task');
  }

  const updated = await apiFetch<TaskApiItem>(
    `/tasks/${taskId}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    token,
  );

  return mapTask(updated);
};

export const deleteTask = async (taskId: string, token?: string): Promise<void> => {
  await apiFetch<void>(`/tasks/${taskId}`, { method: 'DELETE' }, token);
};

export const fetchStaffDashboardData = async (
  baseDate?: string | Date,
  token?: string,
): Promise<DailyGuestInfo[]> => {
  let startDate: Date | undefined;

  if (baseDate instanceof Date) {
    startDate = baseDate;
  } else if (typeof baseDate === 'string' && baseDate.trim().length > 0) {
    const parsed = new Date(baseDate);
    if (!Number.isNaN(parsed.getTime())) {
      startDate = parsed;
    }
  }

  return fetchDashboardData({ token, startDate });
};

export type { DailyGuestInfo, GuestDetail };
