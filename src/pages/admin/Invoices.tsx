import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  Eye,
} from "lucide-react";
import { format } from "date-fns";

import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { NewInvoiceDialog } from "@/components/admin/payments/NewInvoiceDialog";
import { InvoiceDetailsSheet } from "@/components/admin/payments/InvoiceDetailsSheet";

const invoiceStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

  useEffect(() => {
    const invoiceId = searchParams.get("invoice");
    if (invoiceId && invoices.length > 0 && !selectedInvoice) {
      const found = invoices.find((i) => i.id === invoiceId);
      if (found) setSelectedInvoice(found);
    }
    const filter = searchParams.get("filter");
    if (filter === "unpaid") setInvoiceFilter("sent");
  }, [searchParams, invoices]);

  const clearUrlParam = (key: string) => {
    if (searchParams.has(key)) {
      const next = new URLSearchParams(searchParams);
      next.delete(key);
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <AdminLayout title="Invoices">
      <div className="space-y-4">
        

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Billed", value: fmt(invoiceStats.totalBilled), icon: FileText, color: "text-foreground" },
            { label: "Received", value: fmt(invoiceStats.received), icon: CheckCircle, color: "text-green-600" },
            { label: "Pending", value: fmt(invoiceStats.pending), icon: Clock, color: "text-amber-600" },
            { label: "Overdue", value: fmt(invoiceStats.overdue), icon: AlertTriangle, color: "text-destructive" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`shrink-0 p-2 rounded-lg bg-muted ${s.color}`}>
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                    <p className={`text-sm sm:text-lg font-bold ${s.color} truncate`} title={s.value}>{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <Tabs value={invoiceFilter} onValueChange={setInvoiceFilter} className="min-w-0 w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto overflow-x-auto no-scrollbar justify-start">
              <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => setInvoiceDialogOpen(true)} className="w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            New Invoice
          </Button>
        </div>

        {isLoading ? (
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
              const isViewed = !!inv.viewed_at;
              const viewedRecently = isViewed && (Date.now() - new Date(inv.viewed_at!).getTime()) < 5 * 60 * 1000;
              return (
                <Card
                  key={inv.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{inv.invoice_number}</p>
                        {isViewed && (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                            viewedRecently && "animate-pulse"
                          )}>
                            <Eye className="w-3 h-3" />
                            Viewed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {inv.projects?.customer_name || "—"} · {inv.projects?.project_type || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
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

      <NewInvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} />
      <InvoiceDetailsSheet
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoice(null);
            clearUrlParam("invoice");
          }
        }}
      />
    </AdminLayout>
  );
}
