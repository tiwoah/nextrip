export const mockTripData = {
  trip_id: "JAI-2026",
  title: "Kauai with Family",
  dates: "Mar 3-10",
  overview: {
    total_days: 7,
    total_budget: 3500,
    weather_summary: "Mostly sunny, 75-82°F"
  },
  budget_categories: [
    { category: "Flights", allocated: 1200, spent: 1200, color: "#475569" },
    { category: "Accommodation", allocated: 1000, spent: 850, color: "#8B5CF6" },
    { category: "Activities", allocated: 700, spent: 400, color: "#0D9488" },
    { category: "Food & Drink", allocated: 600, spent: 150, color: "#F97316" }
  ],
  days: [
    {
      id: "day-1",
      dayLabel: "Mon",
      dateStr: "12",
      activitiesCount: 3,
      segments: [
        {
          id: "seg-1",
          time: "09:00",
          type: "transport" as const,
          title: "SFO → LIH",
          location: "United 1234 • Gate B12",
          cost: 1200,
          confirmationCode: "H3K9M7",
          travelModeToNext: "drive" as const,
          distanceToNext: "15 min"
        },
        {
          id: "seg-2",
          time: "14:30",
          type: "accommodation" as const,
          title: "Check-in at Grand Hyatt",
          location: "Poipu, Kauai",
          description: "Early check-in requested and approved.",
          cost: 850,
          confirmationCode: "J5K2L1",
          travelModeToNext: "walk" as const,
          distanceToNext: "5 min"
        },
        {
          id: "seg-3",
          time: "18:00",
          type: "food" as const,
          title: "Dinner at Duke's",
          location: "Kalapaki Beach",
          description: "Seafood & steaks. Try the Hula Pie.",
          cost: 150
        }
      ]
    },
    {
      id: "day-2",
      dayLabel: "Tue",
      dateStr: "13",
      activitiesCount: 4,
      segments: [
         {
          id: "seg-4",
          time: "08:30",
          type: "food" as const,
          title: "Breakfast at Little Fish",
          location: "Poipu",
          travelModeToNext: "drive" as const,
          distanceToNext: "45 min"
        },
        {
          id: "seg-5",
          time: "10:00",
          type: "attraction" as const,
          title: "Waimea Canyon Lookout",
          location: "Waimea Canyon State Park",
          description: "The Grand Canyon of the Pacific. Beautiful morning light.",
          cost: 15,
          travelModeToNext: "drive" as const,
          distanceToNext: "30 min"
        },
        {
          id: "seg-6",
          time: "13:00",
          type: "freetime" as const,
          title: "Salt Pond Beach Park",
          location: "Eleele",
          description: "Protected baby beach, perfect for kids.",
        }
      ]
    }
  ]
};
