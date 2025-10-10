import type { ReservationTask } from '@/data/staffAssignments';

export const normalizeReservationId = (id: string): string => id.trim().toLowerCase();

export const groupTasksByReservation = (tasks: ReservationTask[]): Map<string, ReservationTask[]> => {
  const map = new Map<string, ReservationTask[]>();

  tasks.forEach((task) => {
    const key = normalizeReservationId(task.reservationId);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(task);
  });

  return map;
};

export const indexTasksById = (tasks: ReservationTask[]): Map<string, ReservationTask> => {
  const map = new Map<string, ReservationTask>();
  tasks.forEach((task) => {
    map.set(task.id, task);
  });
  return map;
};

