"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sparkles, Loader2 } from "lucide-react";
import { useTripStore } from "@/store/tripStore";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function Home() {
  const router = useRouter();
  const { setTrip, setPrompt, isLoading, setIsLoading } = useTripStore();
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [landingInput, setLandingInput] = useState("");

  const handleGenerate = async (finalPrompt: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }

      const tripData = await res.json();
      setTrip(tripData);
      setPrompt(finalPrompt);
      router.push(`/trip/${tripData.trip_id}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "An unknown error occurred during generation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatComplete = (collectedData: any) => {
    const finalPrompt = `Plan a detailed trip with the following requirements:
- Location: ${collectedData.location}
- Family size: ${collectedData.familySize}
- Budget: ${collectedData.budget}
- Reason for trip: ${collectedData.reason}
- Travel preferences: ${collectedData.preferences}
- Dietary restrictions: ${collectedData.dietary}
- Dates/Duration: ${collectedData.dates}`;

    handleGenerate(finalPrompt);
  };

  const handleFirstPrompt = () => {
    const trimmed = landingInput.trim();
    if (!trimmed) return;
    setInitialPrompt(trimmed);
    setLandingInput("");
    setHasStartedChat(true);
  };

  return (
    <div className={`bg-background flex flex-col font-sans ${hasStartedChat ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Header />

      {!hasStartedChat ? (
        /* Landing: hero + input bar */
        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 lg:px-24 pt-24 pb-32">
          <div className="w-full max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-hover text-sm font-medium text-text-secondary mb-8">
              <Sparkles size={14} className="text-event-pilot-blue" />
              <span>Event Pilot AI</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-3 leading-tight">
              Your Intelligent Travel Planner
            </h1>
            <p className="text-base text-text-secondary mb-12 max-w-xl mx-auto">
              Describe your trip and we’ll build your itinerary.
            </p>

            <div className="w-full max-w-2xl mx-auto">
              <div className="relative flex items-center bg-surface-card border border-surface-hover rounded-xl px-4 py-3 hover:border-event-pilot-blue/40 transition-colors">
                <input
                  type="text"
                  value={landingInput}
                  onChange={(e) => setLandingInput(e.target.value)}
                  placeholder="e.g. 4-day foodie trip to Montreal, $2,000 budget, March 15th"
                  className="flex-1 bg-transparent text-foreground text-sm placeholder:text-text-tertiary focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleFirstPrompt()}
                />
                <span className="text-xs text-text-tertiary ml-2 flex-shrink-0">Enter to generate</span>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Full chat environment - fixed height so input stays anchored */
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ChatInterface
            initialPrompt={initialPrompt}
            onComplete={handleChatComplete}
            fullMode
          />
        </main>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-foreground gap-4">
          <Loader2 size={40} className="animate-spin text-event-pilot-blue" />
          <p className="text-sm text-text-secondary">Crafting your itinerary...</p>
        </div>
      )}
    </div>
  );
}
