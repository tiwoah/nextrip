import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const ticketmasterKey = process.env.TICKETMASTER_API_KEY;
const aviationstackKey = process.env.AVIATION_API;

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
  name: "trip_itinerary",
  strict: true,
  schema: {
    type: "object",
    properties: {
      trip_id: { type: "string" },
      title: { type: "string" },
      dates: { type: "string" },
      overview: {
        type: "object",
        properties: {
          total_days: { type: "number" },
          total_budget: { type: "number" },
          weather_summary: { type: "string" }
        },
        required: ["total_days", "total_budget", "weather_summary"],
        additionalProperties: false
      },
      budget_categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            allocated: { type: "number" },
            spent: { type: "number" },
            color: { type: "string" }
          },
          required: ["category", "allocated", "spent", "color"],
          additionalProperties: false
        }
      },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            dayLabel: { type: "string" },
            dateStr: { type: "string" },
            activitiesCount: { type: "number" },
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  time: { type: "string" },
                  type: { type: "string", enum: ["transport", "accommodation", "food", "attraction", "freetime", "shopping"] },
                  title: { type: "string" },
                  location: { type: "string" },
                  description: { type: ["string", "null"] },
                  cost: { type: ["number", "null"] },
                  confirmationCode: { type: ["string", "null"] },
                  travelModeToNext: { type: ["string", "null"], enum: ["walk", "drive", "transit", null] },
                  distanceToNext: { type: ["string", "null"] },
                  coordinates: {
                    type: ["array", "null"],
                    items: { type: "number" },
                    description: "[longitude, latitude]"
                  },
                  bookingUrl: { type: ["string", "null"] }
                },
                required: ["id", "time", "type", "title", "location", "description", "cost", "confirmationCode", "travelModeToNext", "distanceToNext", "coordinates", "bookingUrl"],
                additionalProperties: false
              }
            }
          },
          required: ["id", "dayLabel", "dateStr", "activitiesCount", "segments"],
          additionalProperties: false
        }
      }
    },
    required: ["trip_id", "title", "dates", "overview", "budget_categories", "days"],
    additionalProperties: false
  }
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured in the environment." }, { status: 500 });
    }

    const baseURL = "https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1";
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    console.log("Generating trip for prompt:", prompt);

    const cityMatch = prompt.match(/\b(?:in|to|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i);
    const city = cityMatch ? cityMatch[1] : 'New York';

    const events = await fetchTicketmasterEvents(city);
    const flights = await fetchFlights('JFK', 'LAX');

    const apiData = {
      events: events.map((e: TicketmasterEvent) => ({ name: e.name, url: e.url, date: e.dates?.start?.localDate })),
      flights: flights.map((f: AviationStackFlight) => ({ flight: f.flight?.iata, status: f.flight_status }))
    };

    const systemInstruction = `You are an expert travel planner AI. Based on the user's prompt, generate a realistic, complete, logically sequenced, and richly detailed trip itinerary. 
Ensure realistic pacing and travel times between locations. Keep budget constraints in mind.
Provide realistic longitudinal and latitudinal coordinates for each location in [lng, lat] format (longitude first, then latitude). If the activity is moving (like a flight), use the destination's coordinates. Use creative and suitable hex colors for budget_categories.

For bookable items (flights, events, restaurants, accommodations), provide a bookingUrl that links to the actual booking page. Use the provided API data to find real booking URLs where possible. For items that don't require booking (free activities, walking), set bookingUrl to null.

API Data: ${JSON.stringify(apiData)}

CRITICAL: Your response must be a valid JSON object that strictly follows this schema:
${JSON.stringify(responseSchema.schema, null, 2)}`;

    console.log("Calling OpenAI with baseURL:", baseURL);
    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      console.log("OpenAI response received successfully.");
      const tripData = JSON.parse(content);
      return NextResponse.json(tripData, { status: 200 });
    } else {
      throw new Error("Empty response from OpenAI");
    }

  } catch (error) {
    console.error("AI Generation Error Detailed:", error);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("ENOTFOUND") || message.includes("ECONNREFUSED")) {
      const baseURL = "https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1";
      return NextResponse.json({
        error: `Could not connect to the AI server at ${baseURL}. Please ensure the baseURL is correct and the server is running.`
      }, { status: 502 });
    }

    return NextResponse.json({ error: message || "Failed to generate trip" }, { status: 500 });
  }
}
