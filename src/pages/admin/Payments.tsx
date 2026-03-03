import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Receipt,
  Wallet,
  Hammer,
  Package,
  MoreHorizontal,
} from "lucide-react";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { usePayments, type Payment } from "@/hooks/usePayments";
import { NewInvoiceDialog } from "@/components/admin/payments/NewInvoiceDialog";
import { InvoiceDetailsSheet } from "@/components/admin/payments/InvoiceDetailsSheet";
import { NewPaymentDialog } from "@/components/admin/payments/NewPaymentDialog";
import { PaymentDetailsSheet } from "@/components/admin/payments/PaymentDetailsSheet";
import { PaymentActionSheet } from "@/components/admin/payments/PaymentActionSheet";
import { MonthSelector } from "@/components/admin/payments/MonthSelector";
import { MonthlyOverview } from "@/components/admin/payments/MonthlyOverview";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

type ActiveTab = "payments" | "invoices";

/* ── Category icons ── */
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  received: DollarSign,
  labor: Hammer,
  material: Package,
  other: MoreHorizontal,
};

/* ── Invoice status config ── */
const invoiceStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payments() {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();

  const [activeTab, setActiveTab] = useState<ActiveTab>("payments");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDefaultCategory, setPaymentDefaultCategory] = useState<"received" | "labor" | "material" | "other">("received");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  /* ── Monthly filtered payments ── */
  const monthlyPayments = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return payments.filter((p) => {
      const d = new Date(p.payment_date);
      return isWithinInterval(d, { start, end });
    });
  }, [payments, currentMonth]);

  /* ── KPI values ── */
  const kpis = useMemo(() => {
    const totalIn = monthlyPayments
      .filter((p) => p.category === "received" && p.status === "confirmed")
      .reduce((s, p) => s + Number(p.amount), 0);
    const totalOut = monthlyPayments
      .filter((p) => p.category !== "received" && p.status === "confirmed")
      .reduce((s, p) => s + Number(p.amount), 0);
    const pending = monthlyPayments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + Number(p.amount), 0);
    return { totalIn, totalOut, pending, net: totalIn - totalOut };
  }, [monthlyPayments]);

  /* ── Category counts ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: monthlyPayments.length };
    monthlyPayments.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [monthlyPayments]);

  /* ── Category-filtered list ── */
  const filteredMonthlyPayments = useMemo(() => {
    if (!categoryFilter) return monthlyPayments;
    return monthlyPayments.filter((p) => p.category === categoryFilter);
  }, [monthlyPayments, categoryFilter]);

  /* ── Group by day ── */
  const groupedPayments = useMemo(() => {
    const groups: Record<string, Payment[]> = {};
    filteredMonthlyPayments.forEach((p) => {
      const key = p.payment_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [filteredMonthlyPayments]);

  /* ── Invoice stats ── */
  const invoiceStats = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const received = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    return { totalBilled, received, pending, overdue };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === "all") return invoices;
    return invoices.filter((i) => i.status === invoiceFilter);
  }, [invoices, invoiceFilter]);

  const handleActionSelect = (type: "income" | "expense") => {
    setPaymentDefaultCategory(type === "income" ? "received" : "labor");
    setPaymentDialogOpen(true);
  };

  const handleCategoryClick = (cat: string) => {
    setCategoryFilter((prev) => (prev === cat ? null : cat));
  };

  const isLoading = activeTab === "payments" ? paymentsLoading : invoicesLoading;

  return (
    <AdminLayout title="Payments & Invoices">
      <div className="space-y-4">
        {/* ── Main Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
              <TabsTrigger
                value="payments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Wallet className="w-4 h-4 mr-1.5" />
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Receipt className="w-4 h-4 mr-1.5" />
                Invoices
              </TabsTrigger>
            </TabsList>

            <Button
              size="sm"
              onClick={() =>
                activeTab === "payments"
                  ? setActionSheetOpen(true)
                  : setInvoiceDialogOpen(true)
              }
            >
              <Plus className="w-4 h-4 mr-1" />
              {activeTab === "payments" ? "New Payment" : "New Invoice"}
            </Button>
          </div>
        </Tabs>

        {/* ── PAYMENTS TAB ── */}
        {activeTab === "payments" ? (
          <>
            <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
            
            {paymentsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total In", value: fmt(kpis.totalIn), icon: CheckCircle, color: "text-green-600" },
                    { label: "Total Out", value: fmt(kpis.totalOut), icon: AlertTriangle, color: "text-foreground" },
                    { label: "Pending", value: fmt(kpis.pending), icon: Clock, color: "text-amber-600" },
                    { label: "Net Balance", value: `${kpis.net >= 0 ? "+" : ""}${fmt(kpis.net)}`, icon: DollarSign, color: kpis.net >= 0 ? "text-green-600" : "text-destructive" },
                  ].map((s) => (
                    <Card key={s.label}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg bg-muted shrink-0 ${s.color}`}>
                            <s.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground uppercase whitespace-nowrap">{s.label}</p>
                            <p className={`text-sm font-bold truncate ${s.color}`}>{s.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <MonthlyOverview
                  payments={monthlyPayments}
                  onCategoryClick={handleCategoryClick}
                  activeCategory={categoryFilter || undefined}
                />

                {/* Category Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { key: null, label: "All" },
                    { key: "received", label: "Received" },
                    { key: "labor", label: "Labor" },
                    { key: "material", label: "Material" },
                    { key: "other", label: "Other" },
                  ].map((cat) => {
                    const count = cat.key ? (categoryCounts[cat.key] || 0) : categoryCounts.all || 0;
                    const isActive = categoryFilter === cat.key;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => setCategoryFilter(cat.key)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Transaction list grouped by day */}
                {groupedPayments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Wallet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No payments this month</p>
                      <Button variant="outline" className="mt-4" onClick={() => setActionSheetOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Record first payment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {groupedPayments.map((group) => (
                      <div key={group.date} className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                          {format(new Date(group.date + "T12:00:00"), "EEEE, MMM dd")}
                        </p>
                        {group.items.map((pay) => {
                          const sc = paymentStatusConfig[pay.status] || paymentStatusConfig.pending;
                          const Icon = categoryIcons[pay.category] || DollarSign;
                          const isIncome = pay.category === "received";
                          return (
                            <Card
                              key={pay.id}
                              className="cursor-pointer hover:border-primary/30 transition-colors"
                              onClick={() => setSelectedPayment(pay)}
                            >
                              <CardContent className="p-3 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isIncome ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}>
                                  <Icon className={`w-4 h-4 ${isIncome ? "text-green-600" : "text-muted-foreground"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {pay.description || (isIncome ? "Client Payment" : pay.category.charAt(0).toUpperCase() + pay.category.slice(1))}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {pay.projects?.customer_name || "No project"}
                                    {pay.payment_method && ` · ${pay.payment_method.replace("_", " ")}`}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`font-bold text-sm ${isIncome ? "text-green-600" : "text-foreground"}`}>
                                    {isIncome ? "+" : "-"}{fmt(Number(pay.amount))}
                                  </p>
                                  <Badge variant={sc.variant} className="text-[10px] px-1.5 py-0">
                                    {sc.label}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* ── INVOICES TAB (unchanged logic) ── */
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Billed", value: fmt(invoiceStats.totalBilled), icon: FileText, color: "text-foreground" },
                { label: "Received", value: fmt(invoiceStats.received), icon: CheckCircle, color: "text-green-600" },
                { label: "Pending", value: fmt(invoiceStats.pending), icon: Clock, color: "text-amber-600" },
                { label: "Overdue", value: fmt(invoiceStats.overdue), icon: AlertTriangle, color: "text-destructive" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs value={invoiceFilter} onValueChange={setInvoiceFilter}>
              <TabsList>
                <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>

            {invoicesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No invoices found</p>
                  <Button variant="outline" className="mt-4" onClick={() => setInvoiceDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create first invoice
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((inv) => {
                  const sc = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
                  return (
                    <Card
                      key={inv.id}
                      className="cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{inv.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {inv.projects?.customer_name || "—"} · {inv.projects?.project_type || ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="font-bold text-foreground">{fmt(Number(inv.total_amount || 0))}</p>
                            <p className="text-xs text-muted-foreground">
                              Due {format(new Date(inv.due_date), "MMM dd")}
                            </p>
                          </div>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <PaymentActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        onSelectType={handleActionSelect}
      />
      <NewPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        defaultCategory={paymentDefaultCategory}
      />
      <NewInvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} />
      <InvoiceDetailsSheet
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      />
      <PaymentDetailsSheet
        payment={selectedPayment}
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      />
    </AdminLayout>
  );
}
