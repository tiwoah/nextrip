import { create } from 'zustand';
import { TripData } from '@/types/trip';

export interface SavedTrip {
  id: string;
  trip: TripData;
  prompt: string | null;
  savedAt: string;
}

const STORAGE_KEY = 'eventPilotSavedTrips';

const loadSavedTrips = (): SavedTrip[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTrip[];
  } catch {
    return [];
  }
};

const persistSavedTrips = (saved: SavedTrip[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // ignore
  }
};

interface TripState {
  currentTrip: TripData | null;
  currentPrompt: string | null;
  savedTrips: SavedTrip[];
  setTrip: (trip: TripData) => void;
  setPrompt: (prompt: string | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  saveCurrentTrip: () => void;
  deleteSavedTrip: (id: string) => void;
  loadSavedTrips: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  currentPrompt: null,
  savedTrips: [],
  setTrip: (trip) => set({ currentTrip: trip }),
  setPrompt: (prompt) => set({ currentPrompt: prompt }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  saveCurrentTrip: () => {
    const { currentTrip, currentPrompt, savedTrips } = get();
    if (!currentTrip) return;

    const newSaved: SavedTrip = {
      id: currentTrip.trip_id,
      trip: currentTrip,
      prompt: currentPrompt,
      savedAt: new Date().toISOString(),
    };

    const updated = [newSaved, ...savedTrips.filter((s) => s.id !== newSaved.id)];
    persistSavedTrips(updated);
    set({ savedTrips: updated });
  },
  deleteSavedTrip: (id) => {
    const { savedTrips } = get();
    const updated = savedTrips.filter((s) => s.id !== id);
    persistSavedTrips(updated);
    set({ savedTrips: updated });
  },
  loadSavedTrips: () => {
    const saved = loadSavedTrips();
    set({ savedTrips: saved });
  },
}));
