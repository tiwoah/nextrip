"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onComplete: (collectedData: any) => void;
  initialPrompt?: string;
  fullMode?: boolean;
}

export function ChatInterface({ onComplete, initialPrompt, fullMode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasFetchedInitialRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    scrollToBottom();
    requestAnimationFrame(scrollToBottom);
  }, [messages, isLoading]);

  const fetchResponse = async (messagesToSend: Message[]) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messagesToSend }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to send message");
    }
    return res.json();
  };

  useEffect(() => {
    if (!initialPrompt || hasFetchedInitialRef.current) return;
    hasFetchedInitialRef.current = true;
    const userMsg: Message = { role: "user", content: initialPrompt };
    setMessages([userMsg]);
    setIsLoading(true);

    fetchResponse([userMsg])
      .then((data) => {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        if (data.isComplete) {
          setIsComplete(true);
          setTimeout(() => onComplete(data.collectedData), 1500);
        }
      })
      .catch((err) => {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `I encountered a small hiccup. Could you try that again?` },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [initialPrompt]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isComplete) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const data = await fetchResponse(newMessages);
      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.isComplete) {
        setIsComplete(true);
        setTimeout(() => onComplete(data.collectedData), 1500);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting. Let's try once more." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = "relative flex flex-col flex-1 min-h-0 w-full overflow-hidden";
  const contentClass = "flex-1 flex flex-col min-h-0 w-full max-w-2xl mx-auto px-6 z-10";
  const messagesClass = "flex-1 min-h-0 overflow-y-auto pt-24 pb-12 space-y-6 no-scrollbar";

  return (
    <div className={containerClass}>
      {/* Side-edge Bento Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-[15%] -left-[100px] w-[240px] h-[320px] rounded-[40px] overflow-hidden border border-surface-hover shadow-xl -rotate-6 animate-float-medium opacity-40 hover:opacity-100 transition-opacity">
          <img src="/bento-1.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-[20%] -right-[120px] w-[280px] h-[380px] rounded-[40px] overflow-hidden border border-surface-hover shadow-xl rotate-3 animate-float-slow opacity-40 hover:opacity-100 transition-opacity">
          <img src="/bento-2.png" alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className={contentClass}>
        <div ref={scrollRef} className={messagesClass}>
          {messages.length === 0 && !initialPrompt && (
            <div className="h-full flex items-center justify-center opacity-10">
              <p className="text-xl font-bold tracking-[0.3em] uppercase">Planning Mode</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-400 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-6 py-4 rounded-[24px] text-base font-medium leading-normal shadow-sm border ${
                  m.role === "user"
                    ? "bg-foreground text-background border-foreground rounded-br-md"
                    : "bg-surface-card text-foreground border-surface-hover rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="px-6 py-4 rounded-[24px] rounded-bl-md bg-surface-card border border-surface-hover flex items-center gap-1.5">
                <span className="w-1 h-1 bg-foreground/20 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-foreground/20 rounded-full animate-bounce delay-100"></span>
                <span className="w-1 h-1 bg-foreground/20 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-4 pb-12">
          <div className="relative group">
              <div className={`flex items-center gap-4 bg-white/80 backdrop-blur-2xl border border-surface-hover rounded-[24px] px-6 py-4 transition-all shadow-sm focus-within:shadow-md focus-within:scale-[1.005] ${isComplete ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder={isComplete ? "Success!" : "Your message..."}
                      disabled={isLoading || isComplete}
                      className="flex-1 bg-transparent text-foreground text-base font-medium placeholder:text-foreground/20 focus:outline-none"
                  />
                  <button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim() || isComplete}
                      className="p-2.5 bg-foreground text-background rounded-xl hover:opacity-90 active:scale-90 transition-all disabled:opacity-10"
                  >
                      <Send size={18} />
                  </button>
              </div>
              {!isComplete && (
                  <p className="text-center mt-6 text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/10">
                      Press Enter to Send
                  </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
