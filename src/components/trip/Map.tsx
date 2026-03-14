"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import { TripSegment } from '@/types/trip';

function BoundsComponent({ segments }: { segments: TripSegment[] }) {
  const map = useMap();
  
  useEffect(() => {
    const features = segments.filter((s) => s.coordinates && s.coordinates.length === 2);
    if (features.length > 0) {
      const bounds = L.latLngBounds(features.map(f => [f.coordinates![1], f.coordinates![0]]));
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 14 });
    }
  }, [segments, map]);
  return null;
}

export default function Map({ segments }: { segments: TripSegment[] }) {
  const features = segments.filter((s) => s.coordinates && s.coordinates.length === 2);
  const initialLat = features[0]?.coordinates?.[1] || 37.7749;
  const initialLng = features[0]?.coordinates?.[0] || -122.4194;

  return (
    <MapContainer 
      center={[initialLat, initialLng]} 
      zoom={11} 
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <BoundsComponent segments={segments} />
      {features.map((seg, i) => {
        const iconHtml = `
          <div class="relative flex flex-col items-center">
            <div style="background-color: #0066FF" class="text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-md relative z-10">
              ${i + 1}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="#0066FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin" style="margin-top: -8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `;
        
        return (
          <Marker 
            key={seg.id} 
            position={[seg.coordinates![1], seg.coordinates![0]]}
            icon={L.divIcon({
              html: iconHtml,
              className: '',
              iconSize: [28, 40],
              iconAnchor: [14, 40]
            })}
          />
        );
      })}
    </MapContainer>
  );
}
