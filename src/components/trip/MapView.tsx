"use client";

import dynamic from 'next/dynamic';
import { TripSegment } from '@/types/trip';

// Must dynamically import Leaflet because it relies on the `window` object
const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#E5E9EC] animate-pulse flex items-center justify-center text-text-tertiary">
      Loading interactive map...
    </div>
  )
});

interface MapViewProps {
  segments: TripSegment[];
}

export function MapView({ segments }: MapViewProps) {
  return <Map segments={segments} />;
}
