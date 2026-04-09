import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateInvoice, generateInvoiceNumber } from "@/hooks/useInvoices";

interface Project {
  id: string;
  customer_name: string;
  project_type: string;
  customer_id: string | null;
}

interface LineItem {
  description: string;
  detail: string;
  quantity: number;
  unit_price: number;
}

interface PaymentPhase {
  phase_label: string;
  percentage: number;
  timing: string;
}

const DEFAULT_PHASES: PaymentPhase[] = [
  { phase_label: "Deposit", percentage: 30, timing: "Upon signing" },
  { phase_label: "Progress", percentage: 40, timing: "At midpoint" },
  { phase_label: "Final", percentage: 30, timing: "Upon completion" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewInvoiceDialog({ open, onOpenChange }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", detail: "", quantity: 1, unit_price: 0 }]);

  // Financial controls
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercent, setTaxPercent] = useState(6.625);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  // Status
  const [invoiceStatus, setInvoiceStatus] = useState("draft");
  const [paidMethod, setPaidMethod] = useState("");

  // Payment schedule
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [phases, setPhases] = useState<PaymentPhase[]>(DEFAULT_PHASES);

  // Expand/collapse
  const [showFinancials, setShowFinancials] = useState(false);

  const createInvoice = useCreateInvoice();

  useEffect(() => {
    if (open) {
      supabase
        .from("projects")
        .select("id, customer_name, project_type, customer_id")
        .order("created_at", { ascending: false })
        .then(({ data }) => setProjects(data || []));

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setDueDate(defaultDate.toISOString().split("T")[0]);
    }
  }, [open]);

  const addItem = () => setItems([...items, { description: "", detail: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const updatePhase = (idx: number, field: keyof PaymentPhase, value: any) => {
    const updated = [...phases];
    updated[idx] = { ...updated[idx], [field]: value };
    setPhases(updated);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = taxEnabled ? Math.round(subtotal * taxPercent) / 100 : 0;
  const total = subtotal + taxAmount - discountAmount;
  const balanceDue = total - depositAmount;

  const handleSubmit = () => {
    if (!selectedProjectId || items.length === 0 || !dueDate) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    createInvoice.mutate(
      {
        project_id: selectedProjectId,
        customer_id: project?.customer_id,
        invoice_number: generateInvoiceNumber(),
        due_date: dueDate,
        notes,
        status: invoiceStatus,
        payment_method: invoiceStatus === "paid" ? paidMethod : undefined,
        tax_percent: taxEnabled ? taxPercent : 0,
        discount_amount: discountAmount,
        deposit_amount: depositAmount,
        items: items.filter((i) => i.description && i.unit_price > 0).map(i => ({
          description: i.description,
          detail: i.detail || undefined,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        payment_phases: scheduleEnabled ? phases.filter(p => p.percentage > 0) : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedProjectId("");
          setNotes("");
          setItems([{ description: "", detail: "", quantity: 1, unit_price: 0 }]);
          setTaxEnabled(false);
          setDiscountAmount(0);
          setDepositAmount(0);
          setScheduleEnabled(false);
          setPhases(DEFAULT_PHASES);
          setShowFinancials(false);
          setInvoiceStatus("draft");
          setPaidMethod("");
        },
      }
    );
  };

  const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project */}
          <div>
            <Label>Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
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

          {/* Due date */}
          <div>
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      {idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                      <Input
                        placeholder="Service..."
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                      />
                    </div>
                    <div className="w-16">
                      {idx === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24">
                      {idx === 0 && <Label className="text-xs text-muted-foreground">Price</Label>}
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Detail/Notes per item */}
                  <Input
                    placeholder="Detail / specs (optional)"
                    className="text-xs h-8 ml-0"
                    value={item.detail}
                    onChange={(e) => updateItem(idx, "detail", e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="text-right mt-2 text-sm font-medium text-foreground">
              Subtotal: {fmt(subtotal)}
            </div>
          </div>

          {/* Financial Controls - Collapsible */}
          <div className="border border-border/50 rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 text-sm font-medium text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              onClick={() => setShowFinancials(!showFinancials)}
            >
              <span>Tax, Discount & Deposit</span>
              {showFinancials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showFinancials && (
              <div className="px-3 pb-3 space-y-3">
                {/* Tax */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
                    <Label className="text-sm">Tax</Label>
                  </div>
                  {taxEnabled && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="w-20 h-8 text-xs"
                        value={taxPercent}
                        step={0.001}
                        onChange={(e) => setTaxPercent(Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
                {taxEnabled && (
                  <p className="text-xs text-muted-foreground pl-10">Tax amount: {fmt(taxAmount)}</p>
                )}

                {/* Discount */}
                <div>
                  <Label className="text-sm">Discount ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="h-8 text-sm mt-1"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  />
                </div>

                {/* Deposit */}
                <div>
                  <Label className="text-sm">Deposit Already Paid ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="h-8 text-sm mt-1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Schedule - Collapsible */}
          <div className="border border-border/50 rounded-lg">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                <Label className="text-sm font-medium">Payment Schedule</Label>
              </div>
            </div>
            {scheduleEnabled && (
              <div className="px-3 pb-3 space-y-2">
                {phases.map((phase, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_1fr] gap-2 items-center">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Label"
                      value={phase.phase_label}
                      onChange={(e) => updatePhase(idx, "phase_label", e.target.value)}
                    />
                    <div className="flex items-center gap-0.5">
                      <Input
                        type="number"
                        className="h-8 text-xs w-12"
                        value={phase.percentage}
                        onChange={(e) => updatePhase(idx, "percentage", Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <Input
                      className="h-8 text-xs"
                      placeholder="When"
                      value={phase.timing}
                      onChange={(e) => updatePhase(idx, "timing", e.target.value)}
                    />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  Total: {phases.reduce((s, p) => s + p.percentage, 0)}% — Each phase: {phases.map(p => fmt(total * p.percentage / 100)).join(" / ")}
                </p>
              </div>
            )}
          </div>

          {/* Totals summary */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
            {taxEnabled && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxPercent}%)</span><span>{fmt(taxAmount)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between text-accent-foreground"><span>Discount</span><span>-{fmt(discountAmount)}</span></div>}
            <div className="flex justify-between font-bold border-t border-border/50 pt-1"><span>Total</span><span>{fmt(total)}</span></div>
            {depositAmount > 0 && (
              <>
                <div className="flex justify-between text-primary"><span>Deposit Paid</span><span>-{fmt(depositAmount)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Balance Due</span><span>{fmt(balanceDue)}</span></div>
              </>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={createInvoice.isPending || !selectedProjectId}>
            {createInvoice.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
