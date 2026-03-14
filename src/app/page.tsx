"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/core/Button";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useTripStore } from "@/store/tripStore";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function Home() {
  const router = useRouter();
  const { setTrip, setPrompt, isLoading, setIsLoading } = useTripStore();

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

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full text-center py-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-hover text-sm font-medium text-text-secondary mb-6">
          <Sparkles size={14} className="text-event-pilot-blue" />
          <span>Event Pilot AI v1.0</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
          Your Intelligent Travel Planner
        </h1>
        
        <p className="text-lg text-text-secondary mb-8 max-w-2xl leading-relaxed">
          Tell us about your next adventure, and we'll handle the rest.
        </p>

        {/* Chat Interface */}
        <div className="w-full max-w-2xl mb-12">
          <ChatInterface onComplete={handleChatComplete} />
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white gap-4">
            <Loader2 size={48} className="animate-spin text-event-pilot-blue" />
            <h2 className="text-2xl font-semibold">Crafting your perfect itinerary...</h2>
            <p className="opacity-80">This might take a minute</p>
          </div>
        )}

      </main>
    </div>
  );
}
