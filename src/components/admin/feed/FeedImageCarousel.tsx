import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedPostImage } from "@/hooks/admin/useFeedData";

interface FeedImageCarouselProps {
  images: FeedPostImage[];
}

export function FeedImageCarousel({ images }: FeedImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Nenhuma imagem</p>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  const handleDownload = () => {
    const img = images[current];
    const a = document.createElement("a");
    a.href = img.file_url;
    a.download = `feed-image-${current + 1}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
        <img
          src={images[current].file_url}
          alt={`Image ${current + 1}`}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Counter + download */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {images.length > 1 && (
            <span className="bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md font-medium">
              {current + 1} of {images.length}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="bg-background/80 backdrop-blur-sm h-7 w-7"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                i === current ? "border-primary ring-1 ring-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.file_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
