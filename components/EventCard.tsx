'use client';

import { motion } from 'framer-motion';
import { Flame, Goal, CarFront, Trophy } from 'lucide-react';

import type { Event } from '@/data/mockEvents';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

type EventCardProps = {
  event: Event;
  onClick?: (event: Event) => void;
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const hoverTransition = {
  type: 'spring',
  stiffness: 20,
  damping: 20,
};

function getSportIcon(sport: Event['sport']) {
  switch (sport) {
    case 'f1':
      return <CarFront className="h-4 w-4 text-cyan-300" />;
    case 'worldcup':
      return <Goal className="h-4 w-4 text-emerald-300" />;
    case 'nba':
      return <Trophy className="h-4 w-4 text-orange-300" />;
    case 'boxing':
      return <Flame className="h-4 w-4 text-red-300" />;
    default:
      return null;
  }
}

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function EventCard({ event, onClick }: EventCardProps) {
  const handleClick = () => {
    onClick?.(event);
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{
        scale: 1.04,
        boxShadow: '0 20px 45px rgba(0,0,0,0.55)',
      }}
      //transition={hoverTransition}
      className="w-72 cursor-pointer"
      onClick={handleClick}
    >
      <Card
        className="w-full overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-zinc-900/70 via-zinc-900/40 to-zinc-800/70 text-white shadow-2xl backdrop-blur-xl"
        size="default"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                {getSportIcon(event.sport)}
              </div>
              <CardTitle className="text-sm font-semibold leading-snug">
                {event.name}
              </CardTitle>
            </div>
            {event.popularity && (
              <Badge
                variant="secondary"
                className="border border-orange-400/40 bg-orange-500/10 px-2 py-0 text-[10px] font-medium text-orange-200"
              >
                {event.popularity}
              </Badge>
            )}
          </div>
          <CardDescription className="mt-2 text-[11px] text-zinc-300">
            {formatDate(event.date)} • {event.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 text-[11px] text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
              Live soon
            </span>
            <span className="text-[10px] text-zinc-400">
              Tap to plan trip
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

