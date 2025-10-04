import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, RefObject, SetStateAction, UIEvent } from 'react';
import type { CalendarDay } from '@/types';

interface UseScrollSyncOptions {
  headerRef: RefObject<HTMLDivElement>;
  propertiesSidebarRef: RefObject<HTMLDivElement>;
  allDays: CalendarDay[];
  cellWidth: number;
  visibleMonthName: string;
  setVisibleMonthName: Dispatch<SetStateAction<string>>;
}

export function useScrollSync({
  headerRef,
  propertiesSidebarRef,
  allDays,
  cellWidth,
  visibleMonthName,
  setVisibleMonthName,
}: UseScrollSyncOptions) {
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (headerRef.current) {
          headerRef.current.scrollLeft = target.scrollLeft;
        }
        if (propertiesSidebarRef.current) {
          propertiesSidebarRef.current.scrollTop = target.scrollTop;
        }
      });

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const centerX = target.scrollLeft + target.clientWidth / 2;
        const centerDay = Math.floor(centerX / cellWidth);
        const visibleDay = allDays.find((day) => day.absoluteDay === centerDay);

        if (visibleDay && visibleDay.monthName !== visibleMonthName) {
          setVisibleMonthName(visibleDay.monthName);
        }
      }, 100);
    },
    [allDays, cellWidth, headerRef, propertiesSidebarRef, setVisibleMonthName, visibleMonthName],
  );

  return handleScroll;
}
