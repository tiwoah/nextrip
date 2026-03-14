"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onComplete: (collectedData: any) => void;
}

export function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! I'm your Event-Pilot assistant. I'd love to help you plan an amazing trip. Where are you thinking of going, and who's coming along?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isComplete) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await res.json();
      
      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages([...newMessages, assistantMessage]);

      if (data.isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete(data.collectedData);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "I'm sorry, I encountered an error. Could you try saying that again?";
      setMessages([...newMessages, { role: "assistant", content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-surface-hover">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-event-pilot-blue text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Event-Pilot Concierge</h3>
            <p className="text-xs text-white/80">Online • Happy to help</p>
          </div>
        </div>
        {isComplete && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full text-xs font-medium"
          >
            <CheckCircle2 size={14} /> Ready to Generate
          </motion.div>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 no-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  m.role === "user" ? "bg-event-pilot-blue text-white" : "bg-white text-event-pilot-blue shadow-sm border border-surface-hover"
                }`}>
                  {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user" 
                    ? "bg-event-pilot-blue text-white rounded-tr-none" 
                    : "bg-white text-text-primary shadow-sm border border-surface-hover rounded-tl-none"
                }`}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white text-event-pilot-blue p-2 rounded-full shadow-sm border border-surface-hover">
              <Loader2 size={16} className="animate-spin" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-surface-hover">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isComplete ? "Planning your itinerary..." : "Type your message..."}
            disabled={isLoading || isComplete}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-surface-hover rounded-xl focus:outline-none focus:border-event-pilot-blue focus:ring-1 focus:ring-event-pilot-blue disabled:opacity-50 transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isComplete}
            className="absolute right-2 p-2 bg-event-pilot-blue text-white rounded-lg hover:bg-event-pilot-blue/90 disabled:opacity-50 disabled:hover:bg-event-pilot-blue transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
