import { useMemo } from 'react';
import type { CalendarDay, CalendarMonth } from '@/types';

interface CalendarConfig {
  startYear: number;
  startMonth: number;
  monthsToShow: number;
}

export function useCalendarDates({
  startYear,
  startMonth,
  monthsToShow,
}: CalendarConfig) {
  return useMemo(() => {
    const months: CalendarMonth[] = [];
    const days: CalendarDay[] = [];
    const dateIndexMap = new Map<string, number>();

    let dayOffset = 0;

    for (let i = 0; i < monthsToShow; i += 1) {
      const date = new Date(startYear, startMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      months.push({
        year,
        month,
        name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        daysInMonth,
        startDay: dayOffset,
      });

      for (let dayIdx = 0; dayIdx < daysInMonth; dayIdx += 1) {
        const currentDate = new Date(year, month, dayIdx + 1);
        const absoluteDay = dayOffset + dayIdx;
        const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;

        days.push({
          day: dayIdx + 1,
          date: currentDate,
          monthIdx: i,
          monthName: months[i].name,
          isFirstOfMonth: dayIdx === 0,
          isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
          isToday: currentDate.toDateString() === new Date().toDateString(),
          absoluteDay,
        });

        dateIndexMap.set(key, absoluteDay);
      }

      dayOffset += daysInMonth;
    }

    return {
      months,
      days,
      totalDays: dayOffset,
      dateIndexMap,
    };
  }, [startYear, startMonth, monthsToShow]);
}
