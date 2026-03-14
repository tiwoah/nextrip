'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Event } from '@/data/mockEvents';
import { EventCard } from '@/components/EventCard';

type EventCardListProps = {
  events: Event[];
  onEventClick?: (event: Event) => void;
};

export function EventCardList({ events, onEventClick }: EventCardListProps) {
  const VISIBLE_COUNT = 4;

  const [startIndex, setStartIndex] = useState(0);

  const total = events.length;
  const maxStartIndex =
    total > VISIBLE_COUNT ? Math.max(0, total - VISIBLE_COUNT) : 0;

  const visibleEvents = useMemo(() => {
    if (total <= VISIBLE_COUNT) return events;
    return events.slice(startIndex, startIndex + VISIBLE_COUNT);
  }, [events, startIndex, total]);

  const handleClick = useCallback(
    (event: Event) => {
      if (onEventClick) {
        onEventClick(event);
      } else {
        // Temporary placeholder action for debugging.
        // eslint-disable-next-line no-console
        console.log('Event clicked:', event);
      }
    },
    [onEventClick]
  );

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (total <= VISIBLE_COUNT) return;

    // Prevent page / globe scroll when interacting with the list.
    event.preventDefault();

    setStartIndex((current) => {
      if (event.deltaY > 0) {
        // Scroll down: move window forward, up to maxStartIndex.
        return Math.min(maxStartIndex, current + 1);
      }
      if (event.deltaY < 0) {
        // Scroll up: move window backward, down to 0.
        return Math.max(0, current - 1);
      }
      return current;
    });
  };

  const showGradients = total > VISIBLE_COUNT;
  const showTopGradient = showGradients && startIndex > 0;
  const showBottomGradient = showGradients && startIndex < maxStartIndex;

  return (
    <div className="absolute left-4 sm:left-8 lg:left-12 top-1/2 z-20 -translate-y-1/2 space-y-4 pointer-events-auto">
      <div
        className="relative flex w-[18rem] flex-col gap-3"
        onWheel={handleWheel}
      >
        {visibleEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={handleClick}
          />
        ))}

        {showTopGradient && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
        )}
        {showBottomGradient && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        )}
      </div>
    </div>
  );
}

