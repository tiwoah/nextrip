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
    <div className={`bg-background text-foreground flex flex-col font-sans transition-colors duration-500 h-screen overflow-hidden`}>
      <Header />

      {!hasStartedChat ? (
        /* Landing: Bento-Grid style background + Premium Typography */
        <main className="relative flex-1 flex flex-col items-center justify-start pt-24 px-6 overflow-hidden">
          
          {/* Bento-style background visuals */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            {/* Top Right Floating Image - Pushed further out */}
            <div className="absolute top-[5%] -right-[15%] w-[320px] h-[400px] md:w-[420px] md:h-[520px] rounded-[48px] overflow-hidden border border-surface-hover shadow-2xl rotate-6 animate-float-slow opacity-60">
              <img src="/bento-1.png" alt="Travel" className="w-full h-full object-cover" />
            </div>

            {/* Middle Left Floating Image - Pushed further left */}
            <div className="absolute top-[50%] -left-[15%] w-[280px] h-[350px] md:w-[380px] md:h-[480px] rounded-[48px] overflow-hidden border border-surface-hover shadow-2xl -rotate-6 animate-float-medium opacity-60">
              <img src="/bento-2.png" alt="Travel" className="w-full h-full object-cover" />
            </div>

            {/* Bottom Right Floating Image - Pushed further right and down */}
            <div className="absolute bottom-[-15%] -right-[12%] w-[300px] h-[380px] md:w-[420px] md:h-[520px] rounded-[64px] overflow-hidden border border-surface-hover shadow-2xl rotate-12 animate-float-fast opacity-60">
              <img src="/bento-3.png" alt="Travel" className="w-full h-full object-cover" />
            </div>

            {/* Soft decorative gradients for texture */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-foreground/[0.02] blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-foreground/[0.01] blur-[150px] rounded-full"></div>
          </div>

          <div className="relative z-10 w-full max-w-5xl text-center mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 backdrop-blur-md border border-foreground/10 text-xs font-bold text-foreground/40 mb-8 uppercase tracking-[0.3em] fade-in-up">
              <Sparkles size={14} />
              <span>Personalized Exploration</span>
            </div>

            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-foreground mb-6 leading-[0.85] fade-in-up [animation-delay:200ms]">
              Refreshing<br />your exploration<br />of the world
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/40 mb-12 max-w-xl mx-auto font-medium leading-relaxed fade-in-up [animation-delay:400ms]">
              A bespoke AI travel companion that understands your taste, budget, and curiosity.
            </p>

            <div className="w-full max-w-2xl mx-auto fade-in-up [animation-delay:600ms]">
              <div className="relative flex items-center bg-surface-card backdrop-blur-3xl border border-surface-hover shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[32px] p-2 group transition-all hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.12)]">
                <input
                  type="text"
                  value={landingInput}
                  onChange={(e) => setLandingInput(e.target.value)}
                  placeholder="e.g. 4-day foodie trip to Montreal, $2,000 budget"
                  className="flex-1 bg-transparent px-8 py-5 text-foreground text-lg font-medium placeholder:text-foreground/20 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleFirstPrompt()}
                />
                <button
                  onClick={handleFirstPrompt}
                  className="bg-foreground text-background px-10 py-5 rounded-[24px] font-bold uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  Generate
                </button>
              </div>
              <p className="mt-6 text-foreground/20 text-[10px] font-bold uppercase tracking-[0.3em]">
                Press enter to begin your journey
              </p>
            </div>
          </div>
          
          {/* Spacer to push content up */}
          <div className="flex-1 min-h-[100px]"></div>
        </main>
      ) : (
        /* Original Chat Environment */
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden pt-16">
          <ChatInterface
            initialPrompt={initialPrompt}
            onComplete={handleChatComplete}
            fullMode
          />
        </main>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white gap-6">
          <Loader2 size={48} className="animate-spin" />
          <p className="text-sm font-bold uppercase tracking-[0.3em]">Crafting your itinerary...</p>
        </div>
      )}
    </div>
  );
}
