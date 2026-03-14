export interface TripSegment {
  id: string;
  time: string;
  type: "transport" | "accommodation" | "food" | "attraction" | "freetime" | "shopping";
  title: string;
  location: string;
  description?: string;
  cost?: number;
  confirmationCode?: string;
  travelModeToNext?: "walk" | "drive" | "transit";
  distanceToNext?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  bookingUrl?: string;
}

export interface TripDay {
  id: string;
  dayLabel: string;
  dateStr: string;
  activitiesCount: number;
  segments: TripSegment[];
}

export interface BudgetCategory {
  category: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface TripData {
  trip_id: string;
  title: string;
  dates: string;
  overview: {
    total_days: number;
    total_budget: number;
    weather_summary: string;
  };
  budget_categories: BudgetCategory[];
  days: TripDay[];
}
