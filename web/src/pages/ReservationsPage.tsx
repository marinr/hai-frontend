import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import Panel from '@/components/Panel';
import MultiPropertyCalendar from '@/components/MultiPropertyCalendar';
import { fetchBookings, fetchListings } from '@/data/demoReservations';
import type { Booking, Listing } from '@/types';

const ReservationsPage: React.FC = () => {
  const auth = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = auth.user?.access_token;
        const [listingData, bookingData] = await Promise.all([fetchListings(token), fetchBookings(token)]);

        if (!active) {
          return;
        }

        setListings(listingData);
        setBookings(bookingData);
        setLoading(false);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        const message = fetchError instanceof Error ? fetchError.message : 'Failed to load reservations data.';
        setError(message);
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [auth.user?.access_token]);

  const handleBookingClick = useCallback((bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (booking) {
      alert(
        `Booking Details:\nGuest: ${booking.guestName}\nDates: ${booking.startDate} to ${booking.endDate}\nSource: ${booking.source}`,
      );
    }
  }, [bookings]);

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
        Loading reservations…
      </Panel>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <Panel padding={false} className="flex-1 overflow-hidden flex flex-col">
        <MultiPropertyCalendar
        listings={listings}
        bookings={bookings}
        onBookingClick={handleBookingClick}
        startYear={2020}
        startMonth={8}
        monthsToShow={12}
        showAgentPanel={false}
      />
      </Panel>
    </div>
  );
};

export default ReservationsPage;
