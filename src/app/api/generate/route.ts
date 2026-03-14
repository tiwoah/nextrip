import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const ticketmasterKey = process.env.TICKETMASTER_API_KEY;
const aviationstackKey = process.env.AVIATIONSTACK_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Types for API responses
interface TicketmasterEvent {
  name: string;
  url: string;
  dates?: {
    start?: {
      localDate?: string;
    };
  };
}

interface AviationStackFlight {
  flight?: {
    iata?: string;
  };
  flight_status?: string;
}

// API helper functions
async function fetchTicketmasterEvents(city: string) {
  if (!ticketmasterKey) return [];
  try {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&apikey=${ticketmasterKey}&size=5`);
    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster API error:', error);
    return [];
  }
}

async function fetchFlights(departure: string, arrival: string) {
  if (!aviationstackKey) return [];
  try {
    const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${aviationstackKey}&dep_iata=${departure}&arr_iata=${arrival}&limit=5`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('AviationStack API error:', error);
    return [];
  }
}

const segmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    time: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["transport", "accommodation", "food", "attraction", "freetime", "shopping"] },
    title: { type: Type.STRING },
    location: { type: Type.STRING },
    description: { type: Type.STRING, nullable: true },
    cost: { type: Type.NUMBER, nullable: true },
    confirmationCode: { type: Type.STRING, nullable: true },
    travelModeToNext: { type: Type.STRING, enum: ["walk", "drive", "transit"], nullable: true },
    distanceToNext: { type: Type.STRING, nullable: true },
    coordinates: { 
      type: Type.ARRAY, 
      items: { type: Type.NUMBER }, 
      description: "[longitude, latitude]",
      nullable: true 
    },
    bookingUrl: { type: Type.STRING, nullable: true }
  },
  required: ["id", "time", "type", "title", "location"]
}

const daySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    dayLabel: { type: Type.STRING },
    dateStr: { type: Type.STRING },
    activitiesCount: { type: Type.INTEGER },
    segments: { type: Type.ARRAY, items: segmentSchema }
  },
  required: ["id", "dayLabel", "dateStr", "activitiesCount", "segments"]
}

const budgetCategorySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    allocated: { type: Type.NUMBER },
    spent: { type: Type.NUMBER },
    color: { type: Type.STRING }
  },
  required: ["category", "allocated", "spent", "color"]
}

const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      trip_id: { type: Type.STRING },
      title: { type: Type.STRING },
      dates: { type: Type.STRING },
      overview: {
        type: Type.OBJECT,
        properties: {
          total_days: { type: Type.INTEGER },
          total_budget: { type: Type.NUMBER },
          weather_summary: { type: Type.STRING }
        },
        required: ["total_days", "total_budget", "weather_summary"]
      },
      budget_categories: { type: Type.ARRAY, items: budgetCategorySchema },
      days: { type: Type.ARRAY, items: daySchema }
    },
    required: ["trip_id", "title", "dates", "overview", "budget_categories", "days"]
}

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    // Extract potential city/location from prompt (simple regex)
    const cityMatch = prompt.match(/\b(?:in|to|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i);
    const city = cityMatch ? cityMatch[1] : 'New York'; // default

    // Fetch API data
    const events = await fetchTicketmasterEvents(city);
    const flights = await fetchFlights('JFK', 'LAX'); // example, can parse from prompt

    const apiData = {
      events: events.map((e: TicketmasterEvent) => ({ name: e.name, url: e.url, date: e.dates?.start?.localDate })),
      flights: flights.map((f: AviationStackFlight) => ({ flight: f.flight?.iata, status: f.flight_status }))
    };

    const systemInstruction = `You are an expert travel planner AI. Based on the user's prompt, generate a realistic, complete, logically sequenced, and richly detailed trip itinerary. 
Ensure realistic pacing and travel times between locations. Keep budget constraints in mind.
Provide realistic longitudinal and latitudinal coordinates for each location in [lng, lat] format (important: longitude first, then latitude). If the activity is moving (like a flight), use the destination's coordinates. Use creative and suitable hex colors for budget_categories.

For bookable items (flights, events, restaurants, accommodations), provide a bookingUrl that links to the actual booking page. Use the provided API data to find real booking URLs where possible. For items that don't require booking (free activities, walking), omit the bookingUrl.

API Data: ${JSON.stringify(apiData)}`;

    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    if (response.text) {
        const tripData = JSON.parse(response.text);
        return NextResponse.json(tripData, { status: 200 });
    } else {
        throw new Error("Empty response from Gemini");
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: message || "Failed to generate trip" }, { status: 500 });
  }
}
