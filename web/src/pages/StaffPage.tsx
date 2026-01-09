import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useSearchParams } from 'react-router-dom';

import Panel from '@/components/Panel';
import {
  fetchReservationTasks,
  fetchStaffDashboardData,
  fetchStaffMembers,
  createTask,
  updateTask as updateReservationTask,
  deleteTask as deleteReservationTask,
  type ReservationTask,
  type StaffMember,
  type TaskStatus,
} from '@/data/staffAssignments';
import type { DailyGuestInfo, GuestDetail } from '@/data/homeDashboard';
import { formatDateLabel } from '@/utils/formatDateLabel';
import { groupTasksByReservation, indexTasksById, normalizeReservationId } from '@/utils/reservations';
import { getChannelColor } from '@/utils/channelColors';

const TASK_STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    pillClass: string;
    cardClass: string;
    buttonActiveClass: string;
    buttonInactiveClass: string;
  }
> = {
  opened: {
    label: 'Opened',
    pillClass: 'bg-yellow-100 text-yellow-900',
    cardClass: 'bg-yellow-50/80 border-yellow-200',
    buttonActiveClass: 'bg-yellow-500 text-white border-yellow-500 shadow-lg',
    buttonInactiveClass: 'border-yellow-400 text-yellow-800 hover:bg-yellow-100',
  },
  'in-progress': {
    label: 'In-progress',
    pillClass: 'bg-blue-100 text-blue-900',
    cardClass: 'bg-blue-50/80 border-blue-200',
    buttonActiveClass: 'bg-blue-500 text-white border-blue-500 shadow-lg',
    buttonInactiveClass: 'border-blue-400 text-blue-800 hover:bg-blue-100',
  },
  done: {
    label: 'Done',
    pillClass: 'bg-green-100 text-green-900',
    cardClass: 'bg-emerald-50/80 border-emerald-200',
    buttonActiveClass: 'bg-green-500 text-white border-green-500 shadow-lg',
    buttonInactiveClass: 'border-green-400 text-green-800 hover:bg-green-100',
  },
};

const RESERVATION_TYPE_META: Record<
  'arrival' | 'departure' | 'stay',
  { label: string; className: string }
> = {
  arrival: { label: 'Arrival', className: 'bg-blue-100 text-blue-700' },
  stay: { label: 'Stay', className: 'bg-amber-100 text-amber-700' },
  departure: { label: 'Departure', className: 'bg-purple-100 text-purple-700' },
};

const createDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createInitialSelectedDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

interface ReservationWithTasks {
  type: 'arrival' | 'departure' | 'stay';
  detail: GuestDetail;
  tasks: ReservationTask[];
}

const StaffPage: React.FC = () => {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const [initialDate, setInitialDate] = useState(() => createInitialSelectedDate());

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string | undefined>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [taskResolutions, setTaskResolutions] = useState<Record<string, string>>({});
  const [resolutionModal, setResolutionModal] = useState<{
    taskId: string;
    value: string;
  } | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<ReservationTask | null>(null);
  const [activeDropTaskId, setActiveDropTaskId] = useState<string | null>(null);
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [newTaskModal, setNewTaskModal] = useState<
    | {
        reservationId: string;
        guestName: string;
        property: string;
        reservationType: ReservationWithTasks['type'];
        checkIn?: string;
        checkOut?: string;
        name: string;
        description: string;
        error: string | null;
        saving: boolean;
      }
    | null
  >(null);
  const taskRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const taskParam = searchParams.get('taskId');

    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!Number.isNaN(parsed.getTime())) {
        const normalized = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        const normalizedKey = createDateKey(normalized);

        if (createDateKey(initialDate) !== normalizedKey) {
          setInitialDate(normalized);
        }

        if (createDateKey(selectedDate) !== normalizedKey) {
          setSelectedDate(normalized);
        }
      }
    }

    setHighlightTaskId(taskParam);
  }, [searchParams, initialDate, selectedDate]);

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [reservationTasks, setReservationTasks] = useState<ReservationTask[]>([]);
  const [staffSchedule, setStaffSchedule] = useState<DailyGuestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = auth.user?.access_token;
        const baseDate = initialDate.toISOString().slice(0, 10);
        const [membersResponse, tasksResponse, assignmentsResponse] = await Promise.all([
          fetchStaffMembers(token),
          fetchReservationTasks(token),
          fetchStaffDashboardData(baseDate, token),
        ]);

        if (!active) {
          return;
        }

        const members = membersResponse ?? [];
        const tasks = tasksResponse ?? [];
        const assignments = assignmentsResponse ?? [];

        setStaffMembers(members);
        setReservationTasks(tasks);
        setStaffSchedule(assignments);
        setTaskStatuses(() => {
          const next: Record<string, TaskStatus> = {};
          tasks.forEach((task) => {
            next[task.id] = task.status;
          });
          return next;
        });

        setTaskAssignments(() => {
          const next: Record<string, string | undefined> = {};
          tasks.forEach((task) => {
            if (task.assignedStaffId) {
              next[task.id] = task.assignedStaffId;
            }
          });
          return next;
        });

        setTaskResolutions(() => {
          const next: Record<string, string> = {};
          tasks.forEach((task) => {
            if (task.resolution) {
              next[task.id] = task.resolution;
            }
          });
          return next;
        });
        setError(null);
        setLoading(false);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        console.error('Failed to fetch staff dashboard data.', fetchError);
        setStaffMembers([]);
        setReservationTasks([]);
        setStaffSchedule([]);
        setTaskStatuses({});
        setTaskAssignments({});
        setTaskResolutions({});
        setError('Unable to load staff dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [initialDate, auth.user?.access_token]);

  const staffById = useMemo(() => {
    return staffMembers.reduce<Record<string, StaffMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [staffMembers]);

  const upcomingDays = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => {
      const date = new Date(initialDate);
      date.setDate(initialDate.getDate() + idx);
      return date;
    });
  }, [initialDate]);

  const tasksByReservation = useMemo(() => groupTasksByReservation(reservationTasks), [reservationTasks]);

  const tasksById = useMemo(() => indexTasksById(reservationTasks), [reservationTasks]);

  const resolveTasksForDetail = useCallback(
    (detail: GuestDetail): ReservationTask[] => {
      const normalizedReservationId = normalizeReservationId(detail.reservationId);
      const primaryTasks = tasksByReservation.get(normalizedReservationId) ?? [];

      if (primaryTasks.length > 0) {
        return primaryTasks;
      }

      const fallbackTasks = (detail.taskIds ?? [])
        .map((taskId) => tasksById.get(taskId))
        .filter((task): task is ReservationTask => Boolean(task));

      return fallbackTasks;
    },
    [tasksByReservation, tasksById],
  );

  const selectedDateKey = useMemo(() => createDateKey(selectedDate), [selectedDate]);

  const reservationsForDay: ReservationWithTasks[] = useMemo(() => {
    const day = staffSchedule.find((entry) => entry.date === selectedDateKey);
    if (!day) {
      return [];
    }

    const build = (details: GuestDetail[], type: ReservationWithTasks['type']) =>
      details.map((detail) => {
        return {
          type,
          detail,
          tasks: resolveTasksForDetail(detail),
        };
      });

    return [
      ...build(day.arrivals, 'arrival'),
      ...build(day.stays, 'stay'),
      ...build(day.departures, 'departure'),
    ];
  }, [staffSchedule, selectedDateKey, resolveTasksForDetail]);

  const syncTaskState = useCallback((updatedTask: ReservationTask) => {
    setReservationTasks((prev) => {
      const exists = prev.some((task) => task.id === updatedTask.id);
      if (exists) {
        return prev.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      }
      return [...prev, updatedTask];
    });

    setTaskStatuses((prev) => ({ ...prev, [updatedTask.id]: updatedTask.status }));

    setTaskResolutions((prev) => {
      const next = { ...prev };
      if (updatedTask.resolution) {
        next[updatedTask.id] = updatedTask.resolution;
      } else {
        delete next[updatedTask.id];
      }
      return next;
    });

    setTaskAssignments((prev) => {
      const next = { ...prev };
      if (updatedTask.assignedStaffId) {
        next[updatedTask.id] = updatedTask.assignedStaffId;
      } else {
        delete next[updatedTask.id];
      }
      return next;
    });
  }, []);

  const handleOpenNewTaskModal = useCallback((reservation: ReservationWithTasks) => {
    const { detail, type } = reservation;

    setNewTaskModal({
      reservationId: detail.reservationId,
      guestName: detail.guestName,
      property: detail.property ?? 'Unknown property',
      reservationType: type,
      checkIn: detail.checkIn,
      checkOut: detail.checkOut,
      name: '',
      description: '',
      error: null,
      saving: false,
    });
  }, []);

  const handleCloseNewTaskModal = useCallback(() => {
    setNewTaskModal(null);
  }, []);

  const handleNewTaskFieldChange = useCallback((field: 'name' | 'description', value: string) => {
    setNewTaskModal((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
            error: field === 'name' ? null : prev.error,
          }
        : prev,
    );
  }, []);

  const handleCreateTaskSave = useCallback(async () => {
    if (!newTaskModal) {
      return;
    }

    const trimmedName = newTaskModal.name.trim();
    const trimmedDescription = newTaskModal.description.trim();

    if (trimmedName.length === 0) {
      setNewTaskModal({ ...newTaskModal, error: 'Task name is required.' });
      return;
    }

    setNewTaskModal({ ...newTaskModal, saving: true, error: null });

    try {
      const created = await createTask(
        {
          reservationId: newTaskModal.reservationId,
          name: trimmedName,
          description: trimmedDescription,
        },
        auth.user?.access_token,
      );

      syncTaskState(created);
      setNewTaskModal(null);
    } catch (error) {
      console.error('Failed to create task', error);

      setNewTaskModal((prev) =>
        prev
          ? {
              ...prev,
              saving: false,
              error: 'Unable to create task right now. Please try again.',
            }
          : prev,
      );
    }
  }, [auth.user?.access_token, newTaskModal, syncTaskState]);

  useEffect(() => {
    if (!highlightTaskId) {
      return;
    }

    const node = taskRefs.current[highlightTaskId];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightTaskId, reservationsForDay]);

  const reservationsTaskCount = useMemo(
    () => reservationsForDay.reduce((total, reservation) => total + reservation.tasks.length, 0),
    [reservationsForDay],
  );

  const reservationsCount = reservationsForDay.length;

  const formattedSelectedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [selectedDate],
  );

  const handleDaySelect = useCallback((day: Date) => {
    setSelectedDate(new Date(day.getFullYear(), day.getMonth(), day.getDate()));
  }, []);

  const handleStaffDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, staffId: string) => {
      setDraggedStaffId(staffId);
      event.dataTransfer.setData('text/plain', staffId);
      event.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const handleStaffDragEnd = useCallback(() => {
    setDraggedStaffId(null);
  }, []);

  const handleTaskDrop = useCallback(
    async (event: React.DragEvent<HTMLLIElement>, taskId: string) => {
      event.preventDefault();
      const staffId = event.dataTransfer.getData('text/plain');
      if (!staffId) {
        setActiveDropTaskId(null);
        setDraggedStaffId(null);
        return;
      }

      try {
        const updated = await updateReservationTask(taskId, { staffId }, auth.user?.access_token);
        syncTaskState(updated);
      } catch (error) {
        console.error('Failed to assign task', error);
      } finally {
        setActiveDropTaskId(null);
        setDraggedStaffId(null);
      }
    },
    [auth.user?.access_token, syncTaskState],
  );

  const handleTaskDragOver = useCallback((event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleTaskDragEnter = useCallback((taskId: string) => {
    setActiveDropTaskId(taskId);
  }, []);

  const handleTaskDragLeave = useCallback((taskId: string, event: React.DragEvent<HTMLLIElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setActiveDropTaskId((prev) => (prev === taskId ? null : prev));
  }, []);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, status: TaskStatus) => {
      try {
        const updated = await updateReservationTask(taskId, { status }, auth.user?.access_token);
        syncTaskState(updated);
      } catch (error) {
        console.error('Failed to update task status', error);
      }
    },
    [auth.user?.access_token, syncTaskState],
  );

  const handleOpenResolutionModal = useCallback(
    (taskId: string) => {
      const task = reservationTasks.find((item) => item.id === taskId);
      const existing = taskResolutions[taskId] ?? task?.resolution ?? '';
      setResolutionModal({ taskId, value: existing });
    },
    [reservationTasks, taskResolutions],
  );

  const handleResolutionSave = useCallback(async () => {
    if (!resolutionModal) return;
    const trimmed = resolutionModal.value.trim();
    try {
      const updated = await updateReservationTask(
        resolutionModal.taskId,
        { resolution: trimmed },
        auth.user?.access_token,
      );
      syncTaskState(updated);
      setResolutionModal(null);
    } catch (error) {
      console.error('Failed to save task resolution', error);
    }
  }, [auth.user?.access_token, resolutionModal, syncTaskState]);

  const handleResolutionCancel = useCallback(() => {
    setResolutionModal(null);
  }, []);

  const clearAssignment = useCallback(
    async (taskId: string) => {
      try {
        const updated = await updateReservationTask(taskId, { staffId: null }, auth.user?.access_token);
        syncTaskState(updated);
      } catch (error) {
        console.error('Failed to clear task assignment', error);
      }
    },
    [auth.user?.access_token, syncTaskState],
  );

  const handleRemoveTask = useCallback(
    (taskId: string) => {
      const task = reservationTasks.find((item) => item.id === taskId);
      if (task) {
        setTaskPendingDelete(task);
      }
    },
    [reservationTasks],
  );

  const handleDeleteCancel = useCallback(() => {
    setTaskPendingDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!taskPendingDelete) return;

    try {
      await deleteReservationTask(taskPendingDelete.id, auth.user?.access_token);

      setReservationTasks((prev) => prev.filter((task) => task.id !== taskPendingDelete.id));

      setTaskStatuses((prev) => {
        const { [taskPendingDelete.id]: _, ...rest } = prev;
        return rest;
      });

      setTaskAssignments((prev) => {
        const next = { ...prev };
        delete next[taskPendingDelete.id];
        return next;
      });

      setTaskResolutions((prev) => {
        const next = { ...prev };
        delete next[taskPendingDelete.id];
        return next;
      });

      delete taskRefs.current[taskPendingDelete.id];

      if (highlightTaskId === taskPendingDelete.id) {
        setHighlightTaskId(null);
      }
    } catch (error) {
      console.error('Failed to delete task', error);
    } finally {
      setTaskPendingDelete(null);
    }
  }, [auth.user?.access_token, highlightTaskId, taskPendingDelete]);

  if (error) {
    return (
      <Panel className="flex-1 flex items-center justify-center text-sm text-red-600">
        {error}
      </Panel>
    );
  }

  if (loading) {
    return (
      <Panel className="flex-1 flex items-center justify-center text-sm text-slate-500">
        Loading staff assignments…
      </Panel>
    );
  }

  const formatDateTime = (value: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex gap-4 overflow-hidden items-start relative">
      <Panel padding={false} className="w-72 flex-shrink-0 flex flex-col">
        <header className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Upcoming 10 Days</h3>
          <p className="text-xs text-gray-500">Stay ahead with daily staffing needs.</p>
        </header>
        <div className="flex-1 overflow-auto divide-y divide-gray-100">
          {upcomingDays.map((day) => {
            const label = formatDateLabel(day, initialDate);
            const dateKey = createDateKey(day);
            const dataForDay = staffSchedule.find((entry) => entry.date === dateKey);
            const statusCounts: Record<TaskStatus, number> = {
              opened: 0,
              'in-progress': 0,
              done: 0,
            };

            if (dataForDay) {
              [...dataForDay.arrivals, ...dataForDay.stays, ...dataForDay.departures].forEach((detail) => {
                resolveTasksForDetail(detail).forEach((task) => {
                  statusCounts[task.status] += 1;
                });
              });
            }
            const isActive = selectedDate.toDateString() === day.toDateString();

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => handleDaySelect(day)}
                className={`w-full text-left px-5 py-4 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-gray-400">
                      {day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {(['opened', 'in-progress', 'done'] as TaskStatus[]).map((status) => {
                      const meta = TASK_STATUS_META[status];
                      const count = statusCounts[status];
                      const hasTasks = count > 0;
                      const colorClasses = hasTasks ? meta.pillClass : 'bg-gray-100 text-gray-400';

                      return (
                        <span
                          key={status}
                          title={`${meta.label} tasks`}
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClasses}`}
                        >
                          {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="flex flex-1 gap-4">
        <Panel padding={false} className="flex-1 min-w-0 flex flex-col">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Reservations</h2>
                <p className="text-xs text-gray-500">{formattedSelectedDate}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{reservationsCount} reservations</span>
                <span>{reservationsTaskCount} tasks</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {reservationsForDay.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No reservations scheduled for this date.
              </div>
            ) : (
              reservationsForDay.map((reservation) => {
                const { detail, type, tasks } = reservation;
                const typeMeta = RESERVATION_TYPE_META[type];
                const channelColors = getChannelColor(detail.channel);

                return (
                  <article
                    key={`${detail.reservationId}-${type}`}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <header className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${typeMeta.className}`}
                        >
                          {typeMeta.label}
                        </span>
                        <p className="text-lg font-extrabold text-gray-900 leading-tight">{detail.guestName}</p>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm"
                          style={{ backgroundColor: channelColors.background, color: channelColors.text }}
                        >
                          {detail.channel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-gray-600">
                        <span className="max-w-[180px] truncate" title={detail.property}>{detail.property}</span>
                        <span className="text-gray-700 font-semibold">
                          {formatDateTime(detail.checkIn)} → {formatDateTime(detail.checkOut)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenNewTaskModal(reservation)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        >
                          + Add Task
                        </button>
                      </div>
                    </header>

                    <section className="mt-2">
                      {tasks.length === 0 ? (
                        <p className="text-[11px] text-gray-500">No tasks created yet.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {tasks.map((task) => {
                            const currentStatus = taskStatuses[task.id] ?? task.status;
                            const statusMeta = TASK_STATUS_META[currentStatus];
                            const assignedStaffId = taskAssignments[task.id] ?? task.assignedStaffId;
                            const assignedStaff = assignedStaffId ? staffById[assignedStaffId] : undefined;
                            const suggestedStaff = !assignedStaff && task.suggestedStaffId ? staffById[task.suggestedStaffId] : undefined;
                            const isActiveDrop = activeDropTaskId === task.id;
                            const currentResolution = taskResolutions[task.id] ?? task.resolution ?? '';
                            const showDescription = task.description && task.description.trim().length > 0 && task.description !== task.name;

                            const isHighlighted = highlightTaskId === task.id;

                            return (
                              <li
                                key={task.id}
                                ref={(node) => {
                                  if (node) {
                                    taskRefs.current[task.id] = node;
                                  } else {
                                    delete taskRefs.current[task.id];
                                  }
                                }}
                                className={`rounded-lg border p-2 shadow-sm transition-shadow ${
                                  isActiveDrop
                                    ? 'border-blue-400 ring-2 ring-blue-200'
                                    : isHighlighted
                                    ? 'border-blue-300 ring-2 ring-blue-300'
                                    : statusMeta.cardClass
                                }`}
                                onDragOver={handleTaskDragOver}
                                onDrop={(event) => {
                                  void handleTaskDrop(event, task.id);
                                }}
                                onDragEnter={() => handleTaskDragEnter(task.id)}
                                onDragLeave={(event) => handleTaskDragLeave(task.id, event)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusMeta.pillClass}`}
                                    >
                                      {statusMeta.label}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[12px] font-semibold leading-tight text-gray-900">
                                        {task.name}
                                      </p>
                                      {showDescription && (
                                        <p className="mt-0.5 text-[11px] leading-snug text-gray-600 break-words">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(task.id)}
                                    aria-label="Remove task"
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                  >
                                    x
                                  </button>
                                </div>

                                <div className="mt-2 text-[10px] italic text-gray-500 truncate">
                                  {currentResolution ? `Resolution: ${currentResolution}` : 'Resolution not documented yet.'}
                                </div>

                                <div className="mt-2 flex items-end justify-between gap-2">
                                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                    {assignedStaff ? (
                                      <>
                                        <span className="max-w-[140px] truncate font-semibold text-gray-700" title={assignedStaff.name}>
                                          {assignedStaff.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            void clearAssignment(task.id);
                                          }}
                                          aria-label="Clear assignee"
                                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600"
                                        >
                                          ×
                                        </button>
                                      </>
                                    ) : suggestedStaff ? (
                                      <span className="font-semibold text-blue-600">Suggested: {suggestedStaff.name}</span>
                                    ) : (
                                      <span className="text-gray-400">Unassigned</span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap justify-end gap-1 text-[10px]">
                                    {(['opened', 'in-progress', 'done'] as TaskStatus[]).map((statusOption) => {
                                      const optionMeta = TASK_STATUS_META[statusOption];
                                      const isActiveStatus = currentStatus === statusOption;
                                      const baseClasses = 'px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-300';
                                      const stateClasses = isActiveStatus
                                        ? optionMeta.buttonActiveClass
                                        : optionMeta.buttonInactiveClass;
                                      return (
                                        <button
                                          key={`${task.id}-${statusOption}`}
                                          type="button"
                                          onClick={() => {
                                            if (statusOption === currentStatus) {
                                              return;
                                            }
                                            if (statusOption === 'done') {
                                              handleOpenResolutionModal(task.id);
                                            }
                                            void handleTaskStatusChange(task.id, statusOption);
                                          }}
                                          className={`${baseClasses} ${stateClasses}`}
                                        >
                                          {optionMeta.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  </article>
                );
              })
            )}
          </div>
        </Panel>

        <div className="w-64 flex-shrink-0">
          <Panel
            padding={false}
            className="sticky top-0 flex max-h-[calc(100vh-3rem)] flex-col"
          >
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Staff</h2>
              <p className="text-xs text-gray-500">Drag to assign</p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {staffMembers.map((member) => (
                <div
                  key={member.id}
                  draggable
                  onDragStart={(event) => handleStaffDragStart(event, member.id)}
                  onDragEnd={handleStaffDragEnd}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                    draggedStaffId === member.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name
                      .split(' ')
                      .map((part) => part.charAt(0))
                      .join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
      </div>
    </div>

    {newTaskModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-gray-900">Add Task</h3>
          <p className="mt-1 text-xs text-gray-500">
            {newTaskModal.guestName} · {newTaskModal.property}
          </p>
          <p className="text-[11px] text-gray-400">
            Reservation {newTaskModal.reservationId.toUpperCase()} — {newTaskModal.reservationType.toUpperCase()}
          </p>
          {(newTaskModal.checkIn || newTaskModal.checkOut) && (
            <p className="mt-2 text-[11px] text-gray-500">
              {formatDateTime(newTaskModal.checkIn ?? '')} → {formatDateTime(newTaskModal.checkOut ?? '')}
            </p>
          )}

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="new-task-name" className="text-xs font-semibold text-gray-700">
                Task name
              </label>
              <input
                id="new-task-name"
                type="text"
                value={newTaskModal.name}
                onChange={(event) => handleNewTaskFieldChange('name', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                placeholder="Enter a short task title"
                disabled={newTaskModal.saving}
              />
            </div>

            <div>
              <label htmlFor="new-task-description" className="text-xs font-semibold text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="new-task-description"
                value={newTaskModal.description}
                onChange={(event) => handleNewTaskFieldChange('description', event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                placeholder="Add more context for the team"
                disabled={newTaskModal.saving}
              />
            </div>

            {newTaskModal.error && (
              <p className="text-xs font-semibold text-red-600">{newTaskModal.error}</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseNewTaskModal}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              disabled={newTaskModal.saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void handleCreateTaskSave();
              }}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
              disabled={newTaskModal.saving}
            >
              {newTaskModal.saving ? 'Saving…' : 'Save Task'}
            </button>
          </div>
        </div>
      </div>
    )}

    {resolutionModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-gray-900">Add Resolution</h3>
            <p className="mt-1 text-xs text-gray-500">Document what was completed for this task.</p>

            <textarea
              value={resolutionModal.value}
              onChange={(event) =>
                setResolutionModal((prev) =>
                  prev ? { ...prev, value: event.target.value } : prev,
                )
              }
              rows={5}
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              placeholder="Write the resolution details here..."
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResolutionCancel}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolutionSave}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {taskPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900">Delete Task</h3>
            <p className="mt-1 text-xs text-gray-500">
              Are you sure you want to delete “{taskPendingDelete.name}”? This action cannot be undone.
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
