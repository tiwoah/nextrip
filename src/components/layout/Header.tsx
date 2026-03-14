"use client";

import { usePathname } from "next/navigation";
import { MapPin, Search, Clock, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useTripStore } from '@/store/tripStore';

export const Header = () => {
  const pathname = usePathname();
  const { currentTrip } = useTripStore();

  const showSearch = pathname !== "/";

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-surface-hover h-16 flex items-center justify-between px-6">
      
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-event-pilot-blue text-white flex items-center justify-center">
          <MapPin size={18} strokeWidth={2.5}/>
        </div>
        <span className="font-semibold text-lg tracking-tight text-foreground">Event Pilot AI</span>
      </div>

      {/* Middle: Search (Optional for Dashboard context) */}
      {showSearch && (
        <div className="hidden md:flex items-center max-w-md w-full mx-8">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-event-pilot-blue transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search destinations, activities..." 
              className="w-full bg-surface-card hover:bg-surface-hover focus:bg-white border focus:border-event-pilot-blue/50 border-transparent rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-text-tertiary"
            />
          </div>
        </div>
      )}

      {/* Right: Actions / Profile */}
      <div className="flex items-center gap-3 text-text-secondary">
        <Link href="/saved" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-event-pilot-blue/10 text-event-pilot-blue hover:bg-event-pilot-blue/20 transition-colors text-sm font-medium">
          <Bookmark size={14} /> Saved Plans
        </Link>
        {currentTrip && (
          <Link href={`/trip/${currentTrip.trip_id}`} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-event-pilot-blue/10 text-event-pilot-blue hover:bg-event-pilot-blue/20 transition-colors text-sm font-medium">
            <Clock size={14} /> Active Trip
          </Link>
        )}
      </div>

    </header>
  );
};
