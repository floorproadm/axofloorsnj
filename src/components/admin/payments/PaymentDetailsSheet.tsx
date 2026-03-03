import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Pencil, Trash2 } from "lucide-react";
import { Payment, useUpdatePaymentStatus, useUpdatePayment, useDeletePayment } from "@/hooks/usePayments";
import { supabase } from "@/integrations/supabase/client";
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

const EXPENSE_CATEGORIES = [
  { value: "labor", label: "Labor" },
  { value: "material", label: "Material" },
  { value: "other", label: "Other" },
];

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

interface Project {
  id: string;
  customer_name: string;
  project_type: string;
}

interface Props {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsSheet({ payment, open, onOpenChange }: Props) {
  const updateStatus = useUpdatePaymentStatus();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  // Edit form state
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMethod, setEditMethod] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Load projects when editing
  useEffect(() => {
    if (isEditing) {
      supabase
        .from("projects")
        .select("id, customer_name, project_type")
        .order("created_at", { ascending: false })
        .then(({ data }) => setProjects(data || []));
    }
  }, [isEditing]);

  // Populate form when entering edit mode
  const startEditing = () => {
    if (!payment) return;
    setEditAmount(String(payment.amount));
    setEditCategory(payment.category);
    setEditProjectId(payment.project_id || "");
    setEditDate(payment.payment_date);
    setEditMethod(payment.payment_method || "");
    setEditDescription(payment.description || "");
    setEditNotes(payment.notes || "");
    setIsEditing(true);
  };

  const discardEditing = () => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  };

  const handleDelete = () => {
    if (!payment) return;
    deletePayment.mutate(payment.id, {
      onSuccess: () => {
        setIsEditing(false);
        onOpenChange(false);
      },
    });
  };

  const handleSave = () => {
    if (!payment || !editAmount || Number(editAmount) <= 0) return;
    updatePayment.mutate(
      {
        id: payment.id,
        amount: Number(editAmount),
        category: editCategory,
        project_id: editProjectId || null,
        payment_date: editDate,
        payment_method: editMethod || null,
        description: editDescription || null,
        notes: editNotes || null,
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  if (!payment) return null;

  const cat = categoryConfig[payment.category] || categoryConfig.other;
  const sc = statusConfig[payment.status] || statusConfig.pending;
  const isIncome = payment.category === "received";

  const handleConfirm = () => updateStatus.mutate({ id: payment.id, status: "confirmed" });
  const handleCancel = () => updateStatus.mutate({ id: payment.id, status: "cancelled" });

  const fmt = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setIsEditing(false); setShowDeleteConfirm(false); setDeleteConfirmText(""); } onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isEditing ? "Edit Payment" : "Payment Details"}
            <Badge variant={sc.variant}>{sc.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {isEditing ? (
            /* ── EDIT MODE ── */
            <div className="space-y-4">
              {/* Big Amount Input */}
              <div className="text-center py-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Amount</Label>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-3xl font-light text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-3xl md:text-[2rem] font-bold border-none shadow-none text-center w-48 md:w-52 h-auto p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Category (expense only) */}
              {!isIncome && (
                <div>
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Project */}
              <div>
                <Label>Project {!isIncome && "(optional)"}</Label>
                <Select value={editProjectId} onValueChange={setEditProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.customer_name} — {p.project_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={editMethod} onValueChange={setEditMethod}>
                    <SelectTrigger><SelectValue placeholder="Method..." /></SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="e.g. 50% deposit..." />
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSave} disabled={updatePayment.isPending || !editAmount}>
                  {updatePayment.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button className="flex-1" variant="outline" onClick={discardEditing}>
                  Discard
                </Button>
              </div>

              <Separator />

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-center text-xs text-destructive hover:underline py-1"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Delete this payment
                </button>
              ) : (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-3">
                  <p className="text-sm text-destructive font-medium">This action is permanent. Type DELETE to confirm.</p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="text-center"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="destructive"
                      disabled={deleteConfirmText !== "DELETE" || deletePayment.isPending}
                      onClick={handleDelete}
                    >
                      {deletePayment.isPending ? "Deleting..." : "Delete Permanently"}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <>
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
                  <Button className="w-full" variant="outline" onClick={startEditing}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Payment
                  </Button>
                  <Button className="w-full" onClick={handleConfirm}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm Payment
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleCancel}>
                    <XCircle className="w-4 h-4 mr-2" /> Cancel Payment
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
