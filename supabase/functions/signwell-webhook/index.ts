// signwell-webhook — SignWell document event handler
// Deploy with: supabase functions deploy signwell-webhook --no-verify-jwt
// SignWell sends POST with X-Signwell-Signature header for verification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIGNWELL_WEBHOOK_SECRET = Deno.env.get("SIGNWELL_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();

  // Verify signature if secret is configured
  if (SIGNWELL_WEBHOOK_SECRET) {
    const signature = req.headers.get("X-Signwell-Signature") || "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SIGNWELL_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSig) {
      console.error("[signwell-webhook] Invalid signature");
      return new Response("Invalid signature", { status: 400 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = event.event_type as string;
  const document = event.data as Record<string, unknown>;

  console.log(`[signwell-webhook] Event: ${eventType}`, document?.id);

  if (eventType === "document_completed") {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update signwell_config or any linked document records
    // TODO: match document to a task or integration by document.metadata
    console.log("[signwell-webhook] Document completed:", document?.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
