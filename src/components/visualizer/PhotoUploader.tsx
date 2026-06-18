import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";

type Props = {
  onPhoto: (dataUrl: string) => void;
};

const MAX_DIM = 1600;

function isHeic(file: File) {
  const n = file.name.toLowerCase();
  return /heic|heif/.test(file.type) || n.endsWith(".heic") || n.endsWith(".heif");
}

async function decodeViaImageBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void } | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
    };
  } catch {
    return null;
  }
}

async function decodeViaImgEl(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }> {
  // Use data URL (more reliable on iOS than blob: for some formats)
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error || new Error("read failed"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image decode failed"));
    i.src = dataUrl;
  });
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
  };
}

async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const decoded = (await decodeViaImageBitmap(file)) || (await decodeViaImgEl(file));
  let { width, height } = decoded;
  if (!width || !height) throw new Error("invalid image dimensions");
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  decoded.draw(ctx, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function PhotoUploader({ onPhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handle = async (file?: File | null) => {
    if (!file) return;
    if (isHeic(file)) {
      alert(
        "iPhone HEIC photos aren't supported yet. On your iPhone open Settings → Camera → Formats and select 'Most Compatible', then retake the photo. Or upload a JPG/PNG."
      );
      return;
    }
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      onPhoto(dataUrl);
    } catch (e) {
      console.error("[Visualizer] photo load failed", e);
      alert("Could not load that image. Try a JPG or PNG under 20MB.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Preview your new floor</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Take or upload a photo of your room. Then mark the four corners of the floor and pick a style to see how it looks.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button
          size="lg"
          className="flex-1"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-5 w-5 mr-2" />
          Take photo
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-gold text-navy-dark hover:bg-gold-warm font-semibold shadow-gold"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload photo
        </Button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <p className="text-xs text-muted-foreground max-w-xs">
        Tip: stand back and capture the whole floor area. Good light and a clear view of the corners give the best preview.
      </p>
    </div>
  );
}
