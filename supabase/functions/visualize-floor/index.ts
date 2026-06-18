// Photorealistic floor visualizer — replaces the floor in a room photo using Lovable AI (Gemini image edit).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image-preview";

interface Body {
  imageDataUrl: string;
  stylePrompt: string;
  styleName?: string;
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

    const prompt = `You are a professional interior visualization tool for a flooring company.

TASK: Replace ONLY the floor in this room photo with: ${stylePrompt}.

STRICT RULES:
- Keep EVERYTHING else identical: walls, cabinets, appliances, windows, lighting, shadows, perspective, camera angle, framing, resolution.
- Detect the floor area automatically (including under furniture edges where visible) and replace its surface only.
- Match the room's existing lighting direction, color temperature, and shadows on the new floor.
- Preserve realistic plank/tile perspective foreshortening relative to the camera.
- Photorealistic result. No watermarks, no text, no UI, no borders.
- Do not alter people, pets, or objects.

Style: ${styleName ?? "custom wood floor"}.`;

    const upstream = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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
    // Gemini image edits arrive as an image url in message.images[0].image_url.url
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

    return new Response(JSON.stringify({ imageDataUrl: url }), {
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
