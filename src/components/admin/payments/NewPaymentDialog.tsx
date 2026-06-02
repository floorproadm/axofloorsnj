import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCreatePayment } from "@/hooks/usePayments";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Loader2 } from "lucide-react";

interface Project {
  id: string;
  customer_name: string;
  project_type: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: "received" | "labor" | "material" | "other";
}

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

const RECURRENCE_OPTIONS = [
  { value: "none", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export function NewPaymentDialog({ open, onOpenChange, defaultCategory = "received" }: Props) {
  const isIncome = defaultCategory === "received";
  const [projects, setProjects] = useState<Project[]>([]);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState<string>("none");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPayment = useCreatePayment();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      supabase
        .from("projects")
        .select("id, customer_name, project_type")
        .order("created_at", { ascending: false })
        .then(({ data }) => setProjects(data || []));
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setCategory(defaultCategory);
      setRecurrence("none");
      setReceiptUrl(null);
    }
  }, [open, defaultCategory]);

  const resetForm = () => {
    setProjectId("");
    setAmount("");
    setPaymentMethod("");
    setDescription("");
    setNotes("");
    setRecurrence("none");
    setReceiptUrl(null);
  };

  const handleReceiptUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    setUploadingReceipt(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      setReceiptUrl(data.publicUrl);
      toast({ title: "Receipt attached" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) return;
    createPayment.mutate(
      {
        project_id: projectId || null,
        category: isIncome ? "received" : category,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod || null,
        status: "pending",
        description: description || null,
        notes: notes || null,
        recurrence: !isIncome && recurrence !== "none" ? (recurrence as any) : null,
        recurrence_next_date: !isIncome && recurrence !== "none" ? paymentDate : null,
        receipt_photo_url: !isIncome ? receiptUrl : null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isIncome ? "Record Income" : "Record Expense"}</DialogTitle>
        </DialogHeader>

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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-3xl font-bold border-none shadow-none text-center w-48 h-auto p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Expense Category + Recurrence */}
          {!isIncome && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recurrence</Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}


          <div>
            <Label>Project {!isIncome && "(optional)"}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
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
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            {(isIncome || category === "labor") && (
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Method..." /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isIncome ? "e.g. 50% deposit..." : category === "labor" ? "e.g. Crew wages week 1, John daily rate..." : "e.g. Sanding supplies, stain..."}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
          </div>

          {!isIncome && (
            <div>
              <Label>Receipt Photo (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReceiptUpload(f);
                  e.target.value = "";
                }}
              />
              {receiptUrl ? (
                <div className="mt-2 relative inline-block">
                  <img src={receiptUrl} alt="Receipt" className="h-24 w-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => setReceiptUrl(null)}
                    className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingReceipt}
                >
                  {uploadingReceipt ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Camera className="h-4 w-4 mr-2" /> Attach Receipt</>
                  )}
                </Button>
              )}
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={createPayment.isPending || !amount}>
            {createPayment.isPending ? "Saving..." : isIncome ? "Record Income" : "Record Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
