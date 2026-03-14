"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/core/Button";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useTripStore } from "@/store/tripStore";

export default function Home() {
  const [prompt, setLocalPrompt] = useState("");
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();
  const { setTrip, setPrompt, isLoading, setIsLoading } = useTripStore();

  const resizePromptTextarea = () => {
    if (!promptRef.current) return;
    const textarea = promptRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    resizePromptTextarea();
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }
      
      const tripData = await res.json();
      setTrip(tripData);
      setPrompt(prompt);
      router.push(`/trip/${tripData.trip_id}`);
    } catch (error) {
      console.error(error);
      alert("Error generating trip. Please make sure GEMINI_API_KEY is configured.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full text-center py-20">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-hover text-sm font-medium text-text-secondary mb-8">
          <Sparkles size={14} className="text-event-pilot-blue" />
          <span>Event Pilot AI v1.0</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
          Your Intelligent Travel Planner<br className="hidden md:block"/>
        </h1>
        
        <p className="text-xl text-text-secondary mb-12 max-w-2xl leading-relaxed">
          Seamlessly plan your next vacation, trip, or event with Event Pilot AI
        </p>

        {/* Input Area Mockup */}
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl shadow-event-pilot-blue/5 border border-surface-hover p-2 mb-16 transition-shadow hover:shadow-2xl hover:shadow-event-pilot-blue/10">
          <div className="relative">
            <textarea 
              ref={promptRef}
              value={prompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                resizePromptTextarea();
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full bg-surface-card rounded-xl p-6 pb-24 text-lg outline-none resize-none placeholder:text-text-tertiary focus:bg-white transition-colors min-h-[120px] leading-relaxed disabled:opacity-50"
              style={{ overflow: 'hidden' }}
              placeholder={"e.g. \"I want a relaxing 4-day foodie trip to Montreal with my partner, focusing on hidden gems, starting March 15th. Our budget is around $2,000.\""}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <span className="text-xs text-text-tertiary font-medium hidden sm:block">Enter to generate</span>
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading || !prompt.trim()}
                className="rounded-xl px-6 min-w-[160px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Plan <ArrowRight size={16} className="ml-2"/>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
