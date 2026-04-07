import OpenAI from "openai";
import { NextRequest } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json();

    const systemPrompt = `You are the Second Brain — a personal AI assistant with full access to the user's life history inside their productivity app "le plan".

You have access to everything they have recorded:

TASKS:
${JSON.stringify(context.tasks ?? [], null, 2)}

HABITS & LOGS:
${JSON.stringify(context.habits ?? [], null, 2)}

FOCUS SESSIONS:
${JSON.stringify(context.focusSessions ?? [], null, 2)}

NOTES:
${JSON.stringify(context.notes ?? [], null, 2)}

CHECK-IN HISTORY:
${JSON.stringify(context.dayContext ?? null, null, 2)}

CALENDAR EVENTS:
${JSON.stringify(context.calendarEvents ?? [], null, 2)}

TODAY: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

Answer the user's questions based on this data. Be conversational, specific, and genuinely helpful. Reference actual data points when relevant. If asked for patterns, analyse the data and surface real insights. If something is not in the data, say so honestly. Keep answers concise but complete.`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.chat.completions.create({
            model: "qwen/qwen3.6-plus:free",
            max_tokens: 1024,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            stream: true,
          });

          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `Error: ${msg}` })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Brain request failed" }), { status: 500 });
  }
}
