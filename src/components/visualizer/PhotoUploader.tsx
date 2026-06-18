import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";

type Props = {
  onPhoto: (dataUrl: string) => void;
};

const MAX_DIM = 1600;

async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    let { width, height } = img;
    const scale = Math.min(1, MAX_DIM / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PhotoUploader({ onPhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handle = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      onPhoto(dataUrl);
    } catch (e) {
      console.error(e);
      alert("Could not load that image. Please try another photo.");
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
          variant="outline"
          className="flex-1"
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
