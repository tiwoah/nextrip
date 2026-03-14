import OpenAI from 'openai';
import { NextResponse } from 'next/server';

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
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const systemPrompt = `You are a friendly and helpful travel assistant for Event-Pilot AI. Your goal is to gather all the necessary information from the user to plan a perfect trip.

You MUST gather the following 7 pieces of information:
1. Family size (who is traveling?)
2. Location (where do they want to go?)
3. Budget (approximate total or daily budget)
4. Reason for trip (vacation, business, special event, etc.)
5. Travel preferences (luxury, budget-friendly, adventure, relaxation, etc.)
6. Dietary restrictions (allergies, vegan, halal, etc.)
7. Dates available for trip (when and for how long?)

CONVERSATION STYLE:
- Be warm and welcoming.
- Ask details progressively. Don't overwhelm the user with all 7 questions at once.
- If the user provides multiple details, acknowledge them and ask for what's missing.
- Once you have ALL 7 details, set "isComplete" to true and provide a final summary message.

RESPONSE FORMAT:
    You MUST respond with a RAW JSON object. DO NOT use markdown code blocks (\`\`\`json). DO NOT include any text before or after the JSON.

EXAMPLE RESPONSE:
{
  "message": "That sounds like a great start! Since you're traveling as a family of four to Tokyo, I'd love to know if you have any dietary restrictions or specific travel preferences like luxury or budget-friendly options?",
  "isComplete": false,
  "collectedData": {
    "familySize": "4 people",
    "location": "Tokyo",
    "budget": null,
    "reason": null,
    "preferences": null,
    "dietary": null,
    "dates": null
  }
}

Current state of collected data should be inferred from the conversation history.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const finishReason = response.choices[0].finish_reason;

    if (content) {
      try {
        // Robust Extraction: Look for the first '{' and last '}'
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        let jsonToParse = jsonMatch ? jsonMatch[0] : content.trim();
        
        let parsed;
        try {
          parsed = JSON.parse(jsonToParse);
        } catch (e) {
          // If parse fails, attempt to strip trailing garbage one character at a time
          let temp = jsonToParse.trim();
          let success = false;
          while (temp.length > 2) {
            try {
              parsed = JSON.parse(temp);
              success = true;
              break;
            } catch (inner) {
              temp = temp.slice(0, -1).trim();
            }
          }
          if (!success) throw e;
        }

        // Fuzzy key mapper for corrupted message keys
        const keys = Object.keys(parsed);
        const corruptedMessageKey = keys.find(k => k.toLowerCase().includes('final') || k.toLowerCase().includes('message'));
        
        if (corruptedMessageKey && !parsed.message) {
          parsed.message = parsed[corruptedMessageKey];
          if (corruptedMessageKey.includes('<|message|>')) {
             delete parsed[corruptedMessageKey];
          }
        }

        // Final check for expected structure with robust defaults
        if (typeof parsed.isComplete === 'undefined') {
          parsed.isComplete = false;
        }
        
        if (!parsed.message || typeof parsed.message !== 'string') {
          parsed.message = "I'm sorry, I'm having trouble phrasing my response. Let's continue with your trip planning!";
        }

        if (!parsed.collectedData) {
          parsed.collectedData = {
            familySize: null,
            location: null,
            budget: null,
            reason: null,
            preferences: null,
            dietary: null,
            dates: null
          };
        }

        return NextResponse.json(parsed, { status: 200 });
      } catch (parseError) {
        console.error("JSON Parse Error. Content received:", content);
        return NextResponse.json({ 
          error: "Failed to parse AI response as JSON.",
          details: content.length > 100 ? content.substring(0, 100) + "..." : content
        }, { status: 500 });
      }
    } else {
      throw new Error(`Empty response from OpenAI (Content is null/empty). Finish reason: ${finishReason}`);
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    
    // Add more context for common errors
    if (message.includes("404")) {
      return NextResponse.json({ error: "Model or endpoint not found. Please check your configuration." }, { status: 404 });
    }

    return NextResponse.json({ error: message || "Failed to process chat" }, { status: 500 });
  }
}
