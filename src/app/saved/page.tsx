"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTripStore } from "@/store/tripStore";
import { Button } from "@/components/core/Button";
import { ArrowUpRight, Trash2 } from "lucide-react";

export default function SavedPlansPage() {
  const router = useRouter();
  const { savedTrips, loadSavedTrips, deleteSavedTrip, setTrip, setPrompt } = useTripStore();

  useEffect(() => {
    loadSavedTrips();
  }, [loadSavedTrips]);

  const openSavedTrip = (saved: typeof savedTrips[number]) => {
    setTrip(saved.trip);
    setPrompt(saved.prompt);
    router.push(`/trip/${saved.trip.trip_id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-surface-hover px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Saved Plans</h1>
          <p className="text-sm text-text-secondary mt-1">Pick a saved itinerary to continue planning.</p>
        </div>
      </div>

      <main className="flex-1 px-6 py-8">
        {savedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <p className="text-lg text-text-secondary">No saved plans yet.</p>
            <Button className="px-6" onClick={() => router.push('/')}>Create your first plan</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedTrips.map((saved) => (
              <div key={saved.id} className="bg-white rounded-2xl border border-surface-hover p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{saved.trip.title}</h2>
                      <p className="text-sm text-text-secondary mt-1">{saved.trip.dates}</p>
                    </div>
                    <p className="text-xs text-text-secondary">{new Date(saved.savedAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-text-secondary mt-3 line-clamp-2">{saved.prompt || "No prompt saved."}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="primary"
                    onClick={() => openSavedTrip(saved)}
                    className="min-w-[120px]"
                  >
                    Continue <ArrowUpRight size={16} className="ml-2" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => deleteSavedTrip(saved.id)}
                    className="min-w-[120px]"
                  >
                    Delete <Trash2 size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
