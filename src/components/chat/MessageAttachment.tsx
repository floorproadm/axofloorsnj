import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  url: string;
  type?: string | null;
  name?: string | null;
  className?: string;
}

export function MessageAttachment({ url, type, name, className }: Props) {
  const isImage = (type || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(url);
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn("block", className)}>
        <img
          src={url}
          alt={name || "attachment"}
          loading="lazy"
          className="rounded-lg max-h-60 max-w-[260px] object-cover border border-border/40"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-background/60 hover:bg-background transition text-xs max-w-[260px]",
        className
      )}
    >
      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
      <span className="truncate flex-1">{name || "attachment"}</span>
      <Download className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
    </a>
  );
}
