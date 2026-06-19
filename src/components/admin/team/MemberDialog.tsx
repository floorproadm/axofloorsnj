import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  daily_rate: number | null;
  employment_type: string | null;
  is_active_crew: boolean | null;
  color: string | null;
}

const ROLES = [
  { value: "technician", label: "Técnico" },
  { value: "partner", label: "Parceiro" },
  { value: "subcontractor", label: "Subcontratado" },
  { value: "admin", label: "Admin" },
];

const COLORS = ["#1e3a5f", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: TeamMember | null;
}

export function MemberDialog({ open, onOpenChange, editing }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("technician");
  const [rate, setRate] = useState("0");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setFullName(editing.full_name || "");
      setEmail(editing.email || "");
      setPhone(editing.phone || "");
      setRole(editing.role || "technician");
      setRateMode(editing.employment_type === "hourly" ? "hour" : "day");
      setRate(String(editing.daily_rate || 0));
      setColor(editing.color || COLORS[0]);
    } else {
      setFullName(""); setEmail(""); setPhone("");
      setRole("technician"); setRateMode("day"); setRate("0"); setColor(COLORS[0]);
    }
  }, [open, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        role,
        daily_rate: Number(rate) || 0,
        employment_type: rateMode === "hour" ? "hourly" : "daily",
        is_active_crew: true,
        color,
      };
      if (editing) {
        const { error } = await (supabase as any).from("profiles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: editing ? "Membro atualizado" : "Membro adicionado" });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Membro" : "Adicionar Membro"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Taxa de pagamento *</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex bg-muted rounded-md p-0.5">
                {(["hour", "day"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRateMode(m)}
                    className={`px-3 py-1 text-xs rounded ${
                      rateMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    ${m === "hour" ? "/hora" : "/dia"}
                  </button>
                ))}
              </div>
              <Input
                type="number" min={0} step="0.01"
                value={rate} onChange={(e) => setRate(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label>Cor de identificação</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={!fullName || !email || save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
);
