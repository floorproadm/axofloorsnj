import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  useLeadPipeline,
  type PipelineStage 
} from "@/hooks/useLeadPipeline";
import { useLeadFollowUp } from "@/hooks/useLeadFollowUp";
import { useLeadNRABatch } from "@/hooks/useLeadNRA";
import { LeadControlModal } from "@/components/admin/LeadControlModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Phone, MapPin, 
  Clock, AlertTriangle,
  LayoutGrid, List,
  UserPlus, CalendarPlus, FileText, PlusCircle,
  Loader2
} from "lucide-react";
import { differenceInHours, format } from "date-fns";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  city?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  follow_up_required?: boolean;
  next_action_date?: string;
  follow_up_actions?: { date: string; action: string; notes?: string }[];
  converted_to_project_id?: string;
};

interface LinearPipelineProps {
  leads: Lead[];
  onRefresh: () => void;
}

type ViewMode = 'board' | 'list';

// 7 sales stages (excludes in_production, completed, lost — those are in Jobs)
const SALES_STAGES: PipelineStage[] = [
  'cold_lead', 'warm_lead', 'estimate_requested', 
  'estimate_scheduled', 'in_draft', 'proposal_sent', 'proposal_rejected'
];

const sourceLabels: Record<string, string> = {
  quiz: "Quiz",
  contact_form: "Formulário",
  contact_page: "Contato",
  builders_page: "Builders",
  realtors_page: "Realtors",
  lead_magnet: "E-book",
  website: "Site"
};

const serviceLabels: Record<string, string> = {
  'new-installation': 'Installation',
  'sanding': 'Sanding',
  'refinishing': 'Refinishing',
  'staining': 'Staining',
  'repair': 'Repair',
  'vinyl': 'Vinyl',
  'baseboards': 'Baseboards',
  'staircase': 'Staircase',
};

const SERVICE_OPTIONS = Object.entries(serviceLabels);

function getTimeBadge(updatedAt: string) {
  const hours = differenceInHours(new Date(), new Date(updatedAt));
  if (hours < 24) return { text: `${hours}h`, className: 'bg-muted text-muted-foreground' };
  if (hours < 48) return { text: `${Math.round(hours)}h`, className: 'bg-amber-100 text-amber-700' };
  const days = Math.floor(hours / 24);
  return { text: `${days}d+`, className: 'bg-red-100 text-red-700 font-semibold' };
}

function getOperationalAlert(lead: Lead, nra: any) {
  if (nra?.severity === 'critical' || nra?.severity === 'blocked')
    return { text: nra.label, type: 'critical' as const };
  if (lead.follow_up_required)
    return { text: 'Follow-up obrigatório', type: 'warning' as const };
  if (nra?.action && nra.action !== 'none')
    return { text: nra.label, type: 'info' as const };
  return null;
}

/* ════════════════════════════════════════════════════════════
   QUICK ACTION MODALS
   ════════════════════════════════════════════════════════════ */

/* ─── 1. New Lead Modal ─── */
function QuickNewLeadModal({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', budget: '', notes: '' });

  const resetForm = () => setForm({ name: '', phone: '', email: '', city: '', budget: '', notes: '' });

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        city: form.city.trim() || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        notes: form.notes.trim() || null,
        lead_source: 'manual',
        // status defaults to 'cold_lead' via DB default
      });
      if (error) throw error;
      toast.success('Lead criado com sucesso');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Novo Lead Manual
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nl-name">Nome *</Label>
              <Input id="nl-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <Label htmlFor="nl-phone">Telefone *</Label>
              <Input id="nl-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(XXX) XXX-XXXX" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nl-email">Email</Label>
              <Input id="nl-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label htmlFor="nl-city">Cidade</Label>
              <Input id="nl-city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="nl-budget">Budget ($)</Label>
            <Input id="nl-budget" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0.00" />
          </div>
          <div>
            <Label htmlFor="nl-notes">Notas</Label>
            <Textarea id="nl-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Observações..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Criar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 2. New Appointment Modal ─── */
function QuickApptModal({ open, onOpenChange, leads, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [notes, setNotes] = useState('');
  const { updateLeadStatus } = useLeadPipeline();
  const { addFollowUpAction } = useLeadFollowUp();

  // Leads eligible for scheduling: early stages, not yet converted
  const eligibleLeads = useMemo(() =>
    leads.filter(l => {
      const s = normalizeStatus(l.status);
      return ['cold_lead', 'warm_lead', 'estimate_requested'].includes(s) && !l.converted_to_project_id;
    }),
    [leads]
  );

  const resetForm = () => { setSelectedLeadId(''); setApptDate(''); setApptTime(''); setNotes(''); };

  const handleSave = async () => {
    if (!selectedLeadId || !apptDate || !apptTime) {
      toast.error('Selecione lead, data e hora');
      return;
    }
    const lead = eligibleLeads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    setSaving(true);
    try {
      // 1. Insert appointment
      const { error: apptError } = await supabase.from('appointments').insert({
        customer_name: lead.name,
        customer_phone: lead.phone,
        appointment_date: apptDate,
        appointment_time: apptTime,
        appointment_type: 'estimate',
        notes: notes.trim() || null,
      });
      if (apptError) throw apptError;

      // 2. Transition status via RPC (trigger validates)
      const ok = await updateLeadStatus(lead.id, 'estimate_scheduled');

      // 3. Register follow-up action
      await addFollowUpAction(lead.id, {
        date: new Date().toISOString(),
        action: 'Visita agendada',
        notes: notes.trim() || undefined,
      });

      if (ok) {
        toast.success('Visita agendada com sucesso');
      }
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar visita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Agendar Visita
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Lead *</Label>
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleLeads.length === 0 ? (
                  <SelectItem value="_none" disabled>Nenhum lead elegível</SelectItem>
                ) : (
                  eligibleLeads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}{l.city ? ` — ${l.city}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="appt-date">Data *</Label>
              <Input id="appt-date" type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="appt-time">Hora *</Label>
              <Input id="appt-time" type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="appt-notes">Notas</Label>
            <Textarea id="appt-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observações da visita..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 3. Proposal Shortcut Modal ─── */
function QuickProposalModal({ open, onOpenChange, leads }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
}) {
  const navigate = useNavigate();
  const [selectedLeadId, setSelectedLeadId] = useState('');

  // Leads with project linked
  const eligibleLeads = useMemo(() =>
    leads.filter(l => !!l.converted_to_project_id),
    [leads]
  );

  const handleGo = () => {
    const lead = eligibleLeads.find(l => l.id === selectedLeadId);
    if (!lead?.converted_to_project_id) return;
    onOpenChange(false);
    setSelectedLeadId('');
    navigate(`/admin/projects/${lead.converted_to_project_id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSelectedLeadId(''); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Ir para Proposta
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Selecione o lead com projeto para abrir o gerador de proposta.</p>
          <div>
            <Label>Lead com Projeto *</Label>
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleLeads.length === 0 ? (
                  <SelectItem value="_none" disabled>Nenhum lead com projeto</SelectItem>
                ) : (
                  eligibleLeads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} — {STAGE_LABELS[normalizeStatus(l.status)]}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGo} disabled={!selectedLeadId} className="bg-primary text-primary-foreground">
            Abrir Projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 4. Request (Estimate Request) Modal ─── */
function QuickRequestModal({ open, onOpenChange, leads, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const { updateLeadStatus } = useLeadPipeline();
  const { addFollowUpAction } = useLeadFollowUp();

  // Leads eligible: warm leads that can move to estimate_requested
  const eligibleLeads = useMemo(() =>
    leads.filter(l => {
      const s = normalizeStatus(l.status);
      return ['cold_lead', 'warm_lead'].includes(s);
    }),
    [leads]
  );

  const resetForm = () => { setSelectedLeadId(''); setSelectedServices([]); setBudget(''); setNotes(''); };

  const toggleService = (svc: string) => {
    setSelectedServices(prev => 
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    );
  };

  const handleSave = async () => {
    if (!selectedLeadId) {
      toast.error('Selecione um lead');
      return;
    }
    const lead = eligibleLeads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    setSaving(true);
    try {
      // 1. Update informational fields (services, budget)
      const updateData: Record<string, any> = {};
      if (selectedServices.length > 0) updateData.services = selectedServices;
      if (budget) updateData.budget = parseFloat(budget);
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('leads').update(updateData).eq('id', lead.id);
        if (error) throw error;
      }

      // 2. Transition via RPC — trigger validates the path
      const ok = await updateLeadStatus(lead.id, 'estimate_requested');

      // 3. Register follow-up
      await addFollowUpAction(lead.id, {
        date: new Date().toISOString(),
        action: 'Orçamento solicitado',
        notes: notes.trim() || undefined,
      });

      if (ok) {
        toast.success('Solicitação de orçamento registrada');
      }
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar solicitação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Solicitação de Orçamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Lead *</Label>
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleLeads.length === 0 ? (
                  <SelectItem value="_none" disabled>Nenhum lead elegível</SelectItem>
                ) : (
                  eligibleLeads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}{l.city ? ` — ${l.city}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Serviços Solicitados</Label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_OPTIONS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedServices.includes(key)}
                    onCheckedChange={() => toggleService(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="rq-budget">Budget ($)</Label>
            <Input id="rq-budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label htmlFor="rq-notes">Notas</Label>
            <Textarea id="rq-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Detalhes da solicitação..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PIPELINE COMPONENT
   ════════════════════════════════════════════════════════════ */

export function LinearPipeline({ leads, onRefresh }: LinearPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Quick-action modal states
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const salesLeads = useMemo(() => 
    leads.filter(l => SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage)), 
    [leads]
  );

  const activeLeadIds = useMemo(() => 
    salesLeads
      .filter(l => !['completed', 'lost'].includes(normalizeStatus(l.status)))
      .map(l => l.id),
    [salesLeads]
  );
  const { nraMap } = useLeadNRABatch(activeLeadIds);

  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Lead[]> = {
      cold_lead: [], warm_lead: [], estimate_requested: [],
      estimate_scheduled: [], in_draft: [], proposal_sent: [],
      proposal_rejected: [],
      in_production: [], completed: [], lost: []
    };
    salesLeads.forEach(lead => {
      const stage = normalizeStatus(lead.status);
      grouped[stage].push(lead);
    });
    Object.keys(grouped).forEach(stage => {
      grouped[stage as PipelineStage].sort((a, b) => {
        const timeA = new Date(a.updated_at).getTime();
        const timeB = new Date(b.updated_at).getTime();
        if (timeA !== timeB) return timeA - timeB;
        const valA = a.budget || 0;
        const valB = b.budget || 0;
        if (valA !== valB) return valB - valA;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    return grouped;
  }, [salesLeads]);

  // Flat sorted list for list view
  const sortedLeads = useMemo(() => {
    return [...salesLeads].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const valA = a.budget || 0;
      const valB = b.budget || 0;
      if (valA !== valB) return valB - valA;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [salesLeads]);

  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number; stale: number; blocked: number }> = {};
    SALES_STAGES.forEach(stage => {
      const stageLeads = leadsByStage[stage];
      stats[stage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0),
        stale: stageLeads.filter(l => differenceInHours(new Date(), new Date(l.updated_at)) > 48).length,
        blocked: stageLeads.filter(l => {
          const nra = nraMap[l.id];
          return nra && (nra.severity === 'critical' || nra.severity === 'blocked');
        }).length,
      };
    });
    return stats;
  }, [leadsByStage, nraMap]);

  const pipelineHealth = useMemo(() => {
    const active = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.count || 0), 0);
    const totalValue = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.value || 0), 0);
    return { active, totalValue };
  }, [stageStats]);

  const syncedSelectedLead = useMemo(() => {
    if (!selectedLead) return null;
    return leads.find(l => l.id === selectedLead.id) || selectedLead;
  }, [leads, selectedLead]);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const isStale = (lead: Lead) => differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isBlocked = (lead: Lead) => {
    const nra = nraMap[lead.id];
    return nra && (nra.severity === 'critical' || nra.severity === 'blocked');
  };

  if (salesLeads.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
          <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Nenhum lead no pipeline</h3>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Quando novos leads chegarem, eles aparecerão aqui
          </p>
          <Button onClick={() => setShowNewLeadModal(true)} className="mt-4 bg-primary text-primary-foreground">
            <UserPlus className="w-4 h-4 mr-1" /> Criar Lead Manual
          </Button>
        </div>
        <QuickNewLeadModal open={showNewLeadModal} onOpenChange={setShowNewLeadModal} onSuccess={onRefresh} />
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Summary Bar */}
      <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-2">
        {/* Row 1: Stats + View Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] sm:text-xs text-muted-foreground block">Total Leads</span>
              <span className="text-lg sm:text-xl font-bold text-foreground">{pipelineHealth.active}</span>
            </div>
            <div className="h-6 sm:h-8 w-px bg-border" />
            <div>
              <span className="text-[10px] sm:text-xs text-muted-foreground block">Valor Total</span>
              <span className="text-lg sm:text-xl font-bold text-primary">
                ${pipelineHealth.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === 'board'
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors border-l",
                viewMode === 'list'
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Row 2: Action Buttons — scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowNewLeadModal(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Lead
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowApptModal(true)}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Appt.
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowProposalModal(true)}
          >
            <FileText className="w-3.5 h-3.5" />
            Proposal
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowRequestModal(true)}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Request
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-3 min-w-max">
            {SALES_STAGES.map(stage => {
              const config = STAGE_CONFIG[stage];
              const stageLeads = leadsByStage[stage];
              const stats = stageStats[stage];

              return (
                <div
                  key={stage}
                  className="w-[240px] sm:w-[260px] flex-shrink-0 flex flex-col"
                >
                  <div className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0",
                    config.bgColor
                  )}>
                    <span className={cn("font-semibold text-xs truncate", config.textColor)}>
                      {STAGE_LABELS[stage]}
                    </span>
                  </div>

                  <div className={cn(
                    "flex items-center justify-between px-3 py-1.5 border-x text-xs",
                    config.bgColor, "border-b"
                  )}>
                    <span className="text-muted-foreground font-medium">{stats.count}</span>
                    <span className="text-muted-foreground font-medium">
                      ${stats.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex-1 border border-t-0 rounded-b-xl bg-muted/20">
                    <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
                      <div className="p-1.5 space-y-1.5">
                        {stageLeads.length === 0 ? (
                          <div className="text-center py-16 text-muted-foreground/60 text-xs">
                            Nenhum lead
                          </div>
                        ) : (
                          stageLeads.map(lead => (
                            <PipelineCard
                              key={lead.id}
                              lead={lead}
                              nra={nraMap[lead.id]}
                              isStale={isStale(lead)}
                              isBlocked={isBlocked(lead)}
                              onClick={() => handleCardClick(lead)}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="border rounded-xl bg-card overflow-hidden">
          {/* Table Header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_140px_100px_80px] gap-2 px-4 py-2.5 bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Lead</span>
            <span>Estágio</span>
            <span>Contato</span>
            <span>Serviços</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Tempo</span>
          </div>
          {/* Table Body */}
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
            {sortedLeads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground/60 text-xs">
                Nenhum lead
              </div>
            ) : (
              sortedLeads.map(lead => (
                <PipelineListRow
                  key={lead.id}
                  lead={lead}
                  nra={nraMap[lead.id]}
                  isStale={isStale(lead)}
                  isBlocked={isBlocked(lead)}
                  onClick={() => handleCardClick(lead)}
                />
              ))
            )}
          </ScrollArea>
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadControlModal
        lead={syncedSelectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onRefresh={() => onRefresh()}
      />

      {/* Quick Action Modals */}
      <QuickNewLeadModal open={showNewLeadModal} onOpenChange={setShowNewLeadModal} onSuccess={onRefresh} />
      <QuickApptModal open={showApptModal} onOpenChange={setShowApptModal} leads={salesLeads} onSuccess={onRefresh} />
      <QuickProposalModal open={showProposalModal} onOpenChange={setShowProposalModal} leads={salesLeads} />
      <QuickRequestModal open={showRequestModal} onOpenChange={setShowRequestModal} leads={salesLeads} onSuccess={onRefresh} />
    </div>
  );
}

/* ─── Board Card ─── */
function PipelineCard({ lead, nra, isStale, isBlocked, onClick }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
}) {
  const timeBadge = getTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const services = Array.isArray(lead.services) ? lead.services : [];
  const visibleServices = services.slice(0, 2);
  const overflowCount = services.length - 2;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border bg-card cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/40",
        isBlocked && "ring-2 ring-destructive/50 bg-destructive/5",
        isStale && !isBlocked && "ring-2 ring-[hsl(var(--state-risk))]/50 bg-[hsl(var(--state-risk))]/5"
      )}
    >
      {/* Row 1: TimeBadge + Name + Value */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0",
            timeBadge.className
          )}>
            {timeBadge.text}
          </span>
          <span className="font-semibold text-xs text-foreground truncate">
            {lead.name.toUpperCase()}
          </span>
        </div>
        <span className="font-bold text-xs text-foreground whitespace-nowrap flex-shrink-0">
          {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* Row 2: Contact */}
      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 hover:text-primary transition-colors"
        >
          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
          <span>{lead.phone}</span>
        </a>
        {lead.city && (
          <span className="flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {lead.city}
          </span>
        )}
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
          {sourceLabels[lead.lead_source] || lead.lead_source}
        </Badge>
      </div>

      {/* Row 3: Services */}
      {services.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          {visibleServices.map(s => (
            <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
              {serviceLabels[s] || s}
            </Badge>
          ))}
          {overflowCount > 0 && (
            <span className="text-[9px] text-muted-foreground font-medium">+{overflowCount}</span>
          )}
        </div>
      )}

      {/* Operational Alert (conditional) */}
      {alert && (
        <div className={cn(
          "flex items-center gap-1 mt-1.5 pt-1.5 border-t text-[10px] font-medium",
          alert.type === 'critical' && "text-destructive",
          alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
          alert.type === 'info' && "text-primary"
        )}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{alert.text}</span>
        </div>
      )}
    </div>
  );
}

/* ─── List Row ─── */
function PipelineListRow({ lead, nra, isStale, isBlocked, onClick }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
}) {
  const timeBadge = getTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const services = Array.isArray(lead.services) ? lead.services : [];
  const stage = normalizeStatus(lead.status);
  const config = STAGE_CONFIG[stage];

  return (
    <>
      {/* Desktop row */}
      <div
        onClick={onClick}
        className={cn(
          "hidden md:grid grid-cols-[1fr_120px_120px_140px_100px_80px] gap-2 px-4 py-2.5 border-b cursor-pointer transition-colors",
          "hover:bg-muted/40",
          isBlocked && "bg-destructive/5",
          isStale && !isBlocked && "bg-[hsl(var(--state-risk))]/5"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">{lead.name}</span>
          {alert && (
            <AlertTriangle className={cn(
              "w-3 h-3 flex-shrink-0",
              alert.type === 'critical' && "text-destructive",
              alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
              alert.type === 'info' && "text-primary"
            )} />
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 flex-shrink-0">
            {sourceLabels[lead.lead_source] || lead.lead_source}
          </Badge>
        </div>
        <div className="flex items-center">
          <Badge className={cn("text-[9px] px-1.5 py-0 h-4", config.bgColor, config.textColor, "border-0")}>
            {STAGE_LABELS[stage]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5 hover:text-primary transition-colors truncate">
            <Phone className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </a>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          {services.slice(0, 2).map(s => (
            <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
              {serviceLabels[s] || s}
            </Badge>
          ))}
          {services.length > 2 && <span className="text-[9px] text-muted-foreground">+{services.length - 2}</span>}
        </div>
        <div className="flex items-center justify-end">
          <span className="font-bold text-xs text-foreground">{lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}</span>
        </div>
        <div className="flex items-center justify-end">
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", timeBadge.className)}>{timeBadge.text}</span>
        </div>
      </div>

      {/* Mobile card row */}
      <div
        onClick={onClick}
        className={cn(
          "md:hidden flex flex-col gap-1.5 px-3 py-2.5 border-b cursor-pointer transition-colors",
          "hover:bg-muted/40 active:bg-muted/60",
          isBlocked && "bg-destructive/5",
          isStale && !isBlocked && "bg-[hsl(var(--state-risk))]/5"
        )}
      >
        {/* Row 1: Time + Name + Value */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0", timeBadge.className)}>
              {timeBadge.text}
            </span>
            <span className="font-semibold text-xs text-foreground truncate">{lead.name}</span>
          </div>
          <span className="font-bold text-xs text-foreground whitespace-nowrap flex-shrink-0">
            {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
          </span>
        </div>
        {/* Row 2: Stage + Contact */}
        <div className="flex items-center gap-2 text-[10px]">
          <Badge className={cn("text-[9px] px-1.5 py-0 h-4 flex-shrink-0", config.bgColor, config.textColor, "border-0")}>
            {STAGE_LABELS[stage]}
          </Badge>
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-2.5 h-2.5" />
            <span>{lead.phone}</span>
          </a>
          {lead.city && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              {lead.city}
            </span>
          )}
        </div>
        {/* Row 3: Alert (if any) */}
        {alert && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-medium",
            alert.type === 'critical' && "text-destructive",
            alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
            alert.type === 'info' && "text-primary"
          )}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{alert.text}</span>
          </div>
        )}
      </div>
    </>
  );
}
