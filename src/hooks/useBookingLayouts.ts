import { useMemo } from 'react';
import type { Booking, BookingLayoutItem, Listing } from '@/types';

interface UseBookingLayoutsOptions {
  listings: Listing[];
  bookings: Booking[];
  dateIndexMap: Map<string, number>;
}

export function useBookingLayouts({
  listings,
  bookings,
  dateIndexMap,
}: UseBookingLayoutsOptions) {
  return useMemo(() => {
    const layouts = new Map<string, BookingLayoutItem[]>();

    listings.forEach((listing) => {
      const listingBookings: BookingLayoutItem[] = [];

      bookings
        .filter((booking) => booking.listingId === listing.id)
        .forEach((booking) => {
          const startDate = new Date(booking.startDate);
          const endDate = new Date(booking.endDate);

          const startKey = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}`;
          const endKey = `${endDate.getFullYear()}-${endDate.getMonth()}-${endDate.getDate()}`;

          const startDay = dateIndexMap.get(startKey);
          const endDay = dateIndexMap.get(endKey);

          if (startDay === undefined || endDay === undefined) {
            return;
          }

          const startOffset = startDate.getHours() >= 12 ? 0.5 : 0;
          const endOffset = endDate.getHours() >= 12 ? 0.5 : 0;

          const startCol = startDay + startOffset;
          const endCol = endDay + endOffset;
          const span = endCol - startCol;

          if (span > 0) {
            listingBookings.push({
              ...booking,
              startCol,
              span,
              offsetDays: Math.floor(startCol),
            });
          }
        });

      layouts.set(listing.id, listingBookings);
    });

    return layouts;
  }, [listings, bookings, dateIndexMap]);
}
