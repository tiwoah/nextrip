"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTripStore } from "@/store/tripStore";
import { Button } from "@/components/core/Button";
import { Header } from "@/components/layout/Header";
import { ArrowUpRight, Trash2, Calendar, MapPin } from "lucide-react";

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
      <Header />
      
      <div className="mt-20 px-6 py-12 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground mb-4">Saved Plans</h1>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-foreground/30">Your curated collection of adventures.</p>
          </div>

          <main className="flex-1">
            {savedTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-8 py-32 border-2 border-dashed border-surface-hover rounded-[40px] bg-surface-card/30">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                    <Calendar className="text-foreground/20" size={32} />
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold tracking-tight text-foreground/40 mb-2">No saved plans yet</p>
                    <p className="text-sm text-foreground/20 font-medium">Start planning your dream trip today.</p>
                </div>
                <Button className="px-10" onClick={() => router.push('/')}>Create your first plan</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTrips.map((saved) => (
                  <div key={saved.id} className="group bg-white rounded-[32px] border border-surface-hover p-8 flex flex-col justify-between gap-8 transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-foreground/5">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                            <MapPin size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">
                            Saved {new Date(saved.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2 group-hover:text-foreground transition-colors line-clamp-1">
                        {saved.trip.title}
                      </h2>
                      <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2 mb-6">
                        <Calendar size={12} strokeWidth={2.5}/> {saved.trip.dates}
                      </p>
                      <p className="text-sm text-foreground/40 font-medium line-clamp-3 leading-relaxed">
                        {saved.prompt || "No prompt saved."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-surface-hover">
                      <Button
                        variant="primary"
                        onClick={() => openSavedTrip(saved)}
                        className="flex-1 !rounded-2xl"
                      >
                        Continue <ArrowUpRight size={14} className="ml-2" />
                      </Button>
                      <button
                        onClick={() => deleteSavedTrip(saved.id)}
                        className="p-3.5 rounded-2xl bg-foreground/5 text-foreground/20 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                        title="Delete Plan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
