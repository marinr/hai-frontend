import React from 'react';
import { Clock, DoorOpen, Plane, User, MapPin, BedDouble } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { GuestDetail } from '@/data/homeDashboard';
import type { ReservationTask, StaffMember } from '@/data/staffAssignments';
import ChannelBadge from '@/components/reservations/ChannelBadge';
import GuestAvatar from '@/components/reservations/GuestAvatar';

interface GuestCardProps {
  guest: GuestDetail;
  accentColorClass: string;
  gradientClass: string;
  tasks: ReservationTask[];
  staffById: Record<string, StaffMember>;
  selectedDateKey: string;
  formatDateTime: (value: string) => string;
  statusMeta: Record<
    ReservationTask['status'],
    {
      label: string;
      pillClass: string;
      cardClass: string;
    }
  >;
}

const GuestCard: React.FC<GuestCardProps> = ({
  guest,
  accentColorClass,
  gradientClass,
  tasks,
  staffById,
  selectedDateKey,
  formatDateTime,
  statusMeta,
}) => {
  const taskLink = (taskId: string) =>
    selectedDateKey
      ? `/staff?date=${encodeURIComponent(selectedDateKey)}&taskId=${encodeURIComponent(taskId)}`
      : `/staff?taskId=${encodeURIComponent(taskId)}`;

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-3">
        <GuestAvatar
          name={guest.guestName}
          accentColorClass={accentColorClass}
          gradientClass={`bg-gradient-to-br ${gradientClass}`}
          className="h-12 w-12"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 pr-2">
              <p className="text-lg font-extrabold text-gray-900 leading-tight">{guest.guestName}</p>
              <p className="text-[12px] text-gray-500 flex items-center gap-1.5 mt-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate font-medium text-gray-600">{guest.property}</span>
                <ChannelBadge channel={guest.channel} />
              </p>
            </div>
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">#{guest.reservationId}</span>
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
                  {guest.eta}
                  {guest.delay ? ` (${guest.delay} delay)` : ''}
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
                const statusInfo = statusMeta[task.status];
                const suggested = task.suggestedStaffId ? staffById[task.suggestedStaffId] : undefined;

                return (
                  <li key={task.id}>
                    <div className={`rounded-lg border px-3 py-2 text-[11px] shadow-sm ${statusInfo.cardClass}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusInfo.pillClass}`}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="flex-1 min-w-0 text-gray-900 leading-tight font-medium">{task.description}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-gray-500">
                        <span className="truncate">{suggested?.name ?? 'Unassigned'}</span>
                        <Link
                          to={taskLink(task.id)}
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
};

export default GuestCard;

