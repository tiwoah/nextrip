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
          { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Something went wrong."}` },
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
      const errorMessage = error instanceof Error ? error.message : "Could you try again?";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = fullMode
    ? "flex flex-col flex-1 min-h-0 w-full max-w-3xl mx-auto"
    : "w-full max-w-2xl mx-auto";
  const messagesClass = fullMode
    ? "flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-4 no-scrollbar"
    : "min-h-[280px] max-h-[400px] overflow-y-auto p-4 space-y-3 no-scrollbar";

  return (
    <div className={containerClass}>
      <div ref={scrollRef} className={messagesClass}>
        {messages.length === 0 && !initialPrompt && (
          <p className="text-text-tertiary text-sm">Start a conversation...</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-event-pilot-blue text-white rounded-br-md"
                  : "bg-surface-hover text-foreground rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-surface-hover">
              <Loader2 size={18} className="animate-spin text-text-tertiary" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 md:px-8 pb-6 bg-background border-t border-surface-hover">
        <div
          className={`flex items-center gap-2 bg-surface-card border border-surface-hover rounded-xl px-4 py-2.5 ${
            fullMode ? "max-w-3xl mx-auto" : ""
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isComplete ? "Planning your itinerary..." : "Message..."}
            disabled={isLoading || isComplete}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-text-tertiary focus:outline-none py-1"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isComplete}
            className="p-1.5 text-event-pilot-blue hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Send size={18} />
          </button>
        </div>
        {fullMode && (
          <p className="text-xs text-text-tertiary text-center mt-2">Enter to send</p>
        )}
      </div>
    </div>
  );
}
