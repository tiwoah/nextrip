'use client';

import { EarthGlobe } from '@/components/EarthGlobe';
import { EventCardList } from '@/components/EventCardList';
import { mockEvents } from '@/data/mockEvents';

export default function Home() {
  return (
    <div className="relative h-dvh w-screen bg-black text-white">
      <EarthGlobe phase="explore" />

      {/* Overlay: event cards on the left, non-blocking for the globe center */}
      <div className="pointer-events-none absolute inset-0">
        <EventCardList events={mockEvents} />
      </div>
    </div>
  );
}
