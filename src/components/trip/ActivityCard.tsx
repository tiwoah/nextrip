import React from 'react';
import { Plane, Utensils, BedDouble, ShoppingBag, Hourglass, Landmark } from 'lucide-react';
import { Button } from '../core/Button';
import { formatPrice } from '@/../lib/utils';

export type ActivityType = 'transport' | 'attraction' | 'food' | 'accommodation' | 'shopping' | 'freetime';

interface ActivityCardProps {
  type: ActivityType;
  title: string;
  time: string;
  location: string;
  description?: string;
  cost?: number;
  confirmationCode?: string;
  distance?: string;
  isActive?: boolean;
  bookingUrl?: string;
  currency?: string;
}

const typeConfig = {
  transport: { color: 'text-act-transport', bg: 'bg-act-transport/10', icon: Plane },
  attraction: { color: 'text-act-attraction', bg: 'bg-act-attraction/10', icon: Landmark },
  food: { color: 'text-act-food', bg: 'bg-act-food/10', icon: Utensils },
  accommodation: { color: 'text-act-accommodation', bg: 'bg-act-accommodation/10', icon: BedDouble },
  shopping: { color: 'text-act-shopping', bg: 'bg-act-shopping/10', icon: ShoppingBag },
  freetime: { color: 'text-act-freetime', bg: 'bg-act-freetime/10', icon: Hourglass },
};

export const ActivityCard = ({
  type,
  title,
  time,
  location,
  description,
  cost,
  confirmationCode,
  distance,
  isActive,
  bookingUrl,
  currency
}: ActivityCardProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`bg-surface-card rounded-[16px] p-5 transition-transform duration-200 hover:scale-[1.02] cursor-grab active:cursor-grabbing hover:shadow-md relative border border-transparent hover:border-event-pilot-blue/20 ${isActive ? 'ring-2 ring-event-pilot-blue/40' : ''}`}>
      
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
          <Icon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-[18px] font-medium leading-[1.1] text-foreground font-sans truncate pr-4">
              {title}
            </h3>
            {cost !== undefined && cost !== null && (
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {formatPrice(cost, currency)}
              </span>
            )}
          </div>
          
          <div className="text-sm text-text-secondary flex items-center gap-2 mb-2 font-mono">
            <span>{time}</span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary" />
            <span className="truncate">{location}</span>
          </div>

          {description && (
            <p className="text-base text-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {bookingUrl && (
            <div className="mb-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.open(bookingUrl, '_blank')}
              >
                Book Now
              </Button>
            </div>
          )}

          {/* Meta Footer */}
          {(confirmationCode || distance) && (
            <div className="flex items-center gap-4 text-xs text-text-secondary mt-3 pt-3 border-t border-gray-100">
              {confirmationCode && (
                <span className="flex items-center gap-1 text-success-green font-medium">
                  Confirmed: #{confirmationCode}
                </span>
              )}
              {distance && (
                <span className="flex items-center gap-1">
                  {distance} to next
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
