import { useEffect, useState } from "react";
import { format } from "date-fns";
import { StickyNote, Trash2, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDayNotes,
  useUpsertDayNote,
  useDeleteDayNote,
  type DayNote,
} from "@/hooks/useDayNotes";

const COLORS: { value: string; cls: string; chip: string }[] = [
  { value: "amber", cls: "bg-amber-50 border-amber-300 text-amber-900", chip: "bg-amber-400" },
  { value: "blue", cls: "bg-blue-50 border-blue-300 text-blue-900", chip: "bg-blue-400" },
  { value: "emerald", cls: "bg-emerald-50 border-emerald-300 text-emerald-900", chip: "bg-emerald-400" },
  { value: "rose", cls: "bg-rose-50 border-rose-300 text-rose-900", chip: "bg-rose-400" },
];

const toneFor = (c?: string) =>
  COLORS.find((x) => x.value === c)?.cls || COLORS[0].cls;

/** Inline bar shown above Day/List view content. */
export function DayNoteBar({ date }: { date: Date }) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { data: notes = [] } = useDayNotes(dateStr, dateStr);
  const upsert = useUpsertDayNote();
  const del = useDeleteDayNote();

  const note = notes[0];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [color, setColor] = useState("amber");

  useEffect(() => {
    setText(note?.content || "");
    setColor(note?.color || "amber");
  }, [note?.id, note?.content, note?.color]);

  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      if (note) await del.mutateAsync(note.id);
    } else {
      await upsert.mutateAsync({ note_date: dateStr, content: trimmed, color });
    }
    setOpen(false);
  };

  if (!note && !open) {
    return (
      <div className="px-4 pt-3">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add note for this day
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full text-left rounded-lg border px-3 py-2 flex items-start gap-2 transition-shadow hover:shadow-sm",
              toneFor(note?.color)
            )}
          >
            <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
            <p className="text-xs leading-snug whitespace-pre-wrap flex-1">
              {note?.content || "New note…"}
            </p>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Note · {format(date, "MMM d")}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reminder, weather, blocked day, etc."
            rows={4}
            className="text-sm resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-transform",
                    c.chip,
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  aria-label={c.value}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {note && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={async () => {
                    await del.mutateAsync(note.id);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              )}
              <Button size="sm" className="h-8 text-xs" onClick={save} disabled={upsert.isPending}>
                <Check className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Compact strip used inside Week view day cells. */
export function DayNoteStrip({ note }: { note: DayNote | undefined }) {
  if (!note) return null;
  return (
    <div
      title={note.content}
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] truncate border-l-2 flex items-center gap-1",
        toneFor(note.color)
      )}
    >
      <StickyNote className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
      <span className="truncate">{note.content}</span>
    </div>
  );
}
