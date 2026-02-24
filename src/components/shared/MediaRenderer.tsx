import { Play } from "lucide-react";

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
 * Use thumbnailMode for card grids to avoid auto-loading many videos.
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

  if (isVideo && thumbnailMode) {
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <video
          src={src}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
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
