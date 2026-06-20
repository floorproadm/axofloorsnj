import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2, Ruler } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  leadId: string;
  organizationId: string;
}

type Area = {
  id: string;
  measurement_id: string;
  room_name: string;
  area_sqft: number;
  service_type: string | null;
};

export function LeadMeasurementsTab({ leadId, organizationId }: Props) {
  const qc = useQueryClient();
  const [newRoom, setNewRoom] = useState('');
  const [newSqft, setNewSqft] = useState('');
  const [newService, setNewService] = useState('');

  // Ensure a single measurement record exists for this lead
  const { data: measurement, isLoading: loadingM } = useQuery({
    queryKey: ['lead-measurement', leadId],
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('lead_measurements' as any)
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      if (existing) return existing as any;
      const { data, error } = await supabase
        .from('lead_measurements' as any)
        .insert({ lead_id: leadId, organization_id: organizationId, status: 'draft' })
        .select('*')
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: areas = [], isLoading: loadingA } = useQuery({
    queryKey: ['lead-measurement-areas', measurement?.id],
    enabled: !!measurement?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_measurement_areas' as any)
        .select('*')
        .eq('measurement_id', measurement.id)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as any as Area[];
    },
  });

  const addArea = useMutation({
    mutationFn: async () => {
      if (!measurement?.id) return;
      const sqft = parseFloat(newSqft) || 0;
      if (!newRoom.trim() || sqft <= 0) {
        throw new Error('Informe nome do ambiente e sqft');
      }
      const { error } = await supabase.from('lead_measurement_areas' as any).insert({
        measurement_id: measurement.id,
        room_name: newRoom.trim(),
        area_sqft: sqft,
        area_type: 'floor',
        service_type: newService.trim() || null,
        display_order: areas.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewRoom(''); setNewSqft(''); setNewService('');
      qc.invalidateQueries({ queryKey: ['lead-measurement-areas', measurement?.id] });
      qc.invalidateQueries({ queryKey: ['lead-measurement', leadId] });
      toast.success('Ambiente adicionado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao adicionar'),
  });

  const removeArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_measurement_areas' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-measurement-areas', measurement?.id] });
      qc.invalidateQueries({ queryKey: ['lead-measurement', leadId] });
    },
  });

  const total = areas.reduce((s, a) => s + Number(a.area_sqft || 0), 0);

  if (loadingM || loadingA) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Ruler className="w-4 h-4" /> Medidas dos ambientes
      </div>

      {areas.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-4 text-center border rounded-md bg-muted/20">
          Nenhum ambiente cadastrado ainda.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Ambiente</th>
                <th className="text-right px-3 py-2 font-medium">Sqft</th>
                <th className="text-left px-3 py-2 font-medium">Serviço</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2">{a.room_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(a.area_sqft).toFixed(0)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.service_type || '—'}</td>
                  <td className="px-2 py-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeArea.mutate(a.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t font-semibold">
              <tr>
                <td className="px-3 py-2 text-xs uppercase text-muted-foreground">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">{total.toFixed(0)} sqft</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="grid grid-cols-12 gap-2">
        <Input className="col-span-5 h-9 text-sm" placeholder="Ambiente (ex: Sala)" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} />
        <Input className="col-span-3 h-9 text-sm" type="number" placeholder="Sqft" value={newSqft} onChange={(e) => setNewSqft(e.target.value)} />
        <Input className="col-span-4 h-9 text-sm" placeholder="Serviço (opcional)" value={newService} onChange={(e) => setNewService(e.target.value)} />
      </div>
      <Button size="sm" className="w-full gap-1.5" onClick={() => addArea.mutate()} disabled={addArea.isPending}>
        {addArea.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        Adicionar ambiente
      </Button>

      <p className="text-[11px] text-muted-foreground italic">
        Estas medidas serão transferidas automaticamente para o projeto ao converter o lead.
      </p>
    </div>
  );
}
