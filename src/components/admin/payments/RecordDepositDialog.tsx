import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCreatePayment } from "@/hooks/usePayments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DepositType = "job" | "proposal" | "retainer";
const TYPE_LABEL: Record<DepositType, string> = {
  job: "Depósito de Job",
  proposal: "Depósito de Proposta",
  retainer: "Retainer",
};

export function RecordDepositDialog({ open, onOpenChange }: Props) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<DepositType>("job");
  const [customerQ, setCustomerQ] = useState("");
  const [customers, setCustomers] = useState<{ id: string; full_name: string }[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [method, setMethod] = useState("credit_card");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const createPayment = useCreatePayment();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("customers")
      .select("id, full_name")
      .order("full_name", { ascending: true })
      .limit(200)
      .then(({ data }) => setCustomers(data || []));
  }, [open]);

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(customerQ.toLowerCase())
  );

  const reset = () => {
    setAmount(""); setType("job"); setCustomerQ(""); setCustomerId("");
    setMethod("credit_card"); setNotes(""); setDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    const customerLabel = customers.find((c) => c.id === customerId)?.full_name;
    await createPayment.mutateAsync({
      category: "received",
      amount: n,
      payment_date: date,
      payment_method: method,
      status: "confirmed",
      description: `[DEPOSIT:${type}]${customerLabel ? ` ${customerLabel}` : ""}`,
      notes: notes || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Deposit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number" min={0} step="0.01" inputMode="decimal"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as DepositType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABEL) as DepositType[]).map((k) => (
                  <SelectItem key={k} value={k}>{TYPE_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Customer</Label>
            <Input
              placeholder="Search customer..."
              value={customerQ}
              onChange={(e) => { setCustomerQ(e.target.value); setCustomerId(""); }}
            />
            {customerQ && !customerId && filtered.length > 0 && (
              <div className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-popover">
                {filtered.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCustomerId(c.id); setCustomerQ(c.full_name); }}
                    className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    {c.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Payment Method *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!amount || createPayment.isPending}>
            {createPayment.isPending ? "Saving..." : "Record Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
