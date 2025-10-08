import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import Panel from '@/components/Panel';
import {
  fetchReservationTasks,
  fetchStaffDashboardData,
  fetchStaffMembers,
  type ReservationTask,
  type StaffMember,
  type TaskStatus,
} from '@/data/staffAssignments';
import type { DailyGuestInfo, GuestDetail } from '@/data/homeDashboard';
import { formatDateLabel } from '@/utils/formatDateLabel';
import {
  SAMPLE_RESERVATION_TASKS,
  SAMPLE_STAFF_MEMBERS,
  SAMPLE_STAFF_SCHEDULE,
  SAMPLE_RESERVATION_DATE,
} from '@/data/sampleStaffData';

const TASK_STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    pillClass: string;
    bannerClass: string;
    buttonActiveClass: string;
    buttonInactiveClass: string;
  }
> = {
  opened: {
    label: 'Opened',
    pillClass: 'bg-yellow-100 text-yellow-800',
    bannerClass: 'bg-yellow-200 text-yellow-900',
    buttonActiveClass: 'bg-yellow-500 text-white border-yellow-500 shadow-lg',
    buttonInactiveClass: 'border-yellow-400 text-yellow-800 hover:bg-yellow-100',
  },
  'in-progress': {
    label: 'In-progress',
    pillClass: 'bg-blue-100 text-blue-700',
    bannerClass: 'bg-blue-200 text-blue-900',
    buttonActiveClass: 'bg-blue-500 text-white border-blue-500 shadow-lg',
    buttonInactiveClass: 'border-blue-400 text-blue-800 hover:bg-blue-100',
  },
  done: {
    label: 'Done',
    pillClass: 'bg-green-100 text-green-700',
    bannerClass: 'bg-green-200 text-green-900',
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

const normalizeReservationId = (id: string) => id.trim().toLowerCase();

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
  const [initialDate, setInitialDate] = useState(() => createInitialSelectedDate());

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string | undefined>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [taskResolutions, setTaskResolutions] = useState<Record<string, string>>({});
  const [removedTasks, setRemovedTasks] = useState<Record<string, boolean>>({});
  const [resolutionModal, setResolutionModal] = useState<{
    taskId: string;
    value: string;
  } | null>(null);
  const [activeDropTaskId, setActiveDropTaskId] = useState<string | null>(null);
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);

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

        const members = membersResponse.length > 0 ? membersResponse : SAMPLE_STAFF_MEMBERS;
        const tasks = tasksResponse.length > 0 ? tasksResponse : SAMPLE_RESERVATION_TASKS;
        const assignments = assignmentsResponse.length > 0 ? assignmentsResponse : SAMPLE_STAFF_SCHEDULE;

        setStaffMembers(members);
        setReservationTasks(tasks);
        setStaffSchedule(assignments);
        setTaskStatuses((prev) => {
          const next: Record<string, TaskStatus> = {};

          tasks.forEach((task) => {
            next[task.id] = prev[task.id] ?? task.status;
          });

          return next;
        });

        setTaskAssignments((prev) => {
          const next: Record<string, string | undefined> = {};
          tasks.forEach((task) => {
            if (prev[task.id]) {
              next[task.id] = prev[task.id];
            }
          });
          return next;
        });

        setTaskResolutions((prev) => {
          const next: Record<string, string> = {};
          tasks.forEach((task) => {
            if (prev[task.id]) {
              next[task.id] = prev[task.id];
            }
          });
          return next;
        });

        setRemovedTasks((prev) => {
          const next: Record<string, boolean> = {};
          tasks.forEach((task) => {
            if (prev[task.id]) {
              next[task.id] = prev[task.id];
            }
          });
          return next;
        });

        if (assignments === SAMPLE_STAFF_SCHEDULE) {
          const sampleDate = new Date(SAMPLE_RESERVATION_DATE);
          setInitialDate((prev) => {
            const prevKey = createDateKey(prev);
            return prevKey === SAMPLE_RESERVATION_DATE ? prev : sampleDate;
          });
          setSelectedDate((prev) => {
            const prevKey = createDateKey(prev);
            return prevKey === SAMPLE_RESERVATION_DATE ? prev : sampleDate;
          });
        }

        setLoading(false);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        console.error('Failed to fetch staff dashboard data; using sample data.', fetchError);
        setStaffMembers(SAMPLE_STAFF_MEMBERS);
        setReservationTasks(SAMPLE_RESERVATION_TASKS);
        setStaffSchedule(SAMPLE_STAFF_SCHEDULE);
        setTaskStatuses(() => {
          const next: Record<string, TaskStatus> = {};
          SAMPLE_RESERVATION_TASKS.forEach((task) => {
            next[task.id] = task.status;
          });
          return next;
        });
        setTaskAssignments({});
        setTaskResolutions({});
        setRemovedTasks({});
        const sampleDate = new Date(SAMPLE_RESERVATION_DATE);
        setInitialDate((prev) => {
          const prevKey = createDateKey(prev);
          return prevKey === SAMPLE_RESERVATION_DATE ? prev : sampleDate;
        });
        setSelectedDate((prev) => {
          const prevKey = createDateKey(prev);
          return prevKey === SAMPLE_RESERVATION_DATE ? prev : sampleDate;
        });
        setError(null);
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

  const tasksByReservation = useMemo(() => {
    const map = new Map<string, ReservationTask[]>();
    reservationTasks.forEach((task) => {
      const key = normalizeReservationId(task.reservationId);
      if (map.has(key)) {
        map.get(key)!.push(task);
      } else {
        map.set(key, [task]);
      }
    });
    return map;
  }, [reservationTasks]);

  const selectedDateKey = useMemo(() => createDateKey(selectedDate), [selectedDate]);

  const reservationsForDay: ReservationWithTasks[] = useMemo(() => {
    const day = staffSchedule.find((entry) => entry.date === selectedDateKey);
    if (!day) {
      return [];
    }

    const build = (details: GuestDetail[], type: ReservationWithTasks['type']) =>
      details.map((detail) => ({
        type,
        detail,
        tasks: tasksByReservation.get(normalizeReservationId(detail.reservationId)) ?? [],
      }));

    return [
      ...build(day.arrivals, 'arrival'),
      ...build(day.stays, 'stay'),
      ...build(day.departures, 'departure'),
    ];
  }, [staffSchedule, selectedDateKey, tasksByReservation]);

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
    (event: React.DragEvent<HTMLLIElement>, taskId: string) => {
      event.preventDefault();
      const staffId = event.dataTransfer.getData('text/plain');
      if (!staffId) return;
      setTaskAssignments((prev) => ({ ...prev, [taskId]: staffId }));
      setActiveDropTaskId(null);
      setDraggedStaffId(null);
    },
    [],
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

  const handleTaskStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    setTaskStatuses((prev) => ({ ...prev, [taskId]: status }));
  }, []);

  const handleOpenResolutionModal = useCallback((taskId: string) => {
    setResolutionModal({ taskId, value: taskResolutions[taskId] ?? '' });
  }, [taskResolutions]);

  const handleResolutionSave = useCallback(() => {
    if (!resolutionModal) return;
    const trimmed = resolutionModal.value.trim();
    setTaskResolutions((prev) => ({ ...prev, [resolutionModal.taskId]: trimmed }));
    setResolutionModal(null);
  }, [resolutionModal]);

  const handleResolutionCancel = useCallback(() => {
    setResolutionModal(null);
  }, []);

  const clearAssignment = useCallback((taskId: string) => {
    setTaskAssignments((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const handleRemoveTask = useCallback(
    (taskId: string) => {
      setRemovedTasks((prev) => ({ ...prev, [taskId]: true }));
      clearAssignment(taskId);
      setTaskStatuses((prev) => {
        if (!(taskId in prev)) return prev;
        const { [taskId]: _, ...rest } = prev;
        return rest;
      });
      setTaskResolutions((prev) => {
        if (!(taskId in prev)) return prev;
        const { [taskId]: _, ...rest } = prev;
        return rest;
      });
    },
    [clearAssignment],
  );

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
            const arrivalCount = dataForDay?.arrivals.length ?? 0;
            const stayCount = dataForDay?.stays.length ?? 0;
            const departureCount = dataForDay?.departures.length ?? 0;
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
                    <span
                      title="Arrivals"
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        arrivalCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {arrivalCount}
                    </span>
                    <span
                      title="In-house"
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        stayCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {stayCount}
                    </span>
                    <span
                      title="Departures"
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        departureCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {departureCount}
                    </span>
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

                return (
                  <article
                    key={`${detail.reservationId}-${type}`}
                    className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm"
                  >
                    <header className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{detail.guestName}</h3>
                        <p className="text-xs text-gray-500">
                          {detail.property} · {detail.channel}
                        </p>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${typeMeta.className}`}>
                        {typeMeta.label}
                      </span>
                    </header>

                    <dl
                      className="mt-3 grid gap-3 text-[11px] text-gray-600"
                      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
                    >
                      <div>
                        <dt className="font-semibold text-gray-700">Check-in</dt>
                        <dd>{formatDateTime(detail.checkIn)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-700">Check-out</dt>
                        <dd>{formatDateTime(detail.checkOut)}</dd>
                      </div>
                    </dl>

                    {detail.notes && (
                      <p className="mt-3 text-[11px] text-gray-600 leading-relaxed">{detail.notes}</p>
                    )}

                    <section className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-700">Tasks</h4>
                      {tasks.length === 0 ? (
                        <p className="mt-2 text-[11px] text-gray-500">No tasks created yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {tasks
                            .filter((task) => !removedTasks[task.id])
                            .map((task) => {
                            const currentStatus = taskStatuses[task.id] ?? task.status;
                            const statusMeta = TASK_STATUS_META[currentStatus];
                            const assignedStaffId = taskAssignments[task.id];
                            const assignedStaff = assignedStaffId ? staffById[assignedStaffId] : undefined;
                            const suggestedStaff = !assignedStaff && task.suggestedStaffId ? staffById[task.suggestedStaffId] : undefined;
                            const isActiveDrop = activeDropTaskId === task.id;
                            const savedResolution = taskResolutions[task.id] ?? '';

                            return (
                              <li
                                key={task.id}
                                className={`rounded-lg border bg-white p-2.5 transition-shadow ${
                                  isActiveDrop ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                                }`}
                                onDragOver={handleTaskDragOver}
                                onDrop={(event) => handleTaskDrop(event, task.id)}
                                onDragEnter={() => handleTaskDragEnter(task.id)}
                                onDragLeave={(event) => handleTaskDragLeave(task.id, event)}
                              >
                                <div
                                  className={`flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-[11px] ${statusMeta.bannerClass}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                  {assignedStaff ? (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[11px] font-semibold text-current"
                                        title={assignedStaff.name}
                                      >
                                        {assignedStaff.name
                                          .split(' ')
                                          .map((part) => part.charAt(0))
                                          .join('')}
                                      </span>
                                      <div className="text-right">
                                        <p className="text-[11px] font-semibold">{assignedStaff.name}</p>
                                        <p className="text-[10px] text-gray-600">{assignedStaff.role}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => clearAssignment(task.id)}
                                        aria-label="Clear assignment"
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-[11px] font-bold text-blue-700 hover:bg-white hover:text-blue-900"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : suggestedStaff ? (
                                    <div className="flex items-center gap-2 text-[10px] text-gray-700">
                                      <span className="font-semibold text-gray-600">Suggested:</span>
                                      <span className="font-semibold text-blue-600">{suggestedStaff.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-500">Unassigned</span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                                  {(['opened', 'in-progress', 'done'] as TaskStatus[]).map((statusOption) => {
                                    const optionMeta = TASK_STATUS_META[statusOption];
                                    const isActiveStatus = currentStatus === statusOption;
                                    const baseClasses = 'px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-300';
                                    const stateClasses = isActiveStatus
                                      ? optionMeta.buttonActiveClass
                                      : optionMeta.buttonInactiveClass;
                                    return (
                                      <button
                                        key={`${task.id}-${statusOption}`}
                                        type="button"
                                        onClick={() => {
                                          if (statusOption === 'done' && currentStatus !== 'done') {
                                            handleOpenResolutionModal(task.id);
                                          }
                                          handleTaskStatusChange(task.id, statusOption);
                                        }}
                                        className={`${baseClasses} ${stateClasses}`}
                                      >
                                        {optionMeta.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="mt-2 text-[11px] leading-snug text-gray-700">{task.description}</p>
                                <p className="mt-2 text-[11px] text-gray-500 italic">
                                  {savedResolution ? `Resolution: ${savedResolution}` : 'Resolution not documented yet.'}
                                </p>
                                <div className="mt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(task.id)}
                                    className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
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
    </div>
  );
};

export default StaffPage;
