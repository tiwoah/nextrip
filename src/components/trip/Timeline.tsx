import React from 'react';
import { ActivityCard, ActivityType } from './ActivityCard';
import { TripSegment } from '@/types/trip';

interface TimelineProps {
  segments: TripSegment[];
  activeSegmentId?: string | null;
  onSegmentSelect?: (segmentId: string) => void;
  currency?: string;
}

export const Timeline = ({ segments, activeSegmentId, onSegmentSelect, currency }: TimelineProps) => {
  return (
    <div className="relative pl-32 py-6 pb-20 max-w-2xl">
      {/* Central vertical line */}
      <div className="absolute left-[92px] top-6 bottom-0 w-px bg-surface-hover z-0" />

      <div className="flex flex-col gap-8 relative z-10">
        {segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1;
          const isActive = activeSegmentId === segment.id;

          return (
            <div key={segment.id} className="relative group">
              {/* Time Label */}
              <div className="absolute -left-28 top-5 w-16 text-right">
                <span className="text-sm font-mono text-text-secondary font-medium tracking-tight">
                  {segment.time}
                </span>
              </div>

              {/* Node on timeline */}
              <div className="absolute -left-[30px] top-[26px] w-2.5 h-2.5 rounded-full bg-event-pilot-blue border-2 border-white ring-[4px] ring-white group-hover:ring-event-pilot-blue/20 transition-all z-20 shadow-sm" />

              {/* Card Content */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSegmentSelect?.(segment.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSegmentSelect?.(segment.id);
                  }
                }}
                className="w-full text-left pl-4 cursor-pointer"
              >
                <ActivityCard
                  type={segment.type as ActivityType}
                  title={segment.title}
                  location={segment.location}
                  time={segment.time}
                  description={segment.description}
                  cost={segment.cost}
                  confirmationCode={segment.confirmationCode}
                  isActive={isActive}
                  bookingUrl={segment.bookingUrl}
                  currency={currency || segment.currency}
                />
              </div>

              {/* Connector line for travel (if applicable) */}
              {!isLast && segment.travelModeToNext && (
                <div className="ml-10 mt-6 mb-2 flex items-center gap-3">
                  <div className={`h-px flex-1 ${segment.travelModeToNext === 'transit' || segment.travelModeToNext === 'walk' ? 'border-t-2 border-dotted border-surface-hover' : 'bg-surface-hover'}`} />
                  <span className="text-xs text-text-tertiary flex items-center font-mono uppercase tracking-wider">
                     {segment.travelModeToNext} {segment.distanceToNext && `• ${segment.distanceToNext}`}
                  </span>
                  <div className={`h-px flex-1 ${segment.travelModeToNext === 'transit' || segment.travelModeToNext === 'walk' ? 'border-t-2 border-dotted border-surface-hover' : 'bg-surface-hover'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
