import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "bg-zinc-700 text-zinc-200" },
  confirmed: { label: "Confirmado", className: "bg-blue-600 text-white" },
  in_progress: { label: "Em execução", className: "bg-yellow-500 text-black" },
  completed: { label: "Concluído", className: "bg-green-600 text-white" },
  cancelled: { label: "Cancelado", className: "bg-red-600 text-white" },
  on_hold: { label: "Em espera", className: "bg-orange-500 text-white" },
};

interface JobStatusBadgeProps {
  status: string;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge className={cn("font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
