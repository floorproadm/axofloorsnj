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
  const newName = file.name.replace(/\.[^.]+$/, ".mp4");

  return new File([blob], newName, { type: "video/mp4" });
}
