import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
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
  quantity: number;
  unit_price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewInvoiceDialog({ open, onOpenChange }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
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

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

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
        items: items.filter((i) => i.description && i.unit_price > 0),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedProjectId("");
          setNotes("");
          setItems([{ description: "", quantity: 1, unit_price: 0 }]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Fatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Projeto</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger><SelectValue placeholder="Selecionar projeto..." /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.customer_name} — {p.project_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Vencimento</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Itens</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Descrição</Label>}
                    <Input
                      placeholder="Serviço..."
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                  </div>
                  <div className="w-16">
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Qtd</Label>}
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24">
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Preço</Label>}
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
              ))}
            </div>
            <div className="text-right mt-2 text-sm font-medium text-foreground">
              Total: ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações internas..." />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={createInvoice.isPending || !selectedProjectId}>
            {createInvoice.isPending ? "Criando..." : "Criar Fatura"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
