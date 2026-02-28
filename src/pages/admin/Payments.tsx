import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { NewInvoiceDialog } from "@/components/admin/payments/NewInvoiceDialog";
import { InvoiceDetailsSheet } from "@/components/admin/payments/InvoiceDetailsSheet";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

export default function Payments() {
  const { data: invoices = [], isLoading } = useInvoices();
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const received = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total_amount || 0), 0);
    return { totalBilled, received, pending, overdue };
  }, [invoices]);

  const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AdminLayout title="Payments & Invoices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments & Invoices</h1>
            <p className="text-sm text-muted-foreground">Gerenciar faturas e pagamentos de projetos</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Fatura
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Faturado", value: fmt(stats.totalBilled), icon: FileText, color: "text-foreground" },
            { label: "Recebido", value: fmt(stats.received), icon: CheckCircle, color: "text-green-600" },
            { label: "Pendente", value: fmt(stats.pending), icon: Clock, color: "text-amber-600" },
            { label: "Vencido", value: fmt(stats.overdue), icon: AlertTriangle, color: "text-destructive" },
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

        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Todas ({invoices.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Invoice List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando faturas...</div>
        ) : filtered.length === 0 ? (
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
            {filtered.map((inv) => {
              const sc = statusConfig[inv.status] || statusConfig.draft;
              return (
                <Card
                  key={inv.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-foreground">{inv.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {inv.projects?.customer_name || "—"} · {inv.projects?.project_type || ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-bold text-foreground">
                          {fmt(Number(inv.total_amount || 0))}
                        </p>
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
        )}
      </div>

      <NewInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <InvoiceDetailsSheet
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      />
    </AdminLayout>
  );
}
