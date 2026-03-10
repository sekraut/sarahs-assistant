// ai-process — Google Gemini message analysis + task extraction
// POST { type: "analyze_message" | "extract_tasks" | "summarize", content: string, context?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function gemini(systemPrompt: string, userContent: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

const PROMPTS: Record<string, string> = {
  analyze_message: `You are an AI assistant helping Sarah manage her inboxes.
Analyze the given message and return a JSON object with:
{ "summary": string, "action_required": boolean, "urgency": "low"|"medium"|"high", "suggested_tasks": string[] }
Be concise. Return only valid JSON.`,

  extract_tasks: `You are an AI assistant extracting actionable tasks from messages.
Return a JSON array of task objects: [{ "title": string, "description": string, "priority": "low"|"medium"|"high", "due_date_hint": string|null }]
Focus on clear, actionable items. Return only valid JSON.`,

  summarize: `You are Sarah's AI assistant. Summarize the following content concisely in 1-3 sentences.
Focus on what's most important for Sarah to know or act on.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { type, content, context } = await req.json();

    if (!type || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, content" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = PROMPTS[type];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown type: ${type}. Use: analyze_message, extract_tasks, summarize` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const input = context ? `Context: ${context}\n\n${content}` : content;
    const result = await gemini(systemPrompt, input);

    // For JSON-returning types, parse and return structured data
    if (type === "analyze_message" || type === "extract_tasks") {
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ ok: true, data: parsed }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // Return raw if JSON parsing fails
        return new Response(JSON.stringify({ ok: true, data: result }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, data: result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-process] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
