import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Send, Save, FileText, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  leadId: string;
  organizationId: string;
  customerName: string;
  budget?: number;
  onProposalSent?: () => void;
}

type LineItem = { id?: string; description: string; quantity: number; unit_price: number };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  sent: { label: 'Enviada', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  accepted: { label: 'Aceita', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  rejected: { label: 'Rejeitada', cls: 'bg-red-100 text-red-700 border-red-300' },
};

function genShareToken() {
  return crypto.getRandomValues(new Uint8Array(20)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
}

export function LeadProposalTab({ leadId, organizationId, customerName, budget, onProposalSent }: Props) {
  const qc = useQueryClient();
  const [lines, setLines] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [dirty, setDirty] = useState(false);

  // Ensure a draft proposal exists for this lead
  const { data: proposal, isLoading } = useQuery({
    queryKey: ['lead-proposal', leadId],
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('proposals' as any)
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) return existing as any;

      const number = `LP-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('proposals' as any)
        .insert({
          lead_id: leadId,
          project_id: null,
          organization_id: organizationId,
          proposal_number: number,
          status: 'draft',
          use_tiers: false,
          flat_price: budget || 0,
          good_price: 0, better_price: 0, best_price: 0,
          margin_good: 0, margin_better: 0, margin_best: 0,
          valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          share_token: genShareToken(),
        })
        .select('*').single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: dbLines } = useQuery({
    queryKey: ['lead-proposal-lines', proposal?.id],
    enabled: !!proposal?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_line_items' as any)
        .select('*')
        .eq('proposal_id', proposal.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  useEffect(() => {
    if (dbLines) {
      setLines(dbLines.map((l) => ({
        id: l.id, description: l.description || '', quantity: Number(l.quantity || 1), unit_price: Number(l.unit_price || 0),
      })));
      setDirty(false);
    }
  }, [dbLines]);

  useEffect(() => {
    if (proposal && notes === '') setNotes(proposal.client_note || '');
  }, [proposal]);

  const total = lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unit_price)), 0);
  const isLocked = proposal?.status === 'accepted';

  const updateLine = (i: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
    setDirty(true);
  };

  const addLine = () => { setLines((p) => [...p, { description: '', quantity: 1, unit_price: 0 }]); setDirty(true); };
  const removeLine = (i: number) => { setLines((p) => p.filter((_, idx) => idx !== i)); setDirty(true); };

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!proposal?.id) return;
      // Replace line items
      await supabase.from('proposal_line_items' as any).delete().eq('proposal_id', proposal.id);
      if (lines.length > 0) {
        const rows = lines.map((l, idx) => ({
          proposal_id: proposal.id,
          description: l.description || '—',
          category: 'service',
          quantity: Number(l.quantity) || 1,
          unit_price: Number(l.unit_price) || 0,
          amount: (Number(l.quantity) || 1) * (Number(l.unit_price) || 0),
          display_order: idx,
        }));
        const { error } = await supabase.from('proposal_line_items' as any).insert(rows);
        if (error) throw error;
      }
      // Update proposal total and notes
      const { error: upErr } = await supabase.from('proposals' as any).update({
        flat_price: total,
        client_note: notes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', proposal.id);
      if (upErr) throw upErr;

      // Sync lead budget
      await supabase.from('leads').update({ budget: total }).eq('id', leadId);
    },
    onSuccess: () => {
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['lead-proposal', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-proposal-lines', proposal?.id] });
      toast.success('Rascunho salvo');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar'),
  });

  const sendToClient = useMutation({
    mutationFn: async () => {
      if (!proposal?.id) return;
      await saveDraft.mutateAsync();
      const { error } = await supabase.from('proposals' as any).update({
        status: 'sent', sent_at: new Date().toISOString(),
      }).eq('id', proposal.id);
      if (error) throw error;

      // Advance lead to proposal_sent (best-effort)
      await supabase.from('leads').update({ status: 'proposal_sent' }).eq('id', leadId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-proposal', leadId] });
      toast.success('Proposta enviada — lead movido para "Proposta Enviada"');
      onProposalSent?.();
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao enviar'),
  });

  const copyLink = async () => {
    if (!proposal?.share_token) return;
    const url = `${window.location.origin}/proposal/${proposal.share_token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const statusInfo = STATUS_LABEL[proposal?.status || 'draft'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Proposta para {customerName}</span>
          <Badge variant="outline" className={statusInfo.cls}>{statusInfo.label}</Badge>
        </div>
        {proposal?.share_token && (
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={copyLink}>
            <Link2 className="w-3 h-3" /> Link público
          </Button>
        )}
      </div>

      {isLocked && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          ✅ Proposta aceita — bloqueada para edição.
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-2 py-2 font-medium">Descrição</th>
              <th className="text-right px-2 py-2 font-medium w-16">Qtd</th>
              <th className="text-right px-2 py-2 font-medium w-24">Preço unit.</th>
              <th className="text-right px-2 py-2 font-medium w-24">Total</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-muted-foreground italic">Nenhum item.</td></tr>
            )}
            {lines.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="px-1.5 py-1">
                  <Input className="h-8 text-sm border-transparent focus:border-input" value={l.description} disabled={isLocked}
                    onChange={(e) => updateLine(i, { description: e.target.value })} placeholder="Ex: Sanding sala" />
                </td>
                <td className="px-1.5 py-1">
                  <Input className="h-8 text-sm text-right" type="number" value={l.quantity} disabled={isLocked}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                </td>
                <td className="px-1.5 py-1">
                  <Input className="h-8 text-sm text-right" type="number" value={l.unit_price} disabled={isLocked}
                    onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })} />
                </td>
                <td className="px-2 py-1 text-right tabular-nums text-sm">
                  ${(Number(l.quantity) * Number(l.unit_price)).toFixed(0)}
                </td>
                <td className="px-1 py-1">
                  {!isLocked && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/30 border-t font-semibold">
            <tr>
              <td colSpan={3} className="px-3 py-2 text-xs uppercase text-muted-foreground">Total da proposta</td>
              <td className="px-2 py-2 text-right tabular-nums">${total.toFixed(0)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!isLocked && (
        <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={addLine}>
          <Plus className="w-3.5 h-3.5" /> Adicionar item
        </Button>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Observações / descrição (opcional)</label>
        <Textarea rows={3} value={notes} onChange={(e) => { setNotes(e.target.value); setDirty(true); }} disabled={isLocked} placeholder="Notas para o cliente" />
      </div>

      {!isLocked && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5"
            onClick={() => saveDraft.mutate()} disabled={!dirty || saveDraft.isPending}>
            {saveDraft.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar Rascunho
          </Button>
          <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => sendToClient.mutate()} disabled={sendToClient.isPending || total <= 0}>
            {sendToClient.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar para Cliente
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground italic">
        Ao enviar, o lead avança automaticamente para "Proposta Enviada". O valor total sincroniza com o KPI "Orçamento".
      </p>
    </div>
  );
}
