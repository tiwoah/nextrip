import React from 'react';

interface DayPill {
  id: string;
  dayLabel: string;
  dateStr: string;
  activitiesCount: number;
  theme?: string;
}

interface DaySelectorProps {
  days: DayPill[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const DaySelector = ({ days, activeId, onSelect }: DaySelectorProps) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex gap-3 p-1">
        {days.map((day) => {
          const isActive = day.id === activeId;
          return (
            <button
              key={day.id}
              onClick={() => onSelect(day.id)}
              className={`
                flex-shrink-0 h-[40px] px-6 rounded-full flex items-center gap-2 transition-all group
                ${isActive 
                  ? 'bg-event-pilot-blue text-white shadow-sm' 
                  : 'bg-surface-card text-text-secondary hover:bg-surface-hover hover:text-foreground'
                }
              `}
            >
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-foreground group-hover:text-foreground'}`}>
                {day.dayLabel} {day.dateStr}
              </span>
              <span className={`text-xs ${isActive ? 'text-white/80' : 'text-text-tertiary'}`}>
                {day.activitiesCount} act.
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
