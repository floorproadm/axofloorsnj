import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2, ListChecks } from "lucide-react";
import { AXO_ORG_ID } from "@/lib/constants";

interface CatalogRow {
  id: string;
  service_name: string;
  unit: string;
  is_active: boolean;
  display_order: number;
  _dirty?: boolean;
  _new?: boolean;
}

const UNITS = ["sqft", "step", "linear ft", "unit"];

export default function B2BPricingSettings() {
  const { toast } = useToast();
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("b2b_price_list" as any)
      .select("id, service_name, unit, is_active, display_order")
      .eq("organization_id", AXO_ORG_ID)
      .order("display_order", { ascending: true });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<CatalogRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch, _dirty: true } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      id: `new-${Date.now()}`,
      service_name: "",
      unit: "sqft",
      is_active: true,
      display_order: (prev[prev.length - 1]?.display_order ?? 0) + 10,
      _dirty: true,
      _new: true,
    }]);
  };

  const removeRow = async (row: CatalogRow) => {
    if (row._new) {
      setRows(prev => prev.filter(r => r.id !== row.id));
      return;
    }
    const { error } = await supabase.from("b2b_price_list" as any).delete().eq("id", row.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setRows(prev => prev.filter(r => r.id !== row.id));
    toast({ title: "Serviço removido" });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const r of rows.filter(r => r._dirty)) {
        if (!r.service_name.trim()) continue;
        if (r._new) {
          const { error } = await supabase.from("b2b_price_list" as any).insert({
            organization_id: AXO_ORG_ID,
            service_name: r.service_name,
            unit: r.unit,
            is_active: r.is_active,
            display_order: r.display_order,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("b2b_price_list" as any).update({
            service_name: r.service_name,
            unit: r.unit,
            is_active: r.is_active,
            display_order: r.display_order,
          }).eq("id", r.id);
          if (error) throw error;
        }
      }
      toast({ title: "Catálogo B2B salvo" });
      await load();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const dirtyCount = rows.filter(r => r._dirty).length;

  return (
    <Card className="border-l-4 border-l-primary p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold">Catálogo de Serviços B2B</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de serviços disponíveis ao montar cotações para parceiros. O preço é definido caso a caso na cotação — cada job tem sua particularidade.
          </p>
        </div>
        <Button onClick={saveAll} disabled={saving || dirtyCount === 0} size="sm" className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar {dirtyCount > 0 ? `(${dirtyCount})` : ""}
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_80px_40px] gap-2 px-3 py-2 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          <div>Serviço</div>
          <div>Unidade</div>
          <div className="text-center">Ativo</div>
          <div></div>
        </div>
        <div className="divide-y divide-border">
          {rows.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">Nenhum serviço cadastrado</div>
          )}
          {rows.map(r => (
            <div key={r.id} className="grid grid-cols-[1fr_140px_80px_40px] gap-2 px-3 py-2 items-center">
              <Input
                value={r.service_name}
                onChange={e => update(r.id, { service_name: e.target.value })}
                placeholder="Nome do serviço (ex: Sand & Refinish)"
                className="h-8"
              />
              <Select value={r.unit} onValueChange={v => update(r.id, { unit: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex justify-center">
                <Switch checked={r.is_active} onCheckedChange={v => update(r.id, { is_active: v })} />
              </div>
              <button onClick={() => removeRow(r)} className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
        <Plus className="w-4 h-4" /> Adicionar serviço
      </Button>
    </Card>
  );
}
