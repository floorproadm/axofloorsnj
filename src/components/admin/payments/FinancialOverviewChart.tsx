import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  subWeeks, subMonths, subQuarters, subYears,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  isWithinInterval, format, getISOWeek, getQuarter,
} from "date-fns";
import type { PeriodType } from "./PeriodSelector";

interface Payment {
  amount: number;
  category: string;
  status: string;
  payment_date: string;
}

interface Props {
  payments: Payment[];
  periodType: PeriodType;
  anchor: Date;
}

function buildPeriods(anchor: Date, periodType: PeriodType, count: number) {
  const periods: { start: Date; end: Date; label: string }[] = [];
  const subFns = { week: subWeeks, month: subMonths, quarter: subQuarters, year: subYears };
  const startFns = { week: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }), month: startOfMonth, quarter: startOfQuarter, year: startOfYear };
  const endFns = { week: (d: Date) => endOfWeek(d, { weekStartsOn: 1 }), month: endOfMonth, quarter: endOfQuarter, year: endOfYear };

  for (let i = count - 1; i >= 0; i--) {
    const ref = subFns[periodType](anchor, i);
    const s = startFns[periodType](ref);
    const e = endFns[periodType](ref);
    let label = "";
    switch (periodType) {
      case "week": label = `W${getISOWeek(ref)}`; break;
      case "month": label = format(ref, "MMM"); break;
      case "quarter": label = `Q${getQuarter(ref)}`; break;
      case "year": label = format(ref, "yyyy"); break;
    }
    periods.push({ start: s, end: e, label });
  }
  return periods;
}

export function FinancialOverviewChart({ payments, periodType, anchor }: Props) {
  const data = useMemo(() => {
    const periods = buildPeriods(anchor, periodType, 6);
    return periods.map((p) => {
      let revenue = 0;
      let expenses = 0;
      payments.forEach((pay) => {
        if (pay.status !== "confirmed") return;
        const d = new Date(pay.payment_date);
        if (!isWithinInterval(d, { start: p.start, end: p.end })) return;
        if (pay.category === "received") revenue += Number(pay.amount);
        else expenses += Number(pay.amount);
      });
      return { name: p.label, Revenue: revenue, Expenses: expenses };
    });
  }, [payments, periodType, anchor]);

  const hasData = data.some((d) => d.Revenue > 0 || d.Expenses > 0);

  if (!hasData) return null;

  return (
    <Card>
      <CardContent className="p-3 pt-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Financial Overview</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={45} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, undefined]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="Revenue" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Expenses" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
