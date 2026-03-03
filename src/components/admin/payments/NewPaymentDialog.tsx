import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCreatePayment } from "@/hooks/usePayments";

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
  const createPayment = useCreatePayment();

  useEffect(() => {
    if (open) {
      supabase
        .from("projects")
        .select("id, customer_name, project_type")
        .order("created_at", { ascending: false })
        .then(({ data }) => setProjects(data || []));
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setCategory(defaultCategory);
    }
  }, [open, defaultCategory]);

  const resetForm = () => {
    setProjectId("");
    setAmount("");
    setPaymentMethod("");
    setDescription("");
    setNotes("");
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

          {/* Expense Category */}
          {!isIncome && (
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
            {isIncome && (
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
              placeholder={isIncome ? "e.g. 50% deposit..." : "e.g. Sanding crew week 1..."}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={createPayment.isPending || !amount}>
            {createPayment.isPending ? "Saving..." : isIncome ? "Record Income" : "Record Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
