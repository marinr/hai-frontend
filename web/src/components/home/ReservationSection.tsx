import React from 'react';
import Panel from '@/components/Panel';

import GuestCard from './GuestCard';
import type { GuestDetail } from '@/data/homeDashboard';
import type { ReservationTask, StaffMember, TaskStatus } from '@/data/staffAssignments';

interface ReservationSectionProps {
  title: string;
  countLabel: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeClass: string;
  gradientClass: string;
  guests: GuestDetail[];
  emptyCopy: string;
  tasksByReservation: Map<string, ReservationTask[]>;
  tasksById: Map<string, ReservationTask>;
  staffById: Record<string, StaffMember>;
  selectedDateKey: string;
  normalizeReservationId: (id: string) => string;
  formatDateTime: (value: string) => string;
  statusMeta: Record<
    TaskStatus,
    {
      label: string;
      pillClass: string;
      cardClass: string;
    }
  >;
}

const ReservationSection: React.FC<ReservationSectionProps> = ({
  title,
  countLabel,
  icon,
  accentColor,
  badgeClass,
  gradientClass,
  guests,
  emptyCopy,
  tasksByReservation,
  tasksById,
  staffById,
  selectedDateKey,
  normalizeReservationId,
  formatDateTime,
  statusMeta,
}) => {
  return (
    <Panel className={`flex flex-col gap-3 rounded-2xl border border-gray-200/70 shadow-sm bg-gradient-to-br ${gradientClass} hover:shadow-lg transition-shadow`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentColor} bg-white shadow-sm`}>
            {icon}
          </span>
          <div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-wide">{title}</h3>
            <p className="text-[12px] font-medium text-gray-600">{guests.length === 0 ? emptyCopy : countLabel}</p>
          </div>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${badgeClass} shadow-sm`}>
          {guests.length}
        </span>
      </header>
      {guests.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyCopy}</p>
      ) : (
        <ul className="space-y-2.5 text-sm text-gray-600">
          {guests.map((guest) => {
            const primaryTasks =
              tasksByReservation.get(normalizeReservationId(guest.reservationId)) ?? [];
            const fallbackTasks = (guest.taskIds ?? [])
              .map((taskId) => tasksById.get(taskId))
              .filter((task): task is ReservationTask => Boolean(task));
            const tasks = primaryTasks.length > 0 ? primaryTasks : fallbackTasks;

            return (
              <GuestCard
                key={guest.reservationId}
                guest={guest}
                accentColorClass={accentColor}
                gradientClass={gradientClass}
                tasks={tasks}
                staffById={staffById}
                selectedDateKey={selectedDateKey}
                formatDateTime={formatDateTime}
                statusMeta={statusMeta}
              />
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

export default ReservationSection;
