import React, { useCallback } from 'react';

import Panel from '@/components/Panel';
import MultiPropertyCalendar from '@/components/MultiPropertyCalendar';
import { DEMO_BOOKINGS, DEMO_LISTINGS } from '@/data/demoReservations';

const ReservationsPage: React.FC = () => {
  const handleBookingClick = useCallback((bookingId: string) => {
    const booking = DEMO_BOOKINGS.find((item) => item.id === bookingId);
    if (booking) {
      alert(
        `Booking Details:\nGuest: ${booking.guestName}\nDates: ${booking.startDate} to ${booking.endDate}\nSource: ${booking.source}`,
      );
    }
  }, []);

  return (
    <Panel padding={false} className="flex-1 overflow-hidden flex flex-col">
      <MultiPropertyCalendar
        listings={DEMO_LISTINGS}
        bookings={DEMO_BOOKINGS}
        onBookingClick={handleBookingClick}
        startYear={2020}
        startMonth={8}
        monthsToShow={12}
        showAgentPanel={false}
      />
    </Panel>
  );
};

export default ReservationsPage;
