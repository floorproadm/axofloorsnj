import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Send, Save } from "lucide-react";
import { AXO_ORG_ID } from "@/lib/constants";

interface Partner { id: string; company_name: string; contact_name: string; email: string | null; }
interface Price { id: string; service_name: string; unit: string; wholesale_price: number; }
interface Item { service_id: string; service_name: string; unit: string; quantity: number; unit_price: number; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultPartnerId?: string | null;
  onCreated?: () => void;
}

export function B2BQuoteSheet({ open, onOpenChange, defaultPartnerId, onCreated }: Props) {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [partnerId, setPartnerId] = useState<string>("");
  const [jobAddress, setJobAddress] = useState("");
  const [partnerClient, setPartnerClient] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: ps }, { data: pr }] = await Promise.all([
        supabase.from("partners").select("id, company_name, contact_name, email").order("company_name"),
        supabase.from("b2b_price_list" as any).select("id, service_name, unit, wholesale_price").eq("organization_id", AXO_ORG_ID).eq("is_active", true).order("display_order"),
      ]);
      setPartners((ps as any) || []);
      setPrices((pr as any) || []);
      if (defaultPartnerId) setPartnerId(defaultPartnerId);
    })();
  }, [open, defaultPartnerId]);

  const reset = () => {
    setPartnerId(""); setJobAddress(""); setPartnerClient(""); setNotes("");
    setDiscount(0); setItems([]);
  };

  const addItem = () => {
    setItems(prev => [...prev, { service_id: "", service_name: "", unit: "", quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const pickService = (idx: number, serviceId: string) => {
    const p = prices.find(x => x.id === serviceId);
    if (!p) return;
    updateItem(idx, {
      service_id: p.id,
      service_name: p.service_name,
      unit: p.unit,
      unit_price: Number(p.wholesale_price),
    });
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = useMemo(() => items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0), [items]);
  const total = useMemo(() => subtotal - (subtotal * (Number(discount) || 0) / 100), [subtotal, discount]);

  const selectedPartner = partners.find(p => p.id === partnerId);

  const persist = async (status: "draft" | "sent"): Promise<string | null> => {
    if (!partnerId) { toast({ title: "Selecione um parceiro", variant: "destructive" }); return null; }
    if (items.length === 0) { toast({ title: "Adicione pelo menos 1 item", variant: "destructive" }); return null; }

    const { data, error } = await supabase.from("partner_quotes" as any).insert({
      organization_id: AXO_ORG_ID,
      partner_id: partnerId,
      job_address: jobAddress || null,
      partner_client_name: partnerClient || null,
      items: items.map(it => ({
        service_name: it.service_name,
        unit: it.unit,
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
        subtotal: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
      })),
      notes: notes || null,
      subtotal,
      discount_percent: Number(discount) || 0,
      total,
      status,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    }).select("id").single();

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return null;
    }
    return (data as any).id;
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    const id = await persist("draft");
    setBusy(false);
    if (id) {
      toast({ title: "Rascunho salvo" });
      onCreated?.(); reset(); onOpenChange(false);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedPartner?.email) {
      toast({ title: "Parceiro sem email cadastrado", variant: "destructive" }); return;
    }
    setBusy(true);
    const id = await persist("sent");
    if (!id) { setBusy(false); return; }

    const itemsHtml = items.map(it => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${it.service_name}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${it.quantity} ${it.unit}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">$${(Number(it.unit_price)||0).toFixed(2)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right"><strong>$${((Number(it.quantity)||0)*(Number(it.unit_price)||0)).toFixed(2)}</strong></td></tr>`).join("");

    const body = `<h2>Hi ${selectedPartner.contact_name || selectedPartner.company_name},</h2>
<p>Here is your B2B quote${jobAddress ? ` for <strong>${jobAddress}</strong>` : ""}${partnerClient ? ` (client: ${partnerClient})` : ""}.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr><th style="text-align:left;padding:6px 8px;background:#f7f7f7">Service</th><th style="text-align:left;padding:6px 8px;background:#f7f7f7">Qty</th><th style="text-align:right;padding:6px 8px;background:#f7f7f7">Unit</th><th style="text-align:right;padding:6px 8px;background:#f7f7f7">Subtotal</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<p style="text-align:right">Subtotal: <strong>$${subtotal.toFixed(2)}</strong>${discount > 0 ? `<br>Discount: ${discount}%` : ""}<br>Total: <strong style="font-size:18px;color:#8B6914">$${total.toFixed(2)}</strong></p>
${notes ? `<p><em>${notes.replace(/\n/g, "<br>")}</em></p>` : ""}
<p>Log in to your partner portal to accept or decline this quote.</p>
<p style="text-align:center"><a class="btn" href="https://axofloorsnj.lovable.app/partner/dashboard">Open Partner Portal</a></p>`;

    try {
      const { error: fnErr } = await supabase.functions.invoke("gmail-send", {
        body: {
          template: "__raw__",
          organization_id: AXO_ORG_ID,
          data: {
            recipient_email: selectedPartner.email,
            raw_subject: `B2B Quote from AXO Floors – $${total.toFixed(2)}`,
            raw_body: body,
            related_id: id,
            related_type: "partner_quote",
          },
        },
      });
      if (fnErr) throw fnErr;
      toast({ title: "Cotação enviada", description: `Email para ${selectedPartner.email}` });
    } catch (err: any) {
      toast({ title: "Cotação salva, mas email falhou", description: err.message, variant: "destructive" });
    }
    setBusy(false);
    onCreated?.(); reset(); onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gerar Cotação B2B</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Parceiro *</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.company_name} {p.contact_name ? `· ${p.contact_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPartner && !selectedPartner.email && (
                <p className="text-[11px] text-amber-600">Sem email — só permitirá salvar rascunho.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Cliente do Parceiro</Label>
              <Input value={partnerClient} onChange={e => setPartnerClient(e.target.value)} placeholder="Nome do cliente final" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Job Address</Label>
            <Input value={jobAddress} onChange={e => setJobAddress(e.target.value)} placeholder="Endereço do serviço" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Item</Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_70px_90px_90px_30px] gap-2 px-2 py-1.5 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <div>Serviço</div><div>Qty</div><div>$ / Unit</div><div className="text-right">Subtotal</div><div></div>
              </div>
              <div className="divide-y divide-border">
                {items.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">Nenhum item adicionado</div>}
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_90px_90px_30px] gap-2 px-2 py-2 items-center">
                    <Select value={it.service_id} onValueChange={v => pickService(idx, v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {prices.map(p => <SelectItem key={p.id} value={p.id}>{p.service_name} ({p.unit})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" min="0" step="0.01" value={it.quantity} onChange={e => updateItem(idx, { quantity: e.target.value as any })} className="h-8 tabular-nums" />
                    <Input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updateItem(idx, { unit_price: e.target.value as any })} className="h-8 tabular-nums" />
                    <div className="text-right tabular-nums text-sm font-semibold">${((Number(it.quantity)||0)*(Number(it.unit_price)||0)).toFixed(2)}</div>
                    <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes / Scope of Work</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Detalhes adicionais, escopo, condições..." />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Discount %</span>
              <Input type="number" min="0" max="100" step="0.5" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} className="h-8 w-24 tabular-nums" />
            </div>
            <div className="flex items-center justify-between text-base pt-2 border-t border-border">
              <span className="font-semibold">Total</span>
              <span className="tabular-nums font-bold text-primary text-lg">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={busy} className="flex-1 gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Rascunho
            </Button>
            <Button onClick={handleSendQuote} disabled={busy || !selectedPartner?.email} className="flex-1 gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gerar & Enviar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
