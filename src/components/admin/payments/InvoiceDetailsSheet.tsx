import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, Send, XCircle, Trash2 } from "lucide-react";
import { Invoice, useInvoiceItems, useUpdateInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { useState } from "react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsSheet({ invoice, open, onOpenChange }: Props) {
  const { data: items = [] } = useInvoiceItems(invoice?.id ?? null);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const [paymentMethod, setPaymentMethod] = useState("");

  if (!invoice) return null;

  const sc = statusConfig[invoice.status] || statusConfig.draft;

  const handleMarkPaid = () => {
    updateStatus.mutate({ id: invoice.id, status: "paid", payment_method: paymentMethod || undefined });
  };

  const handleSend = () => {
    updateStatus.mutate({ id: invoice.id, status: "sent" });
  };

  const handleCancel = () => {
    updateStatus.mutate({ id: invoice.id, status: "cancelled" });
  };

  const handleDelete = () => {
    deleteInvoice.mutate(invoice.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {invoice.invoice_number}
            <Badge variant={sc.variant}>{sc.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{invoice.projects?.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Projeto</p>
              <p className="font-medium">{invoice.projects?.project_type || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vencimento</p>
              <p className="font-medium">{format(new Date(invoice.due_date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-lg">${Number(invoice.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            {invoice.paid_at && (
              <div>
                <p className="text-muted-foreground">Pago em</p>
                <p className="font-medium">{format(new Date(invoice.paid_at), "MMM dd, yyyy")}</p>
              </div>
            )}
            {invoice.payment_method && (
              <div>
                <p className="text-muted-foreground">Método</p>
                <p className="font-medium capitalize">{invoice.payment_method.replace("_", " ")}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Itens</h4>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.description}</span>
                    <span className="text-muted-foreground">
                      {item.quantity} × ${Number(item.unit_price).toFixed(2)} = ${Number(item.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-1">Notas</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Ações</h4>

              {invoice.status === "draft" && (
                <Button className="w-full" variant="default" onClick={handleSend}>
                  <Send className="w-4 h-4 mr-2" /> Enviar Fatura
                </Button>
              )}

              {(invoice.status === "sent" || invoice.status === "overdue") && (
                <div className="space-y-2">
                  <Label className="text-xs">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleMarkPaid}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Pago
                  </Button>
                </div>
              )}

              <Button className="w-full" variant="outline" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar Fatura
              </Button>
            </div>
          )}

          {invoice.status === "draft" && (
            <Button className="w-full" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Excluir Fatura
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
