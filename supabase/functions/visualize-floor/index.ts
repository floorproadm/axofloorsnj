// Photorealistic floor visualizer — re-stains existing floor via Lovable AI (Gemini image edit).
// Cached in Storage by SHA-256(photo + styleName) so repeat requests skip the AI call.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image-preview";
const CACHE_BUCKET = "visualizer-cache";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year
const RATE_LIMIT_HOUR = 10;
const RATE_LIMIT_DAY = 30;

interface Body {
  imageDataUrl: string;
  stylePrompt: string;
  styleName?: string;
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const [meta, b64] = dataUrl.split(",");
  const contentType = meta.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, contentType };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageDataUrl, stylePrompt, styleName } = (await req.json()) as Body;

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/") || !stylePrompt) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Cache lookup (hash of photo bytes + stain identity) ----
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supa = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    const cacheKeyInput = `v1|${styleName ?? ""}|${stylePrompt}|${imageDataUrl}`;
    const hash = await sha256Hex(cacheKeyInput);
    const cachePath = `${hash.slice(0, 2)}/${hash}.png`;

    if (supa) {
      const { data: signed } = await supa.storage
        .from(CACHE_BUCKET)
        .createSignedUrl(cachePath, SIGNED_URL_TTL);
      if (signed?.signedUrl) {
        return new Response(
          JSON.stringify({ imageDataUrl: signed.signedUrl, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ---- Cache miss: call the model ----
    const prompt = `You are a professional stain visualization tool for a hardwood flooring company.

TASK: Re-stain the EXISTING hardwood floor in this photo to a new tone. This is a color/stain change only — NOT a floor replacement.

TARGET STAIN: ${stylePrompt}

WHAT TO KEEP IDENTICAL (do not change):
- Wood species of the existing floor (do not switch oak to walnut, maple, pine, etc.).
- Plank width, plank length, and board layout exactly as in the photo.
- Seam positions and joint pattern between boards.
- Grain pattern, grain direction, knots, and natural wood character of each board.
- Floor orientation relative to the camera and perspective foreshortening.
- Everything else in the room: walls, trim, cabinets, appliances, furniture, windows, rugs, people, pets, objects, framing, resolution.
- Existing lighting direction, color temperature, shadows and reflections on the floor.
- Original finish sheen (matte / satin / semi-gloss) — do not add glare.

WHAT TO CHANGE:
- Only the stain color/tone of the existing wood, as if the same floor was sanded and re-stained in place.

OUTPUT: Photorealistic, true-to-color. No watermarks, no text, no UI, no borders, no added furniture or decor.

Stain name: ${styleName ?? "custom stain"}.`;

    const upstream = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Gateway error", upstream.status, text);
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 502;
      const msg =
        upstream.status === 429
          ? "Too many requests. Please wait a moment and try again."
          : upstream.status === 402
            ? "AI credits exhausted. Please add credits to continue."
            : "AI generation failed. Please try a different photo.";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const url: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
      data?.choices?.[0]?.message?.content?.find?.((p: any) => p?.image_url?.url)?.image_url?.url;

    if (!url) {
      console.error("No image returned", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return an image. Try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Cache write (best-effort) ----
    let returnUrl = url;
    if (supa && url.startsWith("data:image/")) {
      try {
        const { bytes, contentType } = dataUrlToBytes(url);
        const { error: upErr } = await supa.storage
          .from(CACHE_BUCKET)
          .upload(cachePath, bytes, { contentType, upsert: true });
        if (upErr) {
          console.error("cache upload error", upErr.message);
        } else {
          const { data: signed } = await supa.storage
            .from(CACHE_BUCKET)
            .createSignedUrl(cachePath, SIGNED_URL_TTL);
          if (signed?.signedUrl) returnUrl = signed.signedUrl;
        }
      } catch (e) {
        console.error("cache write failed", (e as Error).message);
      }
    }

    return new Response(JSON.stringify({ imageDataUrl: returnUrl, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
