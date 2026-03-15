"use client";

import { usePathname } from "next/navigation";
import { MapPin, Search, Clock, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useTripStore } from '@/store/tripStore';

export const Header = () => {
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${isHome ? "bg-transparent py-4" : "bg-background/80 backdrop-blur-md border-b border-surface-hover py-3"} px-6 flex items-center justify-between`}>
      
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 group translate-x-[-180px]">
        <div className="h-10 transition-transform group-hover:scale-105 translate-y-[5px] translate-x-[20px] ml-[142px]">
          <img 
            src="/nextrip logo.png" 
            alt="NexTrip Logo" 
            className="h-full w-auto object-contain"
          />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">NexTrip</span>
      </Link>

      {/* Right: Actions / Profile */}
      <div className="flex items-center gap-3">
        <Link 
          href="/saved" 
          className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground/5 backdrop-blur-2xl border border-foreground/10 hover:bg-foreground/10 transition-all text-sm font-bold text-foreground shadow-sm hover:shadow-md"
        >
          <Bookmark size={14} className="transition-transform group-hover:scale-110" /> 
          <span>Saved Plans</span>
        </Link>
      </div>

    </header>
  );
};
