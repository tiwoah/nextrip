export type Sport = 'f1' | 'nba' | 'worldcup' | 'boxing';

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  sport: Sport;
  popularity?: string;
  coordinates: [number, number];
}

export const mockEvents: Event[] = [
  {
    id: 'f1-monaco-2025',
    name: 'F1 Monaco Grand Prix',
    date: '2025-05-23T00:00:00Z',
    location: 'Monte Carlo, Monaco',
    sport: 'f1',
    popularity: '🔥 Hot',
    coordinates: [7.4216, 43.7384],
  },
  {
    id: 'worldcup-final-2026',
    name: 'FIFA World Cup 2026 Final',
    date: '2026-07-19T00:00:00Z',
    location: 'MetLife Stadium, USA',
    sport: 'worldcup',
    popularity: '⭐ Premium',
    coordinates: [-74.0745, 40.8136],
  },
  {
    id: 'nba-finals-game7',
    name: 'NBA Finals Game 7',
    date: '2025-06-18T00:00:00Z',
    location: 'Los Angeles, USA',
    sport: 'nba',
    popularity: '🔥 Hot',
    coordinates: [-118.2673, 34.043],
  },
  {
    id: 'boxing-vegas-title-fight',
    name: 'World Heavyweight Title Fight',
    date: '2025-11-08T00:00:00Z',
    location: 'Las Vegas, USA',
    sport: 'boxing',
    popularity: '💎 Exclusive',
    coordinates: [-115.1728, 36.1147],
  },
  {
    id: 'ucl-final-2025',
    name: 'UEFA Champions League Final 2025',
    date: '2025-05-31T00:00:00Z',
    location: 'Munich, Germany',
    sport: 'worldcup',
    popularity: '🔥 Hot',
    coordinates: [11.6247, 48.2188],
  },
  {
    id: 'f1-singapore-night',
    name: 'F1 Singapore Grand Prix',
    date: '2025-09-21T00:00:00Z',
    location: 'Singapore',
    sport: 'f1',
    popularity: 'Trending',
    coordinates: [103.8605, 1.2914],
  },
];

