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
  ClipboardList,
  Send,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { useEstimatesList, type EstimateListItem } from "@/hooks/useEstimatesList";
import { NewInvoiceDialog } from "@/components/admin/payments/NewInvoiceDialog";
import { InvoiceDetailsSheet } from "@/components/admin/payments/InvoiceDetailsSheet";
import { EstimateDetailsSheet } from "@/components/admin/payments/EstimateDetailsSheet";
import { format } from "date-fns";

type ActiveTab = "invoices" | "estimates";

/* ── Invoice status config ── */
const invoiceStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

/* ── Estimate status config ── */
const estimateStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "default" },
  accepted: { label: "Accepted", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
};

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payments() {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: estimates = [], isLoading: estimatesLoading } = useEstimatesList();

  const [activeTab, setActiveTab] = useState<ActiveTab>("invoices");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [estimateFilter, setEstimateFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateListItem | null>(null);

  /* ── Invoice stats ── */
  const invoiceStats = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const received = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    return { totalBilled, received, pending, overdue };
  }, [invoices]);

  /* ── Estimate stats ── */
  const estimateStats = useMemo(() => {
    const total = estimates.length;
    const accepted = estimates.filter((e) => e.status === "accepted").length;
    const pendingSent = estimates.filter((e) => e.status === "sent" || e.status === "viewed").length;
    const expired = estimates.filter((e) => {
      if (e.status === "accepted") return false;
      return new Date(e.valid_until) < new Date();
    }).length;
    return { total, accepted, pendingSent, expired };
  }, [estimates]);

  /* ── Filtered lists ── */
  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === "all") return invoices;
    return invoices.filter((i) => i.status === invoiceFilter);
  }, [invoices, invoiceFilter]);

  const filteredEstimates = useMemo(() => {
    if (estimateFilter === "all") return estimates;
    if (estimateFilter === "expired") {
      return estimates.filter((e) => e.status !== "accepted" && new Date(e.valid_until) < new Date());
    }
    return estimates.filter((e) => e.status === estimateFilter);
  }, [estimates, estimateFilter]);

  const isLoading = activeTab === "invoices" ? invoicesLoading : estimatesLoading;

  return (
    <AdminLayout title="Financial Hub">
      <div className="space-y-4">
        {/* ── Main Tabs (Catalog pattern) ── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as ActiveTab);
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
              <TabsTrigger
                value="invoices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Receipt className="w-4 h-4 mr-1.5" />
                Invoices
              </TabsTrigger>
              <TabsTrigger
                value="estimates"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                Estimates
              </TabsTrigger>
            </TabsList>

            {activeTab === "invoices" && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nova Fatura
              </Button>
            )}
          </div>
        </Tabs>

        {/* ── Stats Cards ── */}
        {activeTab === "invoices" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Faturado", value: fmt(invoiceStats.totalBilled), icon: FileText, color: "text-foreground" },
              { label: "Recebido", value: fmt(invoiceStats.received), icon: CheckCircle, color: "text-green-600" },
              { label: "Pendente", value: fmt(invoiceStats.pending), icon: Clock, color: "text-amber-600" },
              { label: "Vencido", value: fmt(invoiceStats.overdue), icon: AlertTriangle, color: "text-destructive" },
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
              { label: "Total Estimates", value: String(estimateStats.total), icon: ClipboardList, color: "text-foreground" },
              { label: "Accepted", value: String(estimateStats.accepted), icon: CheckCircle, color: "text-green-600" },
              { label: "Pending", value: String(estimateStats.pendingSent), icon: Send, color: "text-amber-600" },
              { label: "Expired", value: String(estimateStats.expired), icon: CalendarClock, color: "text-destructive" },
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
        {activeTab === "invoices" ? (
          <Tabs value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <TabsList>
              <TabsTrigger value="all">Todas ({invoices.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <Tabs value={estimateFilter} onValueChange={setEstimateFilter}>
            <TabsList>
              <TabsTrigger value="all">Todas ({estimates.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : activeTab === "invoices" ? (
          filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
                <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Criar primeira fatura
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
                            Vence {format(new Date(inv.due_date), "MMM dd")}
                          </p>
                        </div>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : filteredEstimates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum estimate encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimates são criados a partir do fluxo de projeto
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredEstimates.map((est) => {
              const isExpired = new Date(est.valid_until) < new Date() && est.status !== "accepted";
              const sc = isExpired
                ? { label: "Expired", variant: "destructive" as const }
                : estimateStatusConfig[est.status] || estimateStatusConfig.draft;

              // Show the selected tier price if accepted, otherwise show the range
              const priceDisplay = est.selected_tier
                ? fmt(est[`${est.selected_tier}_price` as keyof EstimateListItem] as number)
                : `${fmt(est.good_price)} – ${fmt(est.best_price)}`;

              return (
                <Card
                  key={est.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedEstimate(est)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{est.proposal_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {est.customers?.full_name || est.projects?.customer_name || "—"} · {est.projects?.project_type || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-bold text-foreground">{priceDisplay}</p>
                        <p className="text-xs text-muted-foreground">
                          {est.selected_tier
                            ? `Tier: ${est.selected_tier.charAt(0).toUpperCase() + est.selected_tier.slice(1)}`
                            : `Válido até ${format(new Date(est.valid_until), "MMM dd")}`}
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

      <NewInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <InvoiceDetailsSheet
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      />
      <EstimateDetailsSheet
        estimate={selectedEstimate}
        open={!!selectedEstimate}
        onOpenChange={(open) => !open && setSelectedEstimate(null)}
      />
    </AdminLayout>
  );
}
