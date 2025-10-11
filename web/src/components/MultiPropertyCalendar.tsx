import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';

import type {
  Booking,
  BookingLayoutItem,
  CalendarDay,
  CalendarMonth,
  Listing,
} from '@/types';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useCalendarDates } from '@/hooks/useCalendarDates';
import { useBookingLayouts } from '@/hooks/useBookingLayouts';
import { useScrollSync } from '@/hooks/useScrollSync';
import AgentChatPanel from '@/components/AgentChatPanel';
import { CHANNEL_COLOR_HEX } from '@/utils/channelColors';

export interface MultiPropertyCalendarProps {
  listings: Listing[];
  bookings: Booking[];
  onBookingClick?: (bookingId: string) => void;
  cellWidth?: number;
  rowHeight?: number;
  startYear?: number;
  startMonth?: number;
  monthsToShow?: number;
  showPropertiesPanel?: boolean;
  selectedDate?: Date;
  onDaySelect?: (day: CalendarDay) => void;
  showAgentPanel?: boolean;
}

const AgentPanel = React.memo(function AgentPanel({
  isOpen,
  onToggle,
  onClose,
  messages,
  agentInput,
  onAgentInputChange,
  onSendMessage,
  messagesEndRef,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  messages: ReturnType<typeof useAgentChat>['messages'];
  agentInput: string;
  onAgentInputChange: ReturnType<typeof useAgentChat>['setAgentInput'];
  onSendMessage: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex bg-white border-r border-gray-200 flex-shrink-0">
      {isOpen && (
        <AgentChatPanel
          className="w-96"
          messages={messages}
          agentInput={agentInput}
          onAgentInputChange={onAgentInputChange}
          onSendMessage={onSendMessage}
          messagesEndRef={messagesEndRef}
          onClose={onClose}
        />
      )}

      <button
        onClick={onToggle}
        className={`w-12 flex items-center justify-center hover:bg-gray-50 transition-colors ${
          isOpen ? 'bg-blue-50' : ''
        }`}
        title="Agent Assistant"
      >
        <div className="transform -rotate-90 whitespace-nowrap text-sm font-medium text-gray-700">
          Agent
        </div>
      </button>
    </div>
  );
});

const PropertiesPanel = React.memo(function PropertiesPanel({
  isOpen,
  onToggle,
  listings,
  rowHeight,
  sidebarRef,
}: {
  isOpen: boolean;
  onToggle: () => void;
  listings: Listing[];
  rowHeight: number;
  sidebarRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex bg-white border-r border-gray-200 flex-shrink-0">
      <div className={`flex flex-col transition-all ${isOpen ? 'w-72' : 'w-16'}`}>
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
          {isOpen ? (
            <>
              <span className="font-semibold text-gray-700">
                Properties ({listings.length})
              </span>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Collapse Properties"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="w-full h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Expand Properties"
            >
              <Menu className="w-4 h-4 text-gray-700" />
            </button>
          )}
        </div>
        <div
          ref={sidebarRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {listings.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-xs">
              {isOpen ? 'No properties found' : 'None'}
            </div>
          ) : (
            listings.map((listing) => (
              <div
                key={listing.id}
                className="border-b border-gray-200 flex items-center"
                style={{ minHeight: `${rowHeight}px`, height: `${rowHeight}px` }}
              >
                {isOpen ? (
                  <div className="flex-1 min-w-0 px-4 py-3">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {listing.name}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center" title={listing.name}>
                    <div className="transform -rotate-90 whitespace-nowrap text-xs font-medium text-gray-600">
                      {listing.name.substring(0, 3)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

const TimelineHeader = React.memo(function TimelineHeader({
  days,
  cellWidth,
  headerRef,
  onDaySelect,
  selectedDate,
}: {
  days: CalendarDay[];
  cellWidth: number;
  headerRef: React.RefObject<HTMLDivElement>;
  onDaySelect?: (day: CalendarDay) => void;
  selectedDate?: Date;
}) {
  const selectedKey = selectedDate?.toDateString();

  return (
    <div
      ref={headerRef}
      className="h-14 bg-white border-b border-gray-200 overflow-x-auto overflow-y-hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div style={{ width: `${days.length * cellWidth}px` }} className="flex h-full">
        {days.map((day, idx) => {
          const isSelected = !!selectedKey && day.date.toDateString() === selectedKey;
          const commonClasses = `flex flex-col items-center justify-center border-r border-gray-100 flex-shrink-0 ${
            day.isToday ? 'bg-blue-50' : ''
          } ${day.isFirstOfMonth ? 'border-l-2 border-l-gray-400' : ''} ${
            isSelected ? 'bg-blue-100/80 border-b-2 border-b-blue-500' : ''
          }`;

          const labelClasses = `text-xs font-medium ${
            day.isToday || isSelected ? 'text-blue-600' : 'text-gray-500'
          }`;
          const dayClasses = `text-sm font-semibold ${
            day.isToday || isSelected ? 'text-blue-600' : 'text-gray-900'
          }`;

          const content = (
            <>
              <div className={labelClasses}>
                {day.isFirstOfMonth
                  ? day.date.toLocaleDateString('en-US', { month: 'short' })
                  : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={dayClasses}>{day.day}</div>
            </>
          );

          if (onDaySelect) {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onDaySelect(day)}
                className={`${commonClasses} transition-colors focus:outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0`}
                style={{ width: `${cellWidth}px` }}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={idx} className={commonClasses} style={{ width: `${cellWidth}px` }}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const ListingsGrid = React.memo(function ListingsGrid({
  listings,
  bookingLayouts,
  months,
  backgroundStyle,
  cellWidth,
  rowHeight,
  totalDays,
  onHover,
  onLeave,
  onBookingClick,
  getSourceColor,
  onScroll,
  containerRef,
}: {
  listings: Listing[];
  bookingLayouts: Map<string, BookingLayoutItem[]>;
  months: CalendarMonth[];
  backgroundStyle: React.CSSProperties;
  cellWidth: number;
  rowHeight: number;
  totalDays: number;
  onHover: (bookingId: string, target: HTMLButtonElement) => void;
  onLeave: () => void;
  onBookingClick?: (bookingId: string) => void;
  getSourceColor: (source: string) => string;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}) {
  if (listings.length === 0) {
    return (
      <div className="flex-1 overflow-auto" onScroll={onScroll} ref={containerRef}>
        <div className="p-8 text-center text-gray-500">No properties match your search</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" onScroll={onScroll} ref={containerRef}>
      <div style={{ width: `${totalDays * cellWidth}px` }}>
        {listings.map((listing) => {
          const listingBookings = bookingLayouts.get(listing.id) || [];

          return (
            <div
              key={listing.id}
              className="relative border-b border-gray-200"
              style={{ height: `${rowHeight}px`, ...backgroundStyle }}
            >
              {months.map((month, idx) => (
                <div
                  key={`${listing.id}-${idx}`}
                  className="absolute top-0 bottom-0 border-l-2 border-l-gray-400 pointer-events-none"
                  style={{ left: `${month.startDay * cellWidth}px` }}
                />
              ))}

              {listingBookings.map((booking) => {
                const left = booking.startCol * cellWidth + 2;
                const width = booking.span * cellWidth - 4;
                const backgroundColor = getSourceColor(booking.source);

                return (
                  <button
                    key={booking.id}
                    className="absolute flex items-center gap-1.5 px-2 py-1.5 text-white rounded-xl shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      left: `${left}px`,
                      top: '8px',
                      width: `${width}px`,
                      minWidth: '60px',
                      backgroundColor,
                    }}
                    onClick={() => onBookingClick?.(booking.id)}
                    onMouseEnter={(event) => onHover(booking.id, event.currentTarget)}
                    onMouseLeave={onLeave}
                  >
                    <div className="w-6 h-6 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {booking.guestName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium truncate flex-1">
                      {booking.guestName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const MultiPropertyCalendar: React.FC<MultiPropertyCalendarProps> = ({
  listings,
  bookings,
  onBookingClick,
  cellWidth = 44,
  rowHeight = 64,
  startYear = 2020,
  startMonth = 8,
  monthsToShow = 12,
  showPropertiesPanel = true,
  selectedDate,
  onDaySelect,
  showAgentPanel = true,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const propertiesSidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(showPropertiesPanel);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [visibleMonthName, setVisibleMonthName] = useState('');

  const { messages, agentInput, setAgentInput, handleSendMessage, messagesEndRef } = useAgentChat();

  useEffect(() => {
    if (!showPropertiesPanel) {
      setIsPropertiesOpen(false);
    }
  }, [showPropertiesPanel]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const query = searchQuery.toLowerCase();
    return listings.filter((listing) => listing.name.toLowerCase().includes(query));
  }, [listings, searchQuery]);

  const { months, days, totalDays, dateIndexMap } = useCalendarDates({
    startYear,
    startMonth,
    monthsToShow,
  });

  const bookingLayouts = useBookingLayouts({
    listings: filteredListings,
    bookings,
    dateIndexMap,
  });

  const handleScroll = useScrollSync({
    headerRef,
    propertiesSidebarRef,
    allDays: days,
    cellWidth,
    visibleMonthName,
    setVisibleMonthName,
  });

  useEffect(() => {
    if (!timelineRef.current || days.length === 0) {
      return;
    }

    const target = selectedDate ?? new Date();
    const key = `${target.getFullYear()}-${target.getMonth()}-${target.getDate()}`;
    const index = dateIndexMap.get(key);

    if (index === undefined) {
      return;
    }

    const container = timelineRef.current;
    const desiredScrollLeft = index * cellWidth - container.clientWidth / 2;
    const nextScrollLeft = Math.max(0, desiredScrollLeft);

    container.scrollLeft = nextScrollLeft;

    if (headerRef.current) {
      headerRef.current.scrollLeft = nextScrollLeft;
    }

    const matchingDay = days.find((day) => day.date.toDateString() === target.toDateString());
    if (matchingDay) {
      setVisibleMonthName(matchingDay.monthName);
    }
  }, [cellWidth, dateIndexMap, days, selectedDate, setVisibleMonthName]);

  const getSourceColor = useCallback((source: string) => CHANNEL_COLOR_HEX(source), []);

  useEffect(() => {
    if (days.length > 0 && !visibleMonthName) {
      setVisibleMonthName(days[0].monthName);
    }
  }, [days, visibleMonthName]);

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `repeating-linear-gradient(
        to right,
        #f3f4f6 0px,
        #f3f4f6 ${cellWidth}px,
        #ffffff ${cellWidth}px,
        #ffffff ${cellWidth * 2}px
      )`,
      backgroundSize: `${cellWidth * 7}px 100%`,
    }),
    [cellWidth],
  );

  const handleBookingHover = useCallback((bookingId: string, target: HTMLButtonElement) => {
    setHoveredBooking(bookingId);
    const rect = target.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  }, []);

  const handleBookingLeave = useCallback(() => {
    setHoveredBooking(null);
    setTooltipPos(null);
  }, []);

  const tooltipBooking = useMemo(() => {
    if (!hoveredBooking) return null;
    const booking = bookings.find((item) => item.id === hoveredBooking);
    if (!booking) return null;
    const listing = listings.find((item) => item.id === booking.listingId);
    if (!listing) return null;
    return { booking, listing };
  }, [bookings, hoveredBooking, listings]);

  return (
    <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-700">{visibleMonthName}</span>
        </div>

        <div className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showAgentPanel && (
          <AgentPanel
            isOpen={isAgentOpen}
            onToggle={() => setIsAgentOpen((prev) => !prev)}
            onClose={() => setIsAgentOpen(false)}
            messages={messages}
            agentInput={agentInput}
            onAgentInputChange={setAgentInput}
            onSendMessage={handleSendMessage}
            messagesEndRef={messagesEndRef}
          />
        )}

        {showPropertiesPanel && (
          <PropertiesPanel
            isOpen={isPropertiesOpen}
            onToggle={() => setIsPropertiesOpen((prev) => !prev)}
            listings={filteredListings}
            rowHeight={rowHeight}
            sidebarRef={propertiesSidebarRef}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <TimelineHeader
            days={days}
            cellWidth={cellWidth}
            headerRef={headerRef}
            onDaySelect={onDaySelect}
            selectedDate={selectedDate}
          />

          <ListingsGrid
            listings={filteredListings}
            bookingLayouts={bookingLayouts}
            months={months}
            backgroundStyle={backgroundStyle}
            cellWidth={cellWidth}
            rowHeight={rowHeight}
            totalDays={totalDays}
            onHover={handleBookingHover}
            onLeave={handleBookingLeave}
            onBookingClick={onBookingClick}
            getSourceColor={getSourceColor}
            onScroll={handleScroll}
            containerRef={timelineRef}
          />
        </div>
      </div>

      {tooltipBooking && tooltipPos && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg shadow-xl px-3 py-2 pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">{tooltipBooking.listing.name}</div>
          <div className="text-gray-300">Guest: {tooltipBooking.booking.guestName}</div>
          <div className="text-gray-300">
            {new Date(tooltipBooking.booking.startDate).toLocaleDateString()} -{' '}
            {new Date(tooltipBooking.booking.endDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-300">Source:</span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getSourceColor(tooltipBooking.booking.source) }}
            />
            <span className="capitalize text-gray-300">{tooltipBooking.booking.source}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiPropertyCalendar;
