import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

interface Props {
  currentMonth: Date;
  onChange: (month: Date) => void;
}

export function MonthSelector({ currentMonth, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(subMonths(currentMonth, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold min-w-[140px] text-center">
        {format(currentMonth, "MMMM yyyy")}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(addMonths(currentMonth, 1))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
