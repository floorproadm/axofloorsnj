import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Loader2, Check, X, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteItem { service_name: string; unit: string; quantity: number; unit_price: number; subtotal: number; }
interface Quote {
  id: string;
  partner_id: string;
  job_address: string | null;
  partner_client_name: string | null;
  items: QuoteItem[];
  notes: string | null;
  subtotal: number;
  discount_percent: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  created_at: string;
  sent_at: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", sent: "Enviada", accepted: "Aceita", declined: "Recusada",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-700 border-blue-200",
  accepted: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  declined: "bg-red-500/10 text-red-700 border-red-200",
};

export function PartnerQuotesTab({ partnerId }: { partnerId: string }) {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partner_quotes" as any)
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    setQuotes(((data as any) || []) as Quote[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [partnerId]);

  const respond = async (status: "accepted" | "declined") => {
    if (!selected) return;
    setActing(true);
    const stamp = status === "accepted" ? { accepted_at: new Date().toISOString() } : { declined_at: new Date().toISOString() };
    const { error } = await supabase
      .from("partner_quotes" as any)
      .update({ status, ...stamp })
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "accepted" ? "Cotação aceita" : "Cotação recusada" });
      setSelected(null);
      load();
    }
    setActing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (quotes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma cotação ainda.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {quotes.map(q => (
          <Card key={q.id} className="p-3 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setSelected(q)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-semibold border", STATUS_COLOR[q.status])}>
                    {STATUS_LABEL[q.status]}
                  </Badge>
                  {q.partner_client_name && <span className="text-xs text-muted-foreground truncate">{q.partner_client_name}</span>}
                </div>
                <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {q.job_address || "—"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(q.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold tabular-nums text-primary">${Number(q.total).toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">{q.items?.length || 0} itens</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cotação B2B</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-semibold border", STATUS_COLOR[selected.status])}>
                  {STATUS_LABEL[selected.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleDateString()}</span>
              </div>

              {selected.job_address && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Endereço</p>
                  <p className="text-sm">{selected.job_address}</p>
                </div>
              )}
              {selected.partner_client_name && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Cliente</p>
                  <p className="text-sm">{selected.partner_client_name}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Itens</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {selected.items.map((it, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{it.service_name}</p>
                        <p className="text-[11px] text-muted-foreground">{it.quantity} {it.unit} × ${Number(it.unit_price).toFixed(2)}</p>
                      </div>
                      <span className="tabular-nums font-semibold">${Number(it.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.notes && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${Number(selected.subtotal).toFixed(2)}</span></div>
                {Number(selected.discount_percent) > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Desconto</span><span className="tabular-nums">{selected.discount_percent}%</span></div>
                )}
                <div className="flex justify-between text-base pt-1 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="tabular-nums font-bold text-primary text-lg">${Number(selected.total).toFixed(2)}</span>
                </div>
              </div>

              {selected.status === "sent" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => respond("declined")} disabled={acting} className="flex-1 gap-2">
                    <X className="w-4 h-4" /> Recusar
                  </Button>
                  <Button onClick={() => respond("accepted")} disabled={acting} className="flex-1 gap-2">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aceitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
