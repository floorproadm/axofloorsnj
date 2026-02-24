import { useState } from "react";
import { Play, Download, AlertTriangle } from "lucide-react";

interface MediaRendererProps {
  src: string;
  fileType?: string;
  alt?: string;
  className?: string;
  controls?: boolean;
  /** Show play icon overlay instead of actual video (for thumbnails) */
  thumbnailMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Renders either an <img> or <video> based on file_type.
 * Includes error fallback for unsupported video formats (e.g. .MOV/HEVC).
 */
export function MediaRenderer({
  src,
  fileType,
  alt = "",
  className = "",
  controls = true,
  thumbnailMode = false,
  onClick,
}: MediaRendererProps) {
  const isVideo = fileType === "video";
  const [videoError, setVideoError] = useState(false);

  if (isVideo && videoError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground ${className}`}
        onClick={onClick}
      >
        <AlertTriangle className="w-6 h-6 text-amber-500" />
        <p className="text-xs text-center px-2">Formato não suportado pelo navegador</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-3 h-3" /> Baixar vídeo
        </a>
      </div>
    );
  }

  if (isVideo && thumbnailMode) {
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <video
          src={src}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onError={() => setVideoError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-black/60 rounded-full p-2">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        muted
        playsInline
        preload="metadata"
        onClick={onClick}
        onError={() => setVideoError(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onClick={onClick}
    />
  );
}
