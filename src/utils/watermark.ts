import { supabase } from "@/integrations/supabase/client";

type WatermarkPosition = "bottom-right" | "bottom-left" | "bottom-center";

interface WatermarkConfig {
  enabled: boolean;
  imageUrl: string | null;
  position: WatermarkPosition;
}

let cachedConfig: WatermarkConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadConfig(): Promise<WatermarkConfig> {
  if (cachedConfig && Date.now() - cachedAt < CACHE_TTL_MS) return cachedConfig;
  const { data } = await supabase
    .from("company_settings")
    .select("watermark_enabled, watermark_image_url, watermark_position")
    .limit(1)
    .maybeSingle();
  cachedConfig = {
    enabled: (data as any)?.watermark_enabled ?? true,
    imageUrl: (data as any)?.watermark_image_url ?? null,
    position: ((data as any)?.watermark_position as WatermarkPosition) ?? "bottom-right",
  };
  cachedAt = Date.now();
  return cachedConfig;
}

/** Invalidate cache after settings change */
export function invalidateWatermarkConfig() {
  cachedConfig = null;
  cachedAt = 0;
}

function computeXY(
  canvasW: number,
  canvasH: number,
  boxW: number,
  boxH: number,
  position: WatermarkPosition,
  margin: number
): { x: number; y: number } {
  const y = canvasH - boxH - margin;
  switch (position) {
    case "bottom-left":
      return { x: margin, y };
    case "bottom-center":
      return { x: Math.round((canvasW - boxW) / 2), y };
    case "bottom-right":
    default:
      return { x: canvasW - boxW - margin, y };
  }
}

/**
 * Applies a watermark (custom image or fallback "AXO FLOORS" text) to an image file.
 * Reads config from company_settings. Returns the original file if disabled or on error.
 */
export async function applyWatermark(file: File): Promise<File> {
  try {
    const config = await loadConfig();
    if (!config.enabled) return file;

    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);

    const MAX = 1920;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const margin = Math.max(10, Math.round(w * 0.012));

    if (config.imageUrl) {
      // Image watermark
      try {
        const wmImg = await loadImage(config.imageUrl, true);
        const targetW = Math.round(w * 0.18);
        const ratio = wmImg.height / wmImg.width;
        const targetH = Math.round(targetW * ratio);
        const { x, y } = computeXY(w, h, targetW, targetH, config.position, margin);
        ctx.globalAlpha = 0.92;
        ctx.drawImage(wmImg, x, y, targetW, targetH);
        ctx.globalAlpha = 1;
      } catch (e) {
        // Fallback to text if image fails
        drawTextWatermark(ctx, w, h, config.position, margin);
      }
    } else {
      drawTextWatermark(ctx, w, h, config.position, margin);
    }

    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.82)
    );
    const newName = file.name.replace(/\.[^.]+$/, "") + "_wm.jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (e) {
    console.warn("Watermark failed, uploading original:", e);
    return file;
  }
}

function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  position: WatermarkPosition,
  margin: number
) {
  const text = "AXO FLOORS";
  const wmWidth = Math.round(w * 0.18);
  const fontSize = Math.max(12, Math.round(wmWidth / 7));
  const padX = Math.round(fontSize * 0.7);
  const padY = Math.round(fontSize * 0.45);

  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  const measured = ctx.measureText(text);
  const boxW = measured.width + padX * 2;
  const boxH = fontSize + padY * 2;
  const { x, y } = computeXY(w, h, boxW, boxH, position, margin);

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#0f1b3d";
  roundRect(ctx, x, y, boxW, boxH, 6);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#c9a84c";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + boxH / 2 + 1);
}

function fileToDataURL(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}
function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((res) => {
    navigator.geolocation.getCurrentPosition(
      (p) => res(p),
      () => res(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const a = j.address || {};
    const parts = [
      a.road,
      a.house_number,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.village,
      a.state,
    ].filter(Boolean);
    return parts.join(", ") || j.display_name || null;
  } catch {
    return null;
  }
}
