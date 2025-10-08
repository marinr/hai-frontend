import React, { useEffect, useMemo, useState } from 'react';
import { Plane, DoorOpen, BedDouble, User, MapPin, Clock } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

import { Link } from 'react-router-dom';

import Panel from '@/components/Panel';
import { fetchDashboardData, type DailyGuestInfo, type GuestDetail } from '@/data/homeDashboard';
import { formatDateLabel } from '@/utils/formatDateLabel';
import {
  fetchReservationTasks,
  fetchStaffMembers,
  type ReservationTask,
  type StaffMember,
  type TaskStatus,
} from '@/data/staffAssignments';
import {
  SAMPLE_HOME_DASHBOARD,
  SAMPLE_RESERVATION_TASKS,
  SAMPLE_STAFF_MEMBERS,
} from '@/data/sampleStaffData';
import { getChannelColor } from '@/utils/channelColors';

const TASK_STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    pillClass: string;
    cardClass: string;
  }
> = {
  opened: {
    label: 'Opened',
    pillClass: 'bg-yellow-100 text-yellow-900',
    cardClass: 'bg-yellow-50/80 border-yellow-200',
  },
  'in-progress': {
    label: 'In-progress',
    pillClass: 'bg-blue-100 text-blue-900',
    cardClass: 'bg-blue-50/80 border-blue-200',
  },
  done: {
    label: 'Done',
    pillClass: 'bg-emerald-100 text-emerald-900',
    cardClass: 'bg-emerald-50/80 border-emerald-200',
  },
};

const normalizeReservationId = (id: string) => id.trim().toLowerCase();

const HomePage: React.FC = () => {
  const auth = useAuth();
  const [dashboardData, setDashboardData] = useState<DailyGuestInfo[]>([]);
  const [reservationTasks, setReservationTasks] = useState<ReservationTask[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = useMemo(() => new Date('2020-09-25T00:00:00'), []);
  const days = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + idx);
      return date;
    });
  }, [today]);

  // Initialize selectedDate once days is available
  useEffect(() => {
    if (!selectedDate && days.length > 0) {
      setSelectedDate(days[0]);
    }
  }, [days, selectedDate]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = auth.user?.access_token;
        const [dashboardResponse, taskResponse, memberResponse] = await Promise.all([
          fetchDashboardData(token),
          fetchReservationTasks(token),
          fetchStaffMembers(token),
        ]);

        if (!active) {
          return;
        }

        const dashboard = dashboardResponse.length > 0 ? dashboardResponse : SAMPLE_HOME_DASHBOARD;
        const tasks = taskResponse.length > 0 ? taskResponse : SAMPLE_RESERVATION_TASKS;
        const members = memberResponse.length > 0 ? memberResponse : SAMPLE_STAFF_MEMBERS;

        setDashboardData(dashboard);
        setReservationTasks(tasks);
        setStaffMembers(members);
        setLoading(false);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        console.error('Failed to fetch dashboard data; using sample data.', fetchError);
        setDashboardData(SAMPLE_HOME_DASHBOARD);
        setReservationTasks(SAMPLE_RESERVATION_TASKS);
        setStaffMembers(SAMPLE_STAFF_MEMBERS);
        setError(null);
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [today, auth.user?.access_token]);

  const selectedData = useMemo<DailyGuestInfo>(() => {
    if (!selectedDate) {
      return { date: '', arrivals: [], departures: [], stays: [] };
    }
    const formatted = selectedDate.toISOString().slice(0, 10);
    return (
      dashboardData.find((item) => item.date === formatted) ?? {
        date: formatted,
        arrivals: [],
        departures: [],
        stays: [],
      }
    );
  }, [dashboardData, selectedDate]);

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

  const tasksById = useMemo(() => {
    const map = new Map<string, ReservationTask>();
    reservationTasks.forEach((task) => {
      map.set(task.id, task);
    });
    return map;
  }, [reservationTasks]);
  const staffById = useMemo(() => {
    return staffMembers.reduce<Record<string, StaffMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [staffMembers]);

  const arrivalsCount = selectedData.arrivals.length;
  const staysCount = selectedData.stays.length;
  const departuresCount = selectedData.departures.length;
  const selectedDateKey = selectedData.date || selectedDate?.toISOString().slice(0, 10) || '';

  const formattedDate = selectedDate?.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
        Loading dashboard…
      </Panel>
    );
  }

  const sections: Array<{
    key: 'arrivals' | 'stays' | 'departures';
    title: string;
    items: GuestDetail[];
    icon: React.ReactNode;
    accentColor: string;
    badgeClass: string;
    bgGradient: string;
    emptyCopy: string;
  }> = [
    {
      key: 'arrivals',
      title: 'Arrivals',
      items: selectedData.arrivals,
      icon: <Plane className="h-6 w-6" strokeWidth={2.5} />,
      accentColor: 'text-emerald-600',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100/50',
      emptyCopy: 'No arrivals.',
    },
    {
      key: 'stays',
      title: 'In-House',
      items: selectedData.stays,
      icon: <BedDouble className="h-6 w-6" strokeWidth={2.5} />,
      accentColor: 'text-blue-600',
      badgeClass: 'bg-blue-100 text-blue-700',
      bgGradient: 'from-blue-50 to-blue-100/50',
      emptyCopy: 'No in-house.',
    },
    {
      key: 'departures',
      title: 'Departures',
      items: selectedData.departures,
      icon: <DoorOpen className="h-6 w-6" strokeWidth={2.5} />,
      accentColor: 'text-amber-600',
      badgeClass: 'bg-amber-100 text-amber-700',
      bgGradient: 'from-amber-50 to-amber-100/50',
      emptyCopy: 'No departures.',
    },
  ];

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <Panel padding={false} className="w-full xl:w-72 flex-shrink-0 overflow-hidden rounded-3xl">
        <header className="px-6 py-5 border-b border-gray-200/60">
          <h3 className="text-sm font-semibold text-gray-800">Upcoming 10 Days</h3>
          <p className="text-xs text-gray-500">Quick glance at arrivals, stays, and departures.</p>
        </header>
        <div className="max-h-[520px] overflow-auto divide-y divide-gray-100">
          {days.map((day) => {
            const label = formatDateLabel(day, today);
            const iso = day.toISOString().slice(0, 10);
            const dataForDay = dashboardData.find((entry) => entry.date === iso);
            const arrivalCount = dataForDay?.arrivals.length ?? 0;
            const stayCount = dataForDay?.stays.length ?? 0;
            const departureCount = dataForDay?.departures.length ?? 0;
              const isActive = selectedDate?.toDateString() === day.toDateString();

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`w-full px-6 py-4 text-left transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{label}</p>
                    <p className="text-xs text-gray-400">
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

      <div className="flex-1 flex flex-col gap-8">
        <section className="rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 text-white shadow-lg border border-white/10">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">Daily Overview</p>
              <h1 className="mt-1.5 text-3xl font-bold">{formattedDate}</h1>
              <p className="mt-1 text-sm text-white/80">
                {arrivalsCount} arrivals · {staysCount} in-house · {departuresCount} departures
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: 'Arrivals', count: arrivalsCount, icon: <Plane className="h-5 w-5" strokeWidth={2.5} /> },
                { label: 'In-House', count: staysCount, icon: <BedDouble className="h-5 w-5" strokeWidth={2.5} /> },
                { label: 'Departures', count: departuresCount, icon: <DoorOpen className="h-5 w-5" strokeWidth={2.5} /> },
              ].map(({ label, count, icon }) => (
                <div
                  key={label}
                  className="flex-1 flex items-center gap-3 rounded-xl bg-white/20 px-4 py-3 backdrop-blur transition hover:bg-white/30"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/30">
                    {icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white/90">{label}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {sections.map(({ key, title, items, icon, accentColor, badgeClass, bgGradient, emptyCopy }) => (
            <Panel key={key} className={`flex flex-col gap-3 rounded-2xl border border-gray-200/70 shadow-sm bg-gradient-to-br ${bgGradient} hover:shadow-lg transition-shadow`}>
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentColor} bg-white shadow-sm`}>
                    {icon}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 tracking-wide">{title}</h3>
                    <p className="text-[12px] font-medium text-gray-600">{items.length === 0 ? emptyCopy : `${items.length} scheduled`}</p>
                  </div>
                </div>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${badgeClass} shadow-sm`}>
                  {items.length}
                </span>
              </header>
              {items.length === 0 ? (
                <p className="text-sm text-gray-500">{emptyCopy}</p>
              ) : (
                <ul className="space-y-2.5 text-sm text-gray-600">
                  {items.map((guest) => {
                    const primaryTasks =
                      tasksByReservation.get(normalizeReservationId(guest.reservationId)) ?? [];
                    const fallbackTasks = (guest.taskIds ?? [])
                      .map((taskId) => tasksById.get(taskId))
                      .filter((task): task is ReservationTask => Boolean(task));
                    const tasks = primaryTasks.length > 0 ? primaryTasks : fallbackTasks;
                    const channelColors = getChannelColor(guest.channel);

                    return (
                    <li
                      key={`${guest.reservationId}-${key}`}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl ${accentColor} bg-gradient-to-br ${bgGradient} font-bold text-lg shadow-md`}
                          aria-hidden
                        >
                          {guest.guestName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 pr-2">
                              <p className="text-lg font-extrabold text-gray-900 leading-tight">{guest.guestName}</p>
                              <p className="text-[12px] text-gray-500 flex items-center gap-1.5 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate font-medium text-gray-600">{guest.property}</span>
                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm"
                                  style={{
                                    backgroundColor: channelColors.background,
                                    color: channelColors.text,
                                  }}
                                >
                                  {guest.channel}
                                </span>
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${accentColor} whitespace-nowrap`}>#{guest.reservationId}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-semibold text-gray-700 uppercase tracking-wide">Check-in</span>
                              <span className="text-gray-700 font-medium">{formatDateTime(guest.checkIn)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-semibold text-gray-700 uppercase tracking-wide">Check-out</span>
                              <span className="text-gray-700 font-medium">{formatDateTime(guest.checkOut)}</span>
                            </div>

                            {guest.flightNumber && (
                              <div className="flex items-center gap-1.5">
                                <Plane className="h-3.5 w-3.5 text-blue-500" />
                                <span className="font-medium text-gray-700">Flight:</span>
                                <span className="text-gray-600">{guest.flightNumber}</span>
                              </div>
                            )}

                            {guest.eta && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="font-medium text-gray-700">ETA:</span>
                                <span className="text-emerald-600 font-semibold">
                                  {guest.eta}{guest.delay ? ` (${guest.delay} delay)` : ''}
                                </span>
                              </div>
                            )}

                            {guest.departureTime && (
                              <div className="flex items-center gap-1.5">
                                <DoorOpen className="h-3.5 w-3.5 text-amber-500" />
                                <span className="font-medium text-gray-700">Departure:</span>
                                <span className="text-amber-600 font-semibold">{guest.departureTime}</span>
                              </div>
                            )}

                            {typeof guest.parkingReserved === 'boolean' && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-purple-500" />
                                <span className="font-medium text-gray-700">Parking:</span>
                                <span className={guest.parkingReserved ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                                  {guest.parkingReserved ? guest.parkingSpot || 'Reserved' : 'Not needed'}
                                </span>
                              </div>
                            )}

                            {guest.transportation && (
                              <div className="flex items-center gap-1.5 col-span-2">
                                <User className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="font-medium text-gray-700">Transport:</span>
                                <span className="text-gray-600">{guest.transportation}</span>
                              </div>
                            )}

                            {guest.housekeeping && (
                              <div className="flex items-center gap-1.5 col-span-2">
                                <BedDouble className="h-3.5 w-3.5 text-blue-500" />
                                <span className="font-medium text-gray-700">Housekeeping:</span>
                                <span className="text-gray-600">{guest.housekeeping}</span>
                              </div>
                            )}
                          </div>

                          {tasks.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {tasks.map((task) => {
                                const statusMeta = TASK_STATUS_META[task.status];
                                const suggested = task.suggestedStaffId ? staffById[task.suggestedStaffId] : undefined;
                                const staffTaskUrl = selectedDateKey
                                  ? `/staff?date=${encodeURIComponent(selectedDateKey)}&taskId=${encodeURIComponent(task.id)}`
                                  : `/staff?taskId=${encodeURIComponent(task.id)}`;

                                return (
                                  <li key={task.id}>
                                    <div className={`rounded-lg border px-3 py-2 text-[11px] shadow-sm ${statusMeta.cardClass}`}>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusMeta.pillClass}`}
                                        >
                                          {statusMeta.label}
                                        </span>
                                        <span className="flex-1 min-w-0 text-gray-900 leading-tight font-medium">
                                          {task.description}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-gray-500">
                                        <span className="truncate">
                                          {suggested?.name ?? 'Unassigned'}
                                        </span>
                                        <Link
                                          to={staffTaskUrl}
                                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                                        >
                                          View
                                        </Link>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                        </div>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HomePage;
