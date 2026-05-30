/**
 * Applies an "AXO FLOORS" watermark to an image file using Canvas.
 * Returns a new File (JPEG, ~0.9 quality) ready to upload.
 */
export async function applyWatermark(file: File): Promise<File> {
  try {
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);

    const MAX = 2400;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    // Watermark sizing
    const text = "AXO FLOORS";
    const wmWidth = Math.round(w * 0.18);
    const fontSize = Math.max(12, Math.round(wmWidth / 7));
    const padX = Math.round(fontSize * 0.7);
    const padY = Math.round(fontSize * 0.45);

    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    const measured = ctx.measureText(text);
    const boxW = measured.width + padX * 2;
    const boxH = fontSize + padY * 2;
    const margin = 10;
    const x = w - boxW - margin;
    const y = h - boxH - margin;

    // Background: navy semi-transparent
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#0f1b3d";
    roundRect(ctx, x, y, boxW, boxH, 6);
    ctx.fill();

    // Text: gold
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#c9a84c";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padX, y + boxH / 2 + 1);

    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.9)
    );
    const newName = file.name.replace(/\.[^.]+$/, "") + "_wm.jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (e) {
    console.warn("Watermark failed, uploading original:", e);
    return file;
  }
}

function fileToDataURL(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
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
