import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
        const response = await client.messages.stream({
          model: "claude-opus-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: query }],
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
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
