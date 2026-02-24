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
  const [videoError, setVideoError] = useState<string | null>(null);

  if (isVideo && videoError) {
    const isMov = src.toLowerCase().includes(".mov");
    return (
      <div
        className={`relative flex flex-col items-center justify-center gap-3 bg-muted text-muted-foreground ${className}`}
        onClick={onClick}
      >
        <AlertTriangle className="w-7 h-7 text-amber-500" />
        <div className="text-center px-4 space-y-1">
          <p className="text-sm font-medium">Vídeo incompatível</p>
          <p className="text-xs">
            {isMov
              ? "Arquivos .MOV (iPhone) não são suportados pelo navegador. Delete este vídeo e re-envie em formato MP4."
              : "Este formato de vídeo não é suportado ou o arquivo está corrompido."}
          </p>
          {/* Debug info hidden mostly but accessible if needed */}
          <p className="text-[10px] opacity-50 select-text hidden group-hover:block">
            {videoError === "true" ? "Error loading" : videoError}
          </p>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-3.5 h-3.5" /> Baixar original
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
          onError={(e) => {
            const err = e.currentTarget.error;
            setVideoError(err ? `${err.code}: ${err.message}` : "true");
          }}
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
        onError={(e) => {
          const err = e.currentTarget.error;
          setVideoError(err ? `${err.code}: ${err.message}` : "true");
        }}
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
