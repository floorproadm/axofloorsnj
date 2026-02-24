import { convertMedia } from "@remotion/webcodecs";

/**
 * Returns true if the file needs transcoding (e.g. .MOV, .avi, .wmv).
 */
export function needsTranscoding(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".mov") ||
    name.endsWith(".avi") ||
    name.endsWith(".wmv") ||
    name.endsWith(".mkv")
  );
}

/**
 * Validates that a transcoded MP4 blob is actually playable by creating
 * a temporary video element and checking if it can load metadata.
 */
async function validateMp4(blob: Blob, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    const cleanup = () => {
      video.src = "";
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => { cleanup(); resolve(false); }, timeoutMs);
    video.onloadedmetadata = () => { clearTimeout(timer); cleanup(); resolve(video.videoWidth > 0 && video.duration > 0); };
    video.onerror = () => { clearTimeout(timer); cleanup(); resolve(false); };
    video.preload = "metadata";
    video.src = url;
  });
}

/**
 * Returns true if the browser supports WebCodecs (needed for transcoding).
 */
export function supportsWebCodecs(): boolean {
  return typeof VideoEncoder !== "undefined" && typeof VideoDecoder !== "undefined";
}

/**
 * Transcodes a video file to MP4 (H.264 + AAC) using WebCodecs API.
 * Returns a new File object with the transcoded MP4.
 * Calls onProgress(0-1) during conversion.
 */
export async function transcodeToMp4(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  if (!supportsWebCodecs()) {
    throw new Error("WebCodecs not supported in this browser");
  }

  console.log(`Starting transcoding for ${file.name} (${file.size} bytes)`);

  const result = await convertMedia({
    src: file,
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    onProgress: (p) => {
      if (onProgress && p.overallProgress !== null) {
        onProgress(Math.min(p.overallProgress, 1));
      }
    },
  });

  const blob = await result.save();
  console.log(`Transcoding finished. Result size: ${blob.size} bytes`);

  if (blob.size < 1024) {
    throw new Error(`Transcoding failed: Output file too small (${blob.size} bytes)`);
  }

  // Validate the output is actually a playable MP4
  const isValid = await validateMp4(blob);
  if (!isValid) {
    throw new Error("Transcoding produced an unplayable MP4 file");
  }

  const newName = file.name.replace(/\.[^.]+$/, ".mp4");

  return new File([blob], newName, { type: "video/mp4" });
}
