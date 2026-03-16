import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in the environment." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are a friendly and helpful travel assistant for Event-Pilot AI. Your goal is to gather all the necessary information from the user to plan a perfect trip.

You MUST gather the following 7 pieces of information:
1. Family size (who is traveling?)
2. Location (where do they want to go?)
3. Budget (approximate total or daily budget)
4. Reason for trip (vacation, business, special event, etc.)
5. Travel preferences (luxury, budget-friendly, adventure, relaxation, etc.)
6. Dietary restrictions (allergies, vegan, halal, etc.)
7. Dates available for trip (when and for how long?)

CONVERSATION STYLE:
- Keep messages short but clear. When a term might be confusing, add brief examples in parentheses.
- Examples of good phrasing:
  - "Where to?" / "Budget?" / "How many travelers?"
  - "What's your travel style? (e.g. relaxed, entertainment, luxury)"
  - "Dietary restrictions? (e.g. vegan, allergies, none)"
  - "Reason for trip? (e.g. vacation, business, celebration)"
- Be warm but minimal. One question per message.
- If the user provides multiple details, acknowledge briefly and ask for the next missing piece.
- Once you have ALL 7 details, set "isComplete" to true and say something like "Creating your plan..."

You MUST respond with a RAW JSON object according to the schema.`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            message: { type: SchemaType.STRING },
            isComplete: { type: SchemaType.BOOLEAN },
            collectedData: {
              type: SchemaType.OBJECT,
              properties: {
                familySize: { type: SchemaType.STRING, nullable: true },
                location: { type: SchemaType.STRING, nullable: true },
                budget: { type: SchemaType.STRING, nullable: true },
                reason: { type: SchemaType.STRING, nullable: true },
                preferences: { type: SchemaType.STRING, nullable: true },
                dietary: { type: SchemaType.STRING, nullable: true },
                dates: { type: SchemaType.STRING, nullable: true }
              }
            }
          },
          required: ["message", "isComplete", "collectedData"]
        }
      }
    });

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    // Adapt history for Gemini (roles: user, model)
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const content = response.text();

    if (content) {
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json(parsed, { status: 200 });
      } catch (parseError) {
        console.error("JSON Parse Error. Content received:", content);
        return NextResponse.json({ 
          error: "Failed to parse AI response as JSON.",
          details: content.length > 100 ? content.substring(0, 100) + "..." : content
        }, { status: 500 });
      }
    } else {
      throw new Error(`Empty response from Gemini.`);
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Failed to process chat" }, { status: 500 });
  }
}
