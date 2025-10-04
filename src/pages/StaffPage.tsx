import React, { useCallback, useMemo, useState } from 'react';

import Panel from '@/components/Panel';
import {
  RESERVATION_TASKS,
  STAFF_MEMBERS,
  getStaffDashboardData,
  type ReservationTask,
  type StaffMember,
  type TaskStatus,
} from '@/data/staffAssignments';
import type { GuestDetail } from '@/data/homeDashboard';
import { formatDateLabel } from '@/utils/formatDateLabel';

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
  const [initialDate] = useState(() => createInitialSelectedDate());

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string | undefined>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>(() => {
    const initialStatuses: Record<string, TaskStatus> = {};
    RESERVATION_TASKS.forEach((task) => {
      initialStatuses[task.id] = task.status;
    });
    return initialStatuses;
  });
  const [taskResolutions, setTaskResolutions] = useState<Record<string, string>>({});
  const [resolutionModal, setResolutionModal] = useState<{
    taskId: string;
    value: string;
  } | null>(null);
  const [activeDropTaskId, setActiveDropTaskId] = useState<string | null>(null);
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);

  const staffMembers = STAFF_MEMBERS;

  const staffById = useMemo(() => {
    return staffMembers.reduce<Record<string, StaffMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [staffMembers]);

  const dashboardData = useMemo(() => getStaffDashboardData(initialDate), [initialDate]);

  const upcomingDays = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => {
      const date = new Date(initialDate);
      date.setDate(initialDate.getDate() + idx);
      return date;
    });
  }, [initialDate]);

  const tasksByReservation = useMemo(() => {
    const map = new Map<string, ReservationTask[]>();
    RESERVATION_TASKS.forEach((task) => {
      if (map.has(task.reservationId)) {
        map.get(task.reservationId)!.push(task);
      } else {
        map.set(task.reservationId, [task]);
      }
    });
    return map;
  }, []);

  const selectedDateKey = useMemo(() => createDateKey(selectedDate), [selectedDate]);

  const reservationsForDay: ReservationWithTasks[] = useMemo(() => {
    const day = dashboardData.find((entry) => entry.date === selectedDateKey);
    if (!day) {
      return [];
    }

    const build = (details: GuestDetail[], type: ReservationWithTasks['type']) =>
      details.map((detail) => ({
        type,
        detail,
        tasks: tasksByReservation.get(detail.reservationId) ?? [],
      }));

    return [
      ...build(day.arrivals, 'arrival'),
      ...build(day.stays, 'stay'),
      ...build(day.departures, 'departure'),
    ];
  }, [dashboardData, selectedDateKey, tasksByReservation]);

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
            const dataForDay = dashboardData.find((entry) => entry.date === dateKey);
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

                    <section className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-700">Tasks</h4>
                      {tasks.length === 0 ? (
                        <p className="mt-2 text-[11px] text-gray-500">No tasks created yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-3">
                          {tasks.map((task) => {
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
                                className={`rounded-xl border bg-gray-50/70 p-3 transition-shadow ${
                                  isActiveDrop ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                                }`}
                                onDragOver={handleTaskDragOver}
                                onDrop={(event) => handleTaskDrop(event, task.id)}
                                onDragEnter={() => handleTaskDragEnter(task.id)}
                                onDragLeave={(event) => handleTaskDragLeave(task.id, event)}
                              >
                                <div
                                  className={`-mx-3 -mt-3 flex flex-wrap items-center justify-between gap-3 rounded-t-xl px-4 py-3 ${statusMeta.bannerClass}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Status</span>
                                    <span className="text-sm font-semibold uppercase tracking-wide">{statusMeta.label}</span>
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
                                        className="text-[10px] font-semibold text-blue-700 hover:text-blue-900"
                                      >
                                        Clear
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

                                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                                  {STAFF_MEMBERS.map((member) => {
                                    const isAssigned = assignedStaffId === member.id;
                                    return (
                                      <button
                                        key={`${task.id}-${member.id}`}
                                        type="button"
                                        onClick={() => setTaskAssignments((prev) => ({ ...prev, [task.id]: member.id }))}
                                        className={`flex items-center gap-1 rounded-full border px-2 py-1 font-semibold transition-colors ${
                                          isAssigned ? 'border-blue-500 bg-blue-500 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-700'
                                        }`}
                                      >
                                        <span
                                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                          style={{ backgroundColor: member.avatarColor }}
                                        >
                                          {member.name
                                            .split(' ')
                                            .map((part) => part.charAt(0))
                                            .join('')}
                                        </span>
                                        {member.name.split(' ')[0]}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                                  {(['opened', 'in-progress', 'done'] as TaskStatus[]).map((statusOption) => {
                                    const optionMeta = TASK_STATUS_META[statusOption];
                                    const isActiveStatus = currentStatus === statusOption;
                                    const baseClasses = 'px-4 py-2 rounded-xl border text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-300 shadow-sm';
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
                                <p className="mt-3 text-xs leading-relaxed text-gray-700">{task.description}</p>
                                <p className="mt-3 text-[11px] text-gray-500 italic">
                                  {savedResolution ? `Resolution: ${savedResolution}` : 'Resolution not documented yet.'}
                                </p>
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
