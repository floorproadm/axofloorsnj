import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && loadPromise) {
    await loadPromise;
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();

  loadPromise = (async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpegInstance!.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
  })();

  await loadPromise;
  return ffmpegInstance;
}

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
 * Transcodes a video file to MP4 (H.264 + AAC) using ffmpeg.wasm.
 * Returns a new File object with the transcoded MP4.
 * Calls onProgress(0-1) during conversion.
 */
export async function transcodeToMp4(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.min(progress, 1));
    });
  }

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "28",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([(data as Uint8Array).slice().buffer as ArrayBuffer], { type: "video/mp4" });
  const newName = file.name.replace(/\.[^.]+$/, ".mp4");

  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new File([blob], newName, { type: "video/mp4" });
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.substring(dot) : "";
}
