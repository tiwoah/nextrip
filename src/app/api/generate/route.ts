import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const ticketmasterKey = process.env.TICKETMASTER_API_KEY;
const aviationstackKey = process.env.AVIATIONSTACK_API_KEY;

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

const responseSchema = {
  description: "Travel itinerary schema",
  type: SchemaType.OBJECT,
  properties: {
    trip_id: { type: SchemaType.STRING },
    title: { type: SchemaType.STRING },
    dates: { type: SchemaType.STRING },
    overview: {
      type: SchemaType.OBJECT,
      properties: {
        total_days: { type: SchemaType.NUMBER },
        total_budget: { type: SchemaType.NUMBER },
        weather_summary: { type: SchemaType.STRING }
      },
      required: ["total_days", "total_budget", "weather_summary"],
    },
    budget_categories: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          allocated: { type: SchemaType.NUMBER },
          spent: { type: SchemaType.NUMBER },
          color: { type: SchemaType.STRING }
        },
        required: ["category", "allocated", "spent", "color"],
      }
    },
    days: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          dayLabel: { type: SchemaType.STRING },
          dateStr: { type: SchemaType.STRING },
          activitiesCount: { type: SchemaType.NUMBER },
          segments: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                time: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                cost: { type: SchemaType.NUMBER },
                travelModeToNext: { type: SchemaType.STRING },
                distanceToNext: { type: SchemaType.STRING },
                coordinates: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.NUMBER },
                },
                bookingUrl: { type: SchemaType.STRING }
              },
              required: ["id", "time", "type", "title", "location", "description", "cost", "travelModeToNext", "distanceToNext", "coordinates", "bookingUrl"],
            }
          }
        },
        required: ["id", "dayLabel", "dateStr", "activitiesCount", "segments"],
      }
    },
    currency: { type: SchemaType.STRING }
  },
  required: ["trip_id", "title", "dates", "overview", "budget_categories", "days", "currency"],
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in the environment." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
      }
    });

    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    console.log("Generating trip with Gemini for prompt:", prompt);

    const cityMatch = prompt.match(/\b(?:in|to|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i);
    const city = cityMatch ? cityMatch[1] : 'New York';

    const events = await fetchTicketmasterEvents(city);
    const flights = await fetchFlights('JFK', 'LAX');

    const apiData = {
      events: events.map((e: TicketmasterEvent) => ({ name: e.name, url: e.url, date: e.dates?.start?.localDate })),
      flights: flights.map((f: AviationStackFlight) => ({ flight: f.flight?.iata, status: f.flight_status }))
    };

    const systemInstruction = `You are an expert travel planner AI. Generate a realistic, logically sequenced trip itinerary in RAW JSON.

CRITICAL:
- Use "days" for the itinerary array.
- "currency" at the top level is MANDATORY. **Default to "CAD"** unless a specific local currency is more appropriate for the destination (e.g. "VND" for Vietnam, "EUR" for France).
- Each day MUST have "id", "dayLabel", "dateStr", "activitiesCount", and "segments".
- Each segment MUST have "id", "time", "type", "title", "location", "description", "cost", "travelModeToNext", "distanceToNext", "coordinates", "bookingUrl".
- Segment types must be one of: "transport", "accommodation", "food", "attraction", "freetime", "shopping".

API Data with pre-verified booking URLs: ${JSON.stringify(apiData)}
CRITICAL: If an event from Ticketmaster or a flight from AviationStack is relevant to a segment, use its provided URL in "bookingUrl". DO NOT hallucinate links. If no API data matches, leave "bookingUrl" as null.`;

    const result = await model.generateContent([
      { text: systemInstruction },
      { text: prompt }
    ]);

    const response = await result.response;
    const content = response.text();

    if (content) {
      console.log("Gemini response received successfully.");
      try {
        const tripData = JSON.parse(content);
        return NextResponse.json(tripData, { status: 200 });
      } catch (parseError) {
        console.error("JSON Parse Error in Generation. Content received:", content);
        return NextResponse.json({ 
          error: "Failed to parse generated itinerary as JSON.",
          details: content.length > 200 ? content.substring(0, 200) + "..." : content
        }, { status: 500 });
      }
    } else {
      throw new Error(`Empty response from Gemini during generation.`);
    }

  } catch (error) {
    console.error("Gemini Generation Error Detailed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Failed to generate trip" }, { status: 500 });
  }
}
