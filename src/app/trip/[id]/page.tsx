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
           <Loader2 className="animate-spin text-event-pilot-blue w-8 h-8"/>
           Loading your personalized trip...
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
      
      {/* Secondary Contextual Navigation */}
      <div className="border-b border-surface-hover bg-white px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <button onClick={() => router.push('/')} className="text-sm text-text-tertiary hover:text-foreground flex items-center gap-1 transition-colors w-fit">
            <ChevronLeft size={16} /> Back to Planner
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            {currentTrip.title}
          </h1>
          <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <MapPin size={14} /> {currentTrip.overview.total_days} Days • {currentTrip.dates}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="flex gap-2">
            <input
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && updatePrompt.trim()) {
                  handleUpdatePlan();
                }
              }}
              className="w-[1018px] rounded-xl border border-surface-hover bg-surface-card px-3 py-2 text-sm text-foreground focus:border-event-pilot-blue focus:outline-none"
              placeholder="Update prompt (e.g. budget $1,200)"
            />
            <button
              onClick={handleUpdatePlan}
              disabled={isLoading || !updatePrompt.trim()}
              className="rounded-xl bg-event-pilot-blue px-3 py-2 text-sm font-semibold text-white disabled:bg-surface-hover"
            >
              {isLoading ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-surface-hover bg-surface-card flex-shrink-0">
         <DaySelector 
            days={currentTrip.days} 
            activeId={activeDay.id} 
            onSelect={(id) => setActiveDayId(id)} 
          />
      </div>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Budget + Timeline */}
        <div className="w-full lg:w-[600px] flex-shrink-0 flex flex-col border-r border-surface-hover bg-background">
          <div className="sticky top-0 z-20 bg-background border-b border-surface-hover px-6 py-4">
            <BudgetProgress 
              compact
              totalBudget={currentTrip.overview.total_budget}
              categories={categoriesForDisplay}
              spentSoFar={spentSoFar}
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-6">
              {/* Timeline Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground tracking-tight">{activeDay.dayLabel} Itinerary</h2>

              </div>

              {/* Timeline Component */}
              <Timeline 
                segments={activeDay.segments} 
                activeSegmentId={activeSegmentId}
                onSegmentSelect={setActiveSegmentId}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Map Container */}
        <div className="hidden lg:flex flex-1 relative bg-[#E5E9EC]">
          <MapView segments={activeDay.segments} />
        </div>

      </main>

      {/* Floating Save Button (always on top) */}
      <div className="fixed bottom-5 right-5 z-[9999]">
        <Button
          onClick={handleSaveAndViewSaved}
          disabled={!currentTrip}
          className="bg-event-pilot-blue text-white rounded-full px-4 py-2 shadow-lg hover:bg-event-pilot-blue/90"
        >
          <Bookmark size={16} className="mr-2" /> Save Plan
        </Button>
      </div>
    </div>
  );
}
