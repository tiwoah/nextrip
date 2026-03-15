import OpenAI from 'openai';
import { NextResponse } from 'next/server';

import { findBookingLink } from '@/lib/google-search';

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
      },
      currency: { type: "string", description: "The currency symbol or 3-letter code (e.g. CAD, $, EUR, £, VND). Default to 'CAD' if not specified." }
    },
    required: ["trip_id", "title", "dates", "overview", "budget_categories", "days", "currency"],
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

    const systemInstruction = `You are an expert travel planner AI. Generate a realistic, logically sequenced trip itinerary in RAW JSON.
Everything MUST be within a single JSON object.

CRITICAL: All string values MUST be enclosed in double quotes. Never output unquoted text (e.g. use "description": "Some text" not "description": Some text).

CRITICAL JSON STRUCTURE:
- Use "days" for the itinerary array.
- "currency" at the top level is MANDATORY. **Default to "CAD"** unless a specific local currency is more appropriate for the destination (e.g. "VND" for Vietnam, "EUR" for France).
- Each day MUST have "id", "dayLabel", "dateStr", "activitiesCount", and "segments".
- Each segment MUST have "id", "time", "type", "title", "location", "description", "cost", "confirmationCode", "travelModeToNext", "distanceToNext", "coordinates", "bookingUrl". Segment-level "currency" is optional.
- Detect the appropriate currency based on the destination, but **default everything to CAD** ($CAD) if in doubt or if no specific currency is requested.

EXAMPLE STRUCTURE:
{
  "trip_id": "paris-trip",
  "title": "3 Days in Paris",
  "dates": "Aug 10-12, 2026",
  "currency": "CAD",
  "overview": { "total_days": 3, "total_budget": 1000, "weather_summary": "Sunny" },
  "budget_categories": [{ "category": "Food", "allocated": 300, "spent": 0, "color": "#FF5733" }],
  "days": [
    {
      "id": "day-1",
      "dayLabel": "Day 1",
      "dateStr": "Monday, Aug 10",
      "activitiesCount": 1,
      "segments": [{
        "id": "seg-1",
        "time": "09:00 AM",
        "type": "attraction",
        "title": "Eiffel Tower",
        "location": "Paris",
        "description": "Visit the icon.",
        "cost": 25,
        "confirmationCode": null,
        "travelModeToNext": "walk",
        "distanceToNext": "500m",
        "coordinates": [2.2945, 48.8584],
        "bookingUrl": null
      }]
    }
  ]
}

API Data: ${JSON.stringify(apiData)}

STRICT SCHEMA TO FOLLOW:
${JSON.stringify(responseSchema.schema, null, 2)}`;

    console.log("Calling OpenAI with baseURL:", baseURL);
    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      max_tokens: 12000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const finishReason = response.choices[0].finish_reason;

    if (content) {
      console.log("OpenAI response received successfully.");
      try {
        // Robust Extraction: Look for the first '{' and last '}'
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        let jsonToParse = jsonMatch ? jsonMatch[0] : content.trim();

        // Attempt to fix common LLM JSON mistakes: unquoted string values like "description": Some text
        jsonToParse = jsonToParse.replace(/:\s*([A-Za-z][^,:\[\]{}"\n]*?)(\s*[,}\]])/g, (_, val, end) => {
          if (val.trim() && !val.startsWith('"') && !val.startsWith('null') && !val.startsWith('true') && !val.startsWith('false') && isNaN(Number(val))) {
            return `: "${val.trim().replace(/"/g, '\\"')}"${end}`;
          }
          return `: ${val}${end}`;
        });

        let tripData: Record<string, unknown> | null = null;
        try {
          tripData = JSON.parse(jsonToParse);
        } catch (e) {
          // Truncation recovery: progressively strip from end to find valid JSON
          let temp = jsonToParse.trim();
          let success = false;
          while (temp.length > 2) {
            try {
              tripData = JSON.parse(temp);
              success = true;
              break;
            } catch {
              temp = temp.slice(0, -1).trim();
            }
          }
          if (!success) throw e;
        }

        // Normalize hallway-hallucinated keys
        if (tripData!.itineraries && !tripData!.days) {
          console.log("Mapping hallucinated 'itineraries' key to 'days'");
          tripData!.days = tripData!.itineraries;
          delete (tripData as Record<string, unknown>).itineraries;
        }

        if (!tripData) {
          throw new Error("Failed to parse trip data.");
        }

        // Enhance booking links for attractions and accommodation if missing
        if (process.env.GOOGLE_CLOUD_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
          console.log("Enhancing booking links using Google Search...");
          const days = (tripData!.days || []) as any[];
          for (const day of days) {
            for (const segment of day.segments) {
              if (!segment.bookingUrl && (segment.type === 'attraction' || segment.type === 'accommodation' || segment.type === 'food')) {
                segment.bookingUrl = await findBookingLink(segment.title, segment.location, segment.type);
              }
            }
          }
        }

        return NextResponse.json(tripData, { status: 200 });
      } catch (parseError) {
        console.error("JSON Parse Error in Generation. Content received:", content);
        return NextResponse.json({ 
          error: "Failed to parse generated itinerary as JSON.",
          details: content.length > 200 ? content.substring(0, 200) + "..." : content
        }, { status: 500 });
      }
    } else {
      throw new Error(`Empty response from OpenAI during generation (Content is null/empty). Finish reason: ${finishReason}`);
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
