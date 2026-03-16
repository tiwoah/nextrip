import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const ticketmasterKey = process.env.TICKETMASTER_API_KEY;
const aviationstackKey = process.env.AVIATIONSTACK_API_KEY;

type LonLat = [number, number]; // [longitude, latitude]

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
    // Search for both events and specifically attractions
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(city)}&apikey=${ticketmasterKey}&size=20&sort=relevance,desc`);
    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster API error:', error);
    return [];
  }
}

async function fetchFlightsForTrip(departure: string, arrival: string) {
  if (!aviationstackKey) return [];
  try {
    // Search for flights with a limit to get some options
    const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${aviationstackKey}&dep_iata=${departure}&arr_iata=${arrival}&limit=10`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('AviationStack API error:', error);
    return [];
  }
}

async function geocodeNominatim(query: string): Promise<LonLat | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a valid UA
        'User-Agent': 'event-pilot-ai/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data?.[0];
    if (!first?.lat || !first?.lon) return null;
    const lon = Number(first.lon);
    const lat = Number(first.lat);
    if (Number.isNaN(lon) || Number.isNaN(lat)) return null;
    return [lon, lat];
  } catch {
    return null;
  }
}

async function withConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  let idx = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await fn(items[cur]);
    }
  });
  await Promise.all(workers);
  return results;
}

function normalizeLonLat(coords: unknown, reference?: LonLat | null): LonLat | null {
  if (!Array.isArray(coords) || coords.length !== 2) return null;
  const a = Number(coords[0]);
  const b = Number(coords[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const looksLonLat = Math.abs(a) <= 180 && Math.abs(b) <= 90;
  const looksLatLon = Math.abs(a) <= 90 && Math.abs(b) <= 180;

  if (looksLonLat && !looksLatLon) return [a, b];
  if (looksLatLon && !looksLonLat) return [b, a];
  
  // If ambiguous (both values in [-90, 90]), use reference point if provided
  if (looksLonLat && looksLatLon && reference) {
    const distAB = Math.pow(a - reference[0], 2) + Math.pow(b - reference[1], 2);
    const distBA = Math.pow(b - reference[0], 2) + Math.pow(a - reference[1], 2);
    return distAB < distBA ? [a, b] : [b, a];
  }

  if (looksLonLat && looksLatLon) return [a, b]; // ambiguous, default to lon/lat

  return null;
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

    // Extract departure city (common patterns: "from X", "starting in X", etc.)
    const departureMatch = prompt.match(/\b(?:from|starting in|departing from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i);
    const departureCity = departureMatch ? departureMatch[1] : 'New York';

    // Fetch external data and geocode city in parallel
    const [events, flights, cityCoords] = await Promise.all([
      fetchTicketmasterEvents(city),
      fetchFlightsForTrip(departureCity, city),
      geocodeNominatim(city)
    ]);

    const apiData = {
      events: events.map((e: TicketmasterEvent) => ({ name: e.name, url: e.url, date: e.dates?.start?.localDate })),
      flights: flights.map((f: AviationStackFlight) => ({ flight: f.flight?.iata, status: f.flight_status }))
    };

    const systemInstruction = `You are an expert travel planner AI. Generate a realistic, logically sequenced trip itinerary in RAW JSON.

CRITICAL:
- Use "days" for the itinerary array.
- "currency" at the top level is MANDATORY. **Default to "CAD"** unless a specific local currency is more appropriate for the destination (e.g. "VND" for Vietnam, "EUR" for France).
- Each day MUST have "id", "dayLabel", "dateStr", "activitiesCount", and "segments".
API Data with pre-verified booking URLs: ${JSON.stringify(apiData)}
CRITICAL:
- Destination City: ${city} (Approx coords: ${JSON.stringify(cityCoords)})
- If an event from Ticketmaster or a flight from AviationStack is relevant to a segment, use its provided URL in "bookingUrl".
- DO NOT hallucinate links. If no API data matches, set "bookingUrl" to null.
- ANY URL starting with "http://localhost" is FORBIDDEN.
- "coordinates" MUST be in [longitude, latitude] format (GeoJSON order). For example, London is approx [-0.1, 51.5]. ALWAYS use these provided city coords as a reference.`;

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

        // Post-process segments to match with API data for booking URLs
        try {
          const days = (tripData as any)?.days as any[] | undefined;
          if (Array.isArray(days)) {
            for (const day of days) {
              if (Array.isArray(day.segments)) {
                for (const seg of day.segments) {
                  // Skip if bookingUrl is already a valid external URL set by Gemini
                  if (seg.bookingUrl && typeof seg.bookingUrl === 'string' && 
                      seg.bookingUrl.startsWith('http') && 
                      !seg.bookingUrl.includes('localhost') &&
                      !seg.bookingUrl.includes('placeholder')) {
                    continue;
                  }
                  
                  // Reset any invalid URLs
                  seg.bookingUrl = null;

                  // Normalize coordinates to ensure [lon, lat] order
                  if (seg.coordinates) {
                    const normalized = normalizeLonLat(seg.coordinates, cityCoords);
                    if (normalized) {
                      seg.coordinates = normalized;
                    }
                  }

                  // Normalize activity types to ensure they match our UI config
                  const validTypes = ["transport", "accommodation", "food", "attraction", "freetime", "shopping"];
                  if (!validTypes.includes(seg.type)) {
                    // Try to map common aliases or default to freetime
                    const typeLower = String(seg.type).toLowerCase();
                    if (typeLower.includes("transport") || typeLower.includes("flight") || typeLower.includes("drive")) seg.type = "transport";
                    else if (typeLower.includes("hotel") || typeLower.includes("stay") || typeLower.includes("bed")) seg.type = "accommodation";
                    else if (typeLower.includes("eat") || typeLower.includes("restaurant") || typeLower.includes("dinner")) seg.type = "food";
                    else if (typeLower.includes("visit") || typeLower.includes("sight") || typeLower.includes("tour")) seg.type = "attraction";
                    else if (typeLower.includes("shop") || typeLower.includes("buy")) seg.type = "shopping";
                    else seg.type = "freetime";
                  }
                  
                  // For attraction segments, try to match with Ticketmaster events
                  if (seg.type === 'attraction' || seg.type === 'shopping') {
                    const segTitle = seg.title?.toLowerCase() || '';
                    const segLocation = seg.location?.toLowerCase() || '';
                    
                    const eventMatch = events.find((event: TicketmasterEvent) => {
                      const eventName = event.name?.toLowerCase() || '';
                      // Simple fuzzy match: check if words overlap
                      const eventWords = eventName.split(/\s+/).filter(w => w.length > 3);
                      return eventWords.some(word => segTitle.includes(word) || segLocation.includes(word)) ||
                             eventName.includes(segTitle) || segTitle.includes(eventName);
                    });
                    
                    if (eventMatch?.url) {
                      seg.bookingUrl = eventMatch.url;
                    }
                  }
                  
                  // For transport segments, try to match with flights
                  else if (seg.type === 'transport' && (seg.title?.toLowerCase().includes('flight') || seg.description?.toLowerCase().includes('flight'))) {
                    // Aviationstack links are not always direct booking links, 
                    // so we'll use a search link if available or a reliable fallback
                    if (flights.length > 0) {
                      // Construct a Google Flights search link as a reliable booking destination
                      const dep = departureCity.toUpperCase().substring(0, 3); // Simple extraction
                      const arr = city.toUpperCase().substring(0, 3);
                      seg.bookingUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(city)}%20from%20${encodeURIComponent(departureCity)}`;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Post-processing booking URLs failed:', e);
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
      throw new Error(`Empty response from Gemini during generation.`);
    }

  } catch (error) {
    console.error("Gemini Generation Error Detailed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Failed to generate trip" }, { status: 500 });
  }
}
