import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  accent?: "default" | "success" | "risk" | "blocked";
  className?: string;
  to?: string;
}

const accentStyles = {
  default: "border-border",
  success: "border-[hsl(var(--state-success)/0.4)]",
  risk: "border-[hsl(var(--state-risk)/0.4)]",
  blocked: "border-[hsl(var(--state-blocked)/0.4)]",
};

const accentIconBg = {
  default: "bg-muted text-muted-foreground",
  success: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))]",
  risk: "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))]",
  blocked: "bg-[hsl(var(--state-blocked-bg))] text-[hsl(var(--state-blocked))]",
};

export function MetricCard({
  icon,
  label,
  value,
  sub,
  subColor,
  accent = "default",
  className,
  to,
}: MetricCardProps) {
  const card = (
    <Card
      className={cn(
        "rounded-xl shadow-sm border transition-all min-w-[140px]",
        to
          ? "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer"
          : "hover:shadow-md",
        accentStyles[accent],
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              accentIconBg[accent]
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight mb-0.5">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
              {value}
            </p>
            {sub && (
              <p
                className={cn(
                  "text-[11px] font-semibold mt-1 leading-tight",
                  subColor || "text-muted-foreground"
                )}
              >
                {sub}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={label}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
      >
        {card}
      </Link>
    );
  }
  return card;
}
