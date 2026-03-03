import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDownCircle, Hammer, Package, MoreHorizontal, TrendingUp } from "lucide-react";
import type { Payment } from "@/hooks/usePayments";

interface Props {
  payments: Payment[];
  onCategoryClick?: (category: string) => void;
  activeCategory?: string;
}

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const expenseCategories = [
  { key: "labor", label: "Labor", icon: Hammer, colorClass: "text-blue-500" },
  { key: "material", label: "Material", icon: Package, colorClass: "text-amber-500" },
  { key: "other", label: "Other", icon: MoreHorizontal, colorClass: "text-muted-foreground" },
] as const;

export function MonthlyOverview({ payments, onCategoryClick, activeCategory }: Props) {
  const incomePayments = payments.filter((p) => p.category === "received" && p.status !== "cancelled");
  const incomeExpected = incomePayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const incomeReceived = incomePayments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const incomePercent = incomeExpected > 0 ? Math.round((incomeReceived / incomeExpected) * 100) : 0;

  const expensePayments = payments.filter((p) => p.category !== "received" && p.status !== "cancelled");
  const totalExpenses = expensePayments.reduce((s, p) => s + Number(p.amount || 0), 0);

  const expensesByCategory = expenseCategories.map((cat) => {
    const spent = expensePayments
      .filter((p) => p.category === cat.key)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return { ...cat, spent };
  });

  const netBalance = incomeReceived - totalExpenses;

  return (
    <div className="space-y-3">
      {/* Income Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold">Income</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Expected</p>
              <p className="font-bold">{fmt(incomeExpected)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Received</p>
              <p className="font-bold text-green-600">{fmt(incomeReceived)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={incomePercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{incomePercent}% collected</p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Expenses</span>
            <span className="text-sm font-bold">{fmt(totalExpenses)}</span>
          </div>
          <div className="space-y-2.5">
            {expensesByCategory.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              const maxVal = Math.max(totalExpenses, 1);
              const pct = Math.round((cat.spent / maxVal) * 100);
              return (
                <button
                  key={cat.key}
                  onClick={() => onCategoryClick?.(cat.key)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                    isActive ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${cat.colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.label}</span>
                      <span className="font-semibold">{fmt(cat.spent)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground/30 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Net Balance */}
      <Card className={netBalance >= 0 ? "border-green-200 dark:border-green-900/40" : "border-destructive/30"}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${netBalance >= 0 ? "text-green-500" : "text-destructive"}`} />
            <span className="text-sm font-semibold">Net Balance</span>
          </div>
          <span className={`text-lg font-bold ${netBalance >= 0 ? "text-green-600" : "text-destructive"}`}>
            {netBalance >= 0 ? "+" : ""}{fmt(netBalance)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
