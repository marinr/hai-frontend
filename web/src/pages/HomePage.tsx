import React, { useEffect, useMemo, useState } from 'react';
import { Plane, BedDouble, DoorOpen, Sparkles } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

import Panel from '@/components/Panel';
import ReservationSection from '@/components/home/ReservationSection';
import { fetchDashboardData, type DailyGuestInfo, type GuestDetail } from '@/data/homeDashboard';
import { formatDateLabel } from '@/utils/formatDateLabel';
import {
  fetchReservationTasks,
  fetchStaffMembers,
  type ReservationTask,
  type StaffMember,
  type TaskStatus,
} from '@/data/staffAssignments';
import { groupTasksByReservation, indexTasksById, normalizeReservationId } from '@/utils/reservations';

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

const startOfCurrentDay = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HomePage: React.FC = () => {
  const auth = useAuth();
  const [dashboardData, setDashboardData] = useState<DailyGuestInfo[]>([]);
  const [reservationTasks, setReservationTasks] = useState<ReservationTask[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = useMemo(() => startOfCurrentDay(), []);
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
          fetchDashboardData({ token, startDate: today, days: 10 }),
          fetchReservationTasks(token),
          fetchStaffMembers(token),
        ]);

        if (!active) {
          return;
        }

        setDashboardData(dashboardResponse);
        setReservationTasks(taskResponse);
        setStaffMembers(memberResponse);
        setLoading(false);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        console.error('Failed to fetch dashboard data.', fetchError);
        setDashboardData([]);
        setReservationTasks([]);
        setStaffMembers([]);
        setError('Unable to load dashboard data right now.');
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
      return { date: '', arrivals: [], departures: [], stays: [], cleanings: [] };
    }
    const formatted = toDateKey(selectedDate);
    return (
      dashboardData.find((item) => item.date === formatted) ?? {
        date: formatted,
        arrivals: [],
        departures: [],
        stays: [],
        cleanings: [],
      }
    );
  }, [dashboardData, selectedDate]);

  const tasksByReservation = useMemo(() => groupTasksByReservation(reservationTasks), [reservationTasks]);

  const tasksById = useMemo(() => indexTasksById(reservationTasks), [reservationTasks]);
  const staffById = useMemo(() => {
    return staffMembers.reduce<Record<string, StaffMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [staffMembers]);

  const arrivalsCount = selectedData.arrivals.length;
  const staysCount = selectedData.stays.length;
  const departuresCount = selectedData.departures.length;
  const cleaningsCount = selectedData.cleanings.length;
  const selectedDateKey = selectedData.date || (selectedDate ? toDateKey(selectedDate) : '');

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

  const formatDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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
            const dateKey = toDateKey(day);
            const dataForDay = dashboardData.find((entry) => entry.date === dateKey);
            const arrivalCount = dataForDay?.arrivals.length ?? 0;
            const stayCount = dataForDay?.stays.length ?? 0;
            const departureCount = dataForDay?.departures.length ?? 0;
            const cleaningCount = dataForDay?.cleanings.length ?? 0;
            const isActive = selectedDate?.toDateString() === day.toDateString();

            return (
              <button
                key={dateKey}
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
                    <span
                      title="Cleanings"
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        cleaningCount > 0 ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {cleaningCount}
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
                {arrivalsCount} arrivals · {staysCount} in-house · {departuresCount} departures · {cleaningsCount} cleanings
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: 'Arrivals', count: arrivalsCount, icon: <Plane className="h-5 w-5" strokeWidth={2.5} /> },
                { label: 'In-House', count: staysCount, icon: <BedDouble className="h-5 w-5" strokeWidth={2.5} /> },
                { label: 'Departures', count: departuresCount, icon: <DoorOpen className="h-5 w-5" strokeWidth={2.5} /> },
                { label: 'Cleanings', count: cleaningsCount, icon: <Sparkles className="h-5 w-5" strokeWidth={2.5} /> },
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
            <ReservationSection
              key={key}
              title={title}
              countLabel={`${items.length} scheduled`}
              icon={icon}
              accentColor={accentColor}
              badgeClass={badgeClass}
              gradientClass={bgGradient}
              guests={items}
              emptyCopy={emptyCopy}
              tasksByReservation={tasksByReservation}
              tasksById={tasksById}
              staffById={staffById}
              selectedDateKey={selectedData.date}
              normalizeReservationId={normalizeReservationId}
              formatDateTime={formatDateTime}
              statusMeta={TASK_STATUS_META}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default HomePage;
