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
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsComponent segments={segments} />
      {features.map((seg, i) => {
        const icon = L.divIcon({
          html: `<div style="background-color: #0066FF; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${i + 1}</div>`,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        return (
          <Marker
            key={seg.id}
            position={[seg.coordinates![1], seg.coordinates![0]]}
            icon={icon}
          />
        );
      })}
    </MapContainer>
  );
}
