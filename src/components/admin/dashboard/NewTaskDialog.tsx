import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewTaskDialogProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    priority?: string;
    assigned_to?: string | null;
    due_date?: string | null;
  }) => void;
  isPending?: boolean;
}

export function NewTaskDialog({ onSubmit, isPending }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { t } = useLanguage();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
    enabled: open,
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigned_to: assignedTo,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignedTo(null);
    setDueDate(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-[hsl(var(--gold-warm))]">
          {t("mission.novaTarefa")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("mission.novaTarefa")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={t("mission.tituloPlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder={t("mission.descricaoPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="flex gap-3">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignedTo ?? "unassigned"} onValueChange={(v) => setAssignedTo(v === "unassigned" ? null : v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t("mission.atribuir")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{t("mission.semResponsavel")}</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id ?? ""}>
                    {p.full_name ?? p.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "dd/MM/yyyy") : t("mission.prazo")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending} className="w-full">
            {t("mission.criar")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
