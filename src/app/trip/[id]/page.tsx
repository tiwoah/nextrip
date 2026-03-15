"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DaySelector } from "@/components/trip/DaySelector";
import { Timeline } from "@/components/trip/Timeline";
import { BudgetProgress } from "@/components/trip/BudgetProgress";
import { MapPin, ChevronLeft, Loader2, Bookmark } from "lucide-react";
import { useTripStore } from "@/store/tripStore";
import { MapView } from "@/components/trip/MapView";
import { Button } from "@/components/core/Button";

export default function TripDashboard() {
  const { currentTrip, currentPrompt, setTrip, setPrompt, isLoading, setIsLoading, saveCurrentTrip } = useTripStore();
  const router = useRouter();
  
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [updatePrompt, setUpdatePrompt] = useState<string>(currentPrompt || '');

  useEffect(() => {
    if (currentPrompt) setUpdatePrompt(currentPrompt);
  }, [currentPrompt]);

  useEffect(() => {
    if (!currentTrip) {
      router.push('/');
    }
  }, [currentTrip, router]);

  useEffect(() => {
    if (!currentTrip) return;

    if (!activeDayId && currentTrip.days?.length > 0) {
      setActiveDayId(currentTrip.days[0].id);
    }
  }, [currentTrip, activeDayId]);

  useEffect(() => {
    if (!currentTrip || !activeDayId) return;

    const activeDay = currentTrip.days.find((d) => d.id === activeDayId);
    if (activeDay && activeDay.segments.length > 0) {
      setActiveSegmentId(activeDay.segments[0].id);
    }
  }, [currentTrip, activeDayId]);

  const handleUpdatePlan = async () => {
    if (!updatePrompt.trim()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: updatePrompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      const tripData = await res.json();
      setTrip(tripData);
      setPrompt(updatePrompt);
      setActiveDayId(tripData.days?.[0]?.id ?? null);
      setActiveSegmentId(tripData.days?.[0]?.segments?.[0]?.id ?? null);
    } catch (error) {
      console.error(error);
      alert('Error updating trip. Make sure your prompt is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndViewSaved = () => {
    saveCurrentTrip();
    router.push('/saved');
  };

  if (!currentTrip || !activeDayId) {
    return (
      <div className="h-screen bg-background flex flex-col font-sans overflow-hidden">
        <Header />
        <div className="flex-1 flex text-text-secondary items-center justify-center flex-col gap-4">
           <Loader2 className="animate-spin text-foreground w-8 h-8"/>
           <p className="font-bold uppercase tracking-[0.3em] text-xs">Crafting your itinerary...</p>
        </div>
      </div>
    );
  }

  const activeDay = currentTrip.days.find(d => d.id === activeDayId) || currentTrip.days[0];

  const spentSoFar = (() => {
    const dayIndex = currentTrip.days.findIndex((d) => d.id === activeDayId);
    if (dayIndex === -1) return 0;

    const previousDaysCost = currentTrip.days
      .slice(0, dayIndex)
      .flatMap((d) => d.segments)
      .reduce((sum, s) => sum + (s.cost ?? 0), 0);

    const currentDay = currentTrip.days[dayIndex];
    const segIndex = currentDay.segments.findIndex((s) => s.id === activeSegmentId);
    const segmentsToSum = segIndex === -1 ? currentDay.segments : currentDay.segments.slice(0, segIndex + 1);

    const currentDayCost = segmentsToSum.reduce((sum, s) => sum + (s.cost ?? 0), 0);

    return previousDaysCost + currentDayCost;
  })();

  // Build per-category spends based on selected day/segment (for the budget sliders)
  const categorySpendMap = (() => {
    const map: Record<string, number> = {};
    currentTrip.budget_categories.forEach((cat) => {
      map[cat.category] = 0;
    });

    const inScopeSegments = (() => {
      const dayIndex = currentTrip.days.findIndex((d) => d.id === activeDayId);
      if (dayIndex === -1) return [];

      const prevSegments = currentTrip.days.slice(0, dayIndex).flatMap((d) => d.segments);
      const currentDay = currentTrip.days[dayIndex];
      const segIndex = currentDay.segments.findIndex((s) => s.id === activeSegmentId);
      const currentSegments = segIndex === -1 ? currentDay.segments : currentDay.segments.slice(0, segIndex + 1);

      return [...prevSegments, ...currentSegments];
    })();

    const findCategoryForSegment = (segmentType: string) => {
      const lower = segmentType.toLowerCase();
      const match = currentTrip.budget_categories.find((cat) =>
        cat.category.toLowerCase().includes(lower)
      );
      if (match) return match.category;

      const fallbackMap: Record<string, string> = {
        transport: 'Flights',
        accommodation: 'Accommodation',
        food: 'Food',
        attraction: 'Activities',
        shopping: 'Shopping',
        freetime: 'Activities',
      };

      const fallback = fallbackMap[lower];
      if (fallback) {
        const fMatch = currentTrip.budget_categories.find((cat) =>
          cat.category.toLowerCase().includes(fallback.toLowerCase())
        );
        if (fMatch) return fMatch.category;
      }

      return currentTrip.budget_categories[0]?.category ?? 'Other';
    };

    inScopeSegments.forEach((segment) => {
      const category = findCategoryForSegment(segment.type);
      map[category] = (map[category] ?? 0) + (segment.cost ?? 0);
    });

    return map;
  })();

  const categoriesForDisplay = currentTrip.budget_categories.map((cat) => ({
    ...cat,
    spent: categorySpendMap[cat.category] ?? cat.spent,
  }));

  return (
    <div className="h-screen bg-background flex flex-col font-sans overflow-hidden">
      <Header />
      
      {/* Secondary Contextual Navigation: Refined & Minimal */}
      <div className="mt-16 border-b border-surface-hover bg-white/80 backdrop-blur-md px-6 py-5 flex flex-col md:flex-row md:items-center justify-between z-10 flex-shrink-0 gap-4">
        <div className="flex flex-col gap-1.5">
          <button onClick={() => router.push('/')} className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground flex items-center gap-1 transition-colors w-fit mb-1">
            <ChevronLeft size={14} /> Back to Planner
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground leading-none">
                {currentTrip.title}
            </h1>
            <div className="px-3 py-1 rounded-full bg-foreground/5 border border-foreground/5 text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                {currentTrip.overview.total_days} Days
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2 mt-1">
            <MapPin size={12} strokeWidth={2.5}/> {currentTrip.dates}
          </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-surface-card border border-surface-hover rounded-2xl p-1.5 group transition-all focus-within:ring-2 focus-within:ring-foreground/5">
                <input
                value={updatePrompt}
                onChange={(e) => setUpdatePrompt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading && updatePrompt.trim()) {
                    handleUpdatePlan();
                    }
                }}
                className="w-full md:w-[320px] lg:w-[480px] bg-transparent px-4 py-2 text-sm font-medium text-foreground placeholder:text-foreground/30 focus:outline-none"
                placeholder="Modify your plan..."
                />
                <Button
                onClick={handleUpdatePlan}
                disabled={isLoading || !updatePrompt.trim()}
                className="rounded-xl px-5 py-2 !text-[10px]"
                >
                {isLoading ? 'Updating' : 'Update'}
                </Button>
            </div>
        </div>
      </div>

      <div className="px-6 py-2.5 border-b border-surface-hover bg-surface-card flex-shrink-0">
         <DaySelector 
            days={currentTrip.days} 
            activeId={activeDay.id} 
            onSelect={(id) => setActiveDayId(id)} 
          />
      </div>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Budget + Timeline */}
        <div className="w-full lg:w-[580px] flex-shrink-0 flex flex-col border-r border-surface-hover bg-background">
          <div className="bg-background border-b border-surface-hover px-6 py-5">
            <BudgetProgress 
              compact
              totalBudget={currentTrip.overview.total_budget}
              categories={categoriesForDisplay}
              spentSoFar={spentSoFar}
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-card/30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-foreground/30">{activeDay.dayLabel} Itinerary</h2>
              </div>

              <Timeline 
                segments={activeDay.segments} 
                activeSegmentId={activeSegmentId}
                onSegmentSelect={setActiveSegmentId}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Map Container */}
        <div className="hidden lg:flex flex-1 relative bg-[#F8F9FA]">
          <MapView segments={activeDay.segments} />
        </div>

      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={handleSaveAndViewSaved}
          disabled={!currentTrip}
          className="shadow-2xl px-6 py-4"
        >
          <Bookmark size={14} className="mr-2" /> Save Trip
        </Button>
      </div>
    </div>
  );
}
