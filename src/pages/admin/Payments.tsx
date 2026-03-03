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
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
} from "lucide-react";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { usePayments, type Payment } from "@/hooks/usePayments";
import { NewInvoiceDialog } from "@/components/admin/payments/NewInvoiceDialog";
import { InvoiceDetailsSheet } from "@/components/admin/payments/InvoiceDetailsSheet";
import { NewPaymentDialog } from "@/components/admin/payments/NewPaymentDialog";
import { PaymentDetailsSheet } from "@/components/admin/payments/PaymentDetailsSheet";
import { format } from "date-fns";

type ActiveTab = "payments" | "invoices";

/* ── Invoice status config ── */
const invoiceStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

/* ── Payment category config ── */
const paymentCategoryConfig: Record<string, { label: string; color: string }> = {
  received: { label: "Received", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  labor: { label: "Labor", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  material: { label: "Material", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  other: { label: "Other", color: "bg-muted text-muted-foreground" },
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
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  /* ── Payment stats ── */
  const paymentStats = useMemo(() => {
    const received = payments
      .filter((p) => p.category === "received" && p.status !== "cancelled")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const paidOut = payments
      .filter((p) => p.category !== "received" && p.status !== "cancelled")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending = payments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return { received, paidOut, pending, net: received - paidOut };
  }, [payments]);

  /* ── Invoice stats ── */
  const invoiceStats = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const received = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    return { totalBilled, received, pending, overdue };
  }, [invoices]);

  /* ── Filtered lists ── */
  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === "all") return invoices;
    return invoices.filter((i) => i.status === invoiceFilter);
  }, [invoices, invoiceFilter]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === "all") return payments;
    return payments.filter((p) => p.category === paymentFilter || p.status === paymentFilter);
  }, [payments, paymentFilter]);

  const isLoading = activeTab === "payments" ? paymentsLoading : invoicesLoading;

  return (
    <AdminLayout title="Payments & Invoices">
      <div className="space-y-4">
        {/* ── Main Tabs ── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ActiveTab)}
        >
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
                  ? setPaymentDialogOpen(true)
                  : setInvoiceDialogOpen(true)
              }
            >
              <Plus className="w-4 h-4 mr-1" />
              {activeTab === "payments" ? "New Payment" : "New Invoice"}
            </Button>
          </div>
        </Tabs>

        {/* ── Stats Cards ── */}
        {activeTab === "payments" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Received", value: fmt(paymentStats.received), icon: ArrowDownCircle, color: "text-green-600" },
              { label: "Total Paid Out", value: fmt(paymentStats.paidOut), icon: ArrowUpCircle, color: "text-foreground" },
              { label: "Pending", value: fmt(paymentStats.pending), icon: Clock, color: "text-amber-600" },
              { label: "Net Balance", value: fmt(paymentStats.net), icon: TrendingUp, color: paymentStats.net >= 0 ? "text-green-600" : "text-destructive" },
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
        ) : (
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
        )}

        {/* ── Sub-filters ── */}
        {activeTab === "payments" ? (
          <Tabs value={paymentFilter} onValueChange={setPaymentFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="labor">Labor</TabsTrigger>
              <TabsTrigger value="material">Material</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <Tabs value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : activeTab === "payments" ? (
          filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No payments found</p>
                <Button variant="outline" className="mt-4" onClick={() => setPaymentDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Record first payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((pay) => {
                const cat = paymentCategoryConfig[pay.category] || paymentCategoryConfig.other;
                const sc = paymentStatusConfig[pay.status] || paymentStatusConfig.pending;
                return (
                  <Card
                    key={pay.id}
                    className="cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => setSelectedPayment(pay)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {pay.description || cat.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pay.projects?.customer_name || "No project"} · {format(new Date(pay.payment_date), "MMM dd")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className={`font-bold ${pay.category === "received" ? "text-green-600" : "text-foreground"}`}>
                            {pay.category === "received" ? "+" : "-"}{fmt(Number(pay.amount))}
                          </p>
                          {pay.payment_method && (
                            <p className="text-xs text-muted-foreground capitalize">{pay.payment_method.replace("_", " ")}</p>
                          )}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cat.color}`}>
                          {cat.label}
                        </span>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
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
      </div>

      <NewPaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} />
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
