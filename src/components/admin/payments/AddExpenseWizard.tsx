import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCreatePayment } from "@/hooks/usePayments";
import { Upload, Check } from "lucide-react";
import { EXPENSE_CATEGORIES, expenseCategoryBadgeClass, paymentCategoryFor } from "./expenseCategories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Project { id: string; customer_name: string; project_type: string; }

export function AddExpenseWizard({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [pickedSaved, setPickedSaved] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [reimbursable, setReimbursable] = useState(false);
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedExpenses, setSavedExpenses] = useState<{ description: string; amount: number }[]>([]);

  const createPayment = useCreatePayment();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("projects")
      .select("id, customer_name, project_type, status")
      .in("status", ["planning", "in_progress"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects((data as any) || []));
    // Frequent saved expenses: top recurring expense descriptions
    supabase
      .from("payments")
      .select("description, amount")
      .neq("category", "received")
      .limit(50)
      .then(({ data }) => {
        const map = new Map<string, { description: string; amount: number; n: number }>();
        (data || []).forEach((p: any) => {
          if (!p.description) return;
          const key = p.description;
          const existing = map.get(key);
          if (existing) { existing.n++; }
          else map.set(key, { description: key, amount: Number(p.amount), n: 1 });
        });
        setSavedExpenses(
          Array.from(map.values()).sort((a, b) => b.n - a.n).slice(0, 8)
        );
      });
  }, [open]);

  const date = useMemo(() => {
    if (dateMode === "today") return new Date().toISOString().slice(0, 10);
    if (dateMode === "yesterday") {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    return customDate;
  }, [dateMode, customDate]);

  const reset = () => {
    setStep(1); setAmount(""); setPickedSaved(""); setCategory("");
    setDateMode("today"); setVendor(""); setProjectId(""); setReimbursable(false);
    setNotes(""); setReceiptFile(null);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const canNext = () => {
    if (step === 1) return Number(amount) > 0;
    if (step === 2) return !!category;
    return true;
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;
    const ext = receiptFile.name.split(".").pop();
    const path = `expense/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("project-photos").upload(path, receiptFile);
    if (error) return null;
    const { data } = supabase.storage.from("project-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const submit = async () => {
    const receiptUrl = await uploadReceipt();
    const vendorTag = vendor ? ` @ ${vendor}` : "";
    const reimbTag = reimbursable ? " [REIMBURSABLE]" : "";
    await createPayment.mutateAsync({
      category: paymentCategoryFor(category),
      amount: Number(amount),
      payment_date: date,
      status: "confirmed",
      description: `[${category}]${vendorTag}${reimbTag}`,
      notes: notes || null,
      project_id: projectId || null,
      receipt_photo_url: receiptUrl,
    });
    close(false);
  };

  const cat = EXPENSE_CATEGORIES.find((c) => c.key === category);
  const projectLabel = projects.find((p) => p.id === projectId)?.customer_name;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense — Step {step} of 5</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Step 1 — Amount */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>Amount ($) *</Label>
              <Input
                type="number" min={0} step="0.01" inputMode="decimal"
                value={amount} onChange={(e) => { setAmount(e.target.value); setPickedSaved(""); }}
                placeholder="0.00" autoFocus
              />
            </div>
            {savedExpenses.length > 0 && (
              <div>
                <Label className="text-xs">Pick from saved expenses</Label>
                <Select
                  value={pickedSaved}
                  onValueChange={(v) => {
                    setPickedSaved(v);
                    const found = savedExpenses.find((e) => e.description === v);
                    if (found) setAmount(String(found.amount));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Frequent expenses..." /></SelectTrigger>
                  <SelectContent>
                    {savedExpenses.map((e) => (
                      <SelectItem key={e.description} value={e.description}>
                        {e.description} · ${e.amount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Category */}
        {step === 2 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map((c) => {
              const isActive = category === c.key;
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 bg-background"
                  }`}
                >
                  <div className={`p-2 rounded-md ${c.bgClass}`}>
                    <Icon className={`w-4 h-4 ${c.textClass}`} />
                  </div>
                  <span className="text-xs font-medium">{c.key}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3 — Details */}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <Label>Date</Label>
              <div className="flex gap-2 mt-1">
                {(["today", "yesterday", "custom"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDateMode(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      dateMode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {m === "today" ? "Today" : m === "yesterday" ? "Yesterday" : "Custom"}
                  </button>
                ))}
              </div>
              {dateMode === "custom" && (
                <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="mt-2" />
              )}
            </div>
            <div>
              <Label>Vendor</Label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Home Depot, Shell..." />
            </div>
            <div>
              <Label>Assign to Job</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.customer_name} — {p.project_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="reimb" checked={reimbursable} onCheckedChange={(v) => setReimbursable(!!v)} />
              <Label htmlFor="reimb" className="cursor-pointer">Reimbursable</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 4 — Receipt */}
        {step === 4 && (
          <div>
            <Label>Receipt (optional)</Label>
            <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {receiptFile ? receiptFile.name : "Click to upload photo or PDF"}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </label>
            {receiptFile && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setReceiptFile(null)}>
                Remove
              </Button>
            )}
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <div className="space-y-2 text-sm">
            <Row k="Amount" v={`$${Number(amount).toFixed(2)}`} />
            <Row k="Category" v={cat?.key || "—"} />
            <Row k="Date" v={date} />
            <Row k="Vendor" v={vendor || "—"} />
            <Row k="Job" v={projectLabel || "—"} />
            <Row k="Reimbursable" v={reimbursable ? "Yes" : "No"} />
            <Row k="Notes" v={notes || "—"} />
            <Row k="Receipt" v={receiptFile ? receiptFile.name : "—"} />
          </div>
        )}

        <DialogFooter>
          {step > 1 && <Button variant="outline" onClick={back}>Back</Button>}
          {step < 5 ? (
            <Button onClick={next} disabled={!canNext()}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={createPayment.isPending}>
              <Check className="w-4 h-4 mr-1" />
              {createPayment.isPending ? "Saving..." : "Create Expense"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-border last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
