import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Payment, useUpdatePaymentStatus, useDeletePayment } from "@/hooks/usePayments";
import { format } from "date-fns";

const categoryConfig: Record<string, { label: string; color: string }> = {
  received: { label: "Received", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  labor: { label: "Labor", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  material: { label: "Material", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  other: { label: "Other", color: "bg-muted text-muted-foreground" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface Props {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsSheet({ payment, open, onOpenChange }: Props) {
  const updateStatus = useUpdatePaymentStatus();
  const deletePayment = useDeletePayment();

  if (!payment) return null;

  const cat = categoryConfig[payment.category] || categoryConfig.other;
  const sc = statusConfig[payment.status] || statusConfig.pending;

  const handleConfirm = () => updateStatus.mutate({ id: payment.id, status: "confirmed" });
  const handleCancel = () => updateStatus.mutate({ id: payment.id, status: "cancelled" });
  const handleDelete = () => deletePayment.mutate(payment.id, { onSuccess: () => onOpenChange(false) });

  const fmt = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Payment Details
            <Badge variant={sc.variant}>{sc.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Category</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cat.color}`}>
                {cat.label}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-bold text-lg">{fmt(Number(payment.amount))}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{format(new Date(payment.payment_date), "MMM dd, yyyy")}</p>
            </div>
            {payment.payment_method && (
              <div>
                <p className="text-muted-foreground">Method</p>
                <p className="font-medium capitalize">{payment.payment_method.replace("_", " ")}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-muted-foreground">Project</p>
              <p className="font-medium">
                {payment.projects
                  ? `${payment.projects.customer_name} — ${payment.projects.project_type}`
                  : "No project linked"}
              </p>
            </div>
          </div>

          {payment.description && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{payment.description}</p>
              </div>
            </>
          )}

          {payment.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {payment.status === "pending" && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Actions</h4>
              <Button className="w-full" onClick={handleConfirm}>
                <CheckCircle className="w-4 h-4 mr-2" /> Confirm Payment
              </Button>
              <Button className="w-full" variant="outline" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" /> Cancel Payment
              </Button>
            </div>
          )}

          {payment.status !== "confirmed" && (
            <Button className="w-full" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Payment
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
