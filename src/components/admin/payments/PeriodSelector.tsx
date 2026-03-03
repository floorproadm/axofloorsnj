import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addWeeks, subWeeks, startOfWeek, endOfWeek, getISOWeek,
  addMonths, subMonths, startOfMonth, endOfMonth,
  addQuarters, subQuarters, startOfQuarter, endOfQuarter, getQuarter,
  addYears, subYears, startOfYear, endOfYear,
} from "date-fns";

export type PeriodType = "week" | "month" | "quarter" | "year";

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  periodType: PeriodType;
}

interface Props {
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  anchor: Date;
  onAnchorChange: (d: Date) => void;
}

const pills: { key: PeriodType; label: string }[] = [
  { key: "week", label: "W" },
  { key: "month", label: "M" },
  { key: "quarter", label: "Q" },
  { key: "year", label: "Y" },
];

export function getPeriodRange(anchor: Date, periodType: PeriodType): PeriodRange {
  switch (periodType) {
    case "week": {
      const s = startOfWeek(anchor, { weekStartsOn: 1 });
      const e = endOfWeek(anchor, { weekStartsOn: 1 });
      const wk = getISOWeek(anchor);
      return { start: s, end: e, label: `W${wk} · ${format(s, "MMM d")}–${format(e, "MMM d")}`, periodType };
    }
    case "month": {
      const s = startOfMonth(anchor);
      const e = endOfMonth(anchor);
      return { start: s, end: e, label: format(anchor, "MMMM yyyy"), periodType };
    }
    case "quarter": {
      const s = startOfQuarter(anchor);
      const e = endOfQuarter(anchor);
      const q = getQuarter(anchor);
      return { start: s, end: e, label: `Q${q} ${format(anchor, "yyyy")}`, periodType };
    }
    case "year": {
      const s = startOfYear(anchor);
      const e = endOfYear(anchor);
      return { start: s, end: e, label: format(anchor, "yyyy"), periodType };
    }
  }
}

function navigate(anchor: Date, periodType: PeriodType, direction: 1 | -1): Date {
  const fns = {
    week: direction === 1 ? addWeeks : subWeeks,
    month: direction === 1 ? addMonths : subMonths,
    quarter: direction === 1 ? addQuarters : subQuarters,
    year: direction === 1 ? addYears : subYears,
  };
  return fns[periodType](anchor, 1);
}

export function PeriodSelector({ periodType, onPeriodTypeChange, anchor, onAnchorChange }: Props) {
  const range = getPeriodRange(anchor, periodType);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Period type pills */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => onPeriodTypeChange(p.key)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              periodType === p.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onAnchorChange(navigate(anchor, periodType, -1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[180px] text-center">
          {range.label}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onAnchorChange(navigate(anchor, periodType, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
