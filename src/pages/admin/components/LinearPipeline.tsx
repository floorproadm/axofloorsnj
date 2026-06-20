// ============================================================================
// FREEZE — LinearPipeline (Leads Sales Pipeline)
// Aprovado pelo usuário. NÃO refatorar sem autorização explícita.
// Protegido:
//   - Ordem das 7 stages: cold_lead → warm_lead → estimate_requested →
//     estimate_scheduled → in_draft → proposal_sent → proposal_rejected
//   - Sistema NRA (Next Required Action) + alertas e color coding
//   - Botão Quick Quote em `estimate_scheduled` e `in_draft`
//   - Funnel health bar com taxas de conversão entre stages
//   - Toggle de visualização Board / List
// NOTA: Filtro de parceiro removido — pipeline de parceiros agora em
// /admin/partners (aba Referral Pipeline).
// ============================================================================
import { useMemo, useState, useCallback, useEffect } from "react";

import { AXO_ORG_ID } from "@/lib/constants";
import { useNavigate, Link } from "react-router-dom";
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
import { QuickQuoteSheet } from "@/components/admin/QuickQuoteSheet";
import { AddressAutocomplete } from "@/components/admin/AddressAutocomplete";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Phone, MapPin, 
  Clock, AlertTriangle,
  LayoutGrid, List,
  UserPlus, CalendarPlus, FileText, PlusCircle,
  Loader2, X, Zap, Search, Filter, Trash2,
  ArrowLeft, ArrowRight, Check, CalendarIcon, User, Briefcase,
  Flame, DollarSign, ClipboardList, CheckCircle2, ChevronDown,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { differenceInHours, differenceInDays, format, subDays } from "date-fns";
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
  address?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  follow_up_required?: boolean;
  next_action_date?: string;
  follow_up_actions?: { date: string; action: string; notes?: string }[];
  converted_to_project_id?: string;
  referred_by_partner_id?: string;
  assigned_to?: string;
  last_contacted_at?: string;
};

interface LinearPipelineProps {
  leads: Lead[];
  onRefresh: () => void;
  statusFilter?: PipelineStage;
  onClearFilter?: () => void;
}

type ViewMode = 'board' | 'list';

// 8 sales stages: in_production is the "Fechado/Ganho" terminal positive state
const SALES_STAGES: PipelineStage[] = [
  'cold_lead', 'warm_lead', 'estimate_requested',
  'estimate_scheduled', 'in_draft', 'proposal_sent',
  'in_production', 'proposal_rejected'
];

// Stages where Advance/move-forward is disabled (terminal positions inside the sales board)
const TERMINAL_SALES_STAGES: PipelineStage[] = ['in_production', 'proposal_rejected'];

// Local overrides — display "Fechado/Ganho" in green for in_production within Leads board
const PIPELINE_LABEL_OVERRIDES: Partial<Record<PipelineStage, string>> = {
  in_production: 'Fechado/Ganho',
};
const PIPELINE_CONFIG_OVERRIDES: Partial<Record<PipelineStage, typeof STAGE_CONFIG[PipelineStage]>> = {
  in_production: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700',
    stateType: 'success',
  },
};
const getStageLabel = (s: PipelineStage) => PIPELINE_LABEL_OVERRIDES[s] || STAGE_LABELS[s];
const getStageConfig = (s: PipelineStage) => PIPELINE_CONFIG_OVERRIDES[s] || STAGE_CONFIG[s];

const sourceLabels: Record<string, string> = {
  quiz: "Formulário Web",
  contact_form: "Formulário Web",
  contact_page: "Formulário Web",
  builders_page: "Formulário Web",
  realtors_page: "Formulário Web",
  lead_magnet: "Formulário Web",
  website: "Formulário Web",
  partner_referral: "Via Parceiro",
  referral: "Via Parceiro",
  manual: "Manual",
  phone: "Manual",
  walk_in: "Manual",
  google: "Google Ads",
  facebook: "Facebook",
  instagram: "Instagram",
  door_knock: "Porta a porta",
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

function getStageTimeBadge(updatedAt: string) {
  const days = differenceInDays(new Date(), new Date(updatedAt));
  if (days <= 2) return { text: `${days}d`, className: 'bg-muted text-muted-foreground' };
  if (days <= 5) return { text: `${days}d`, className: 'bg-amber-100 text-amber-700' };
  return { text: `${days}d`, className: 'bg-red-100 text-red-700 font-semibold animate-pulse' };
}

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

/* ─── Reusable Source Toggle (Lead | Novo) ─── */
type SourceType = 'lead' | 'new';

function SourceToggle({ source, onChange }: { source: SourceType; onChange: (s: SourceType) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {(['lead', 'new'] as const).map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
            source === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {key === 'lead' ? 'Lead Existente' : 'Novo Lead'}
        </button>
      ))}
    </div>
  );
}

/* ─── Inline New Lead Fields ─── */
function InlineNewLeadFields({ form, setForm, onCancel }: {
  form: { name: string; phone: string; email: string; address: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; address: string }>>;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 p-3 border border-dashed border-border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Novo lead</p>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Selecionar existente</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Nome *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Telefone *</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(XXX) XXX-XXXX" className="h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Email</Label>
          <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ex.com" className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Endereço *</Label>
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Endereço" className="h-8 text-sm" />
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Selector with "+ Criar novo" link ─── */
function LeadSelectorOrNew({ 
  source, selectedLeadId, setSelectedLeadId, eligibleLeads, onSwitchToNew 
}: {
  source: SourceType;
  selectedLeadId: string;
  setSelectedLeadId: (id: string) => void;
  eligibleLeads: Lead[];
  onSwitchToNew: () => void;
}) {
  if (source !== 'lead') return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>Lead *</Label>
        <button onClick={onSwitchToNew} className="text-xs text-primary hover:underline transition-colors">+ Criar novo</button>
      </div>
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
  );
}

const EMPTY_NEW_LEAD = { name: '', phone: '', email: '', address: '' };

/* ════════════════════════════════════════════════════════════
   QUICK ACTION MODALS
   ════════════════════════════════════════════════════════════ */

/* ─── 1. New Lead Modal — 2-step wizard ─── */
const LEAD_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'manual', label: 'Manual / Walk-in' },
  { value: 'phone', label: 'Telefone' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'door_knock', label: 'Porta a porta' },
  { value: 'other', label: 'Outro' },
];

const PRIORITY_OPTIONS: { value: 'low' | 'medium' | 'high'; label: string; dot: string }[] = [
  { value: 'low', label: 'Baixa', dot: 'bg-muted-foreground' },
  { value: 'medium', label: 'Média', dot: 'bg-amber-500' },
  { value: 'high', label: 'Alta', dot: 'bg-red-500' },
];

function QuickNewLeadModal({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zip_code: '',
    lead_source: 'manual',
    services: [] as string[],
    budget: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    next_action_date: undefined as Date | undefined,
    notes: '',
  });

  const resetForm = () => {
    setStep(1);
    setForm({
      name: '', phone: '', email: '', address: '', city: '', zip_code: '',
      lead_source: 'manual', services: [], budget: '',
      priority: 'medium', next_action_date: undefined, notes: '',
    });
  };

  const step1Valid = form.name.trim().length > 0 && form.phone.trim().length > 0;

  const toggleService = (key: string) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(key)
        ? f.services.filter(s => s !== key)
        : [...f.services, key],
    }));
  };

  const handleSave = async () => {
    if (!step1Valid) {
      toast.error('Nome e telefone são obrigatórios');
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        zip_code: form.zip_code.trim() || null,
        lead_source: form.lead_source,
        services: form.services.length > 0 ? form.services : [],
        budget: form.budget ? parseFloat(form.budget) : null,
        priority: form.priority,
        next_action_date: form.next_action_date
          ? format(form.next_action_date, 'yyyy-MM-dd')
          : null,
        follow_up_required: !!form.next_action_date,
        notes: form.notes.trim() || null,
        organization_id: AXO_ORG_ID,
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-4 h-4 text-primary" />
              Novo Lead Manual
            </DialogTitle>
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-colors",
                  step >= 1 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                )}>
                  {step > 1 ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <span className={cn("text-xs font-medium", step === 1 ? "text-foreground" : "text-muted-foreground")}>
                  Contato
                </span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className={cn("text-xs font-medium", step === 2 ? "text-foreground" : "text-muted-foreground")}>
                  Qualificação
                </span>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-colors",
                  step >= 2 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                )}>
                  2
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="w-3 h-3" /> Contato
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nl-name" className="text-xs">Nome *</Label>
                  <Input id="nl-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="nl-phone" className="text-xs">Telefone *</Label>
                  <Input id="nl-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(XXX) XXX-XXXX" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="nl-email" className="text-xs">Email</Label>
                <Input id="nl-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1" />
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="w-3 h-3" /> Endereço
              </div>
              <div>
                <Label className="text-xs">Endereço completo</Label>
                <div className="mt-1">
                  <AddressAutocomplete
                    value={form.address}
                    onSelect={(r) => setForm(f => ({
                      ...f,
                      address: r.street || r.full,
                      city: r.city || f.city,
                      zip_code: r.zip || f.zip_code,
                    }))}
                    onChange={(v) => setForm(f => ({ ...f, address: v }))}
                    placeholder="Comece a digitar o endereço…"
                  />
                </div>
                {(form.city || form.zip_code) && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {[form.city, form.zip_code].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Briefcase className="w-3 h-3" /> Projeto
              </div>
              <div>
                <Label className="text-xs">Serviços de interesse</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {SERVICE_OPTIONS.map(([key, label]) => {
                    const active = form.services.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleService(key)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted text-foreground border-border"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nl-source" className="text-xs">Fonte do lead</Label>
                  <Select value={form.lead_source} onValueChange={(v) => setForm(f => ({ ...f, lead_source: v }))}>
                    <SelectTrigger id="nl-source" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nl-budget" className="text-xs">Budget ($)</Label>
                  <Input id="nl-budget" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0.00" className="mt-1" />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Zap className="w-3 h-3" /> Próxima ação
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v: any) => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Próxima ação (data)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mt-1 w-full justify-start text-left font-normal h-10",
                          !form.next_action_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.next_action_date ? format(form.next_action_date, 'PPP') : <span>Escolher data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.next_action_date}
                        onSelect={(d) => setForm(f => ({ ...f, next_action_date: d }))}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="nl-notes" className="text-xs">Notas</Label>
                <Textarea
                  id="nl-notes"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Contexto, dores, urgência, referência…"
                  className="mt-1 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 sm:justify-between gap-2">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="bg-primary text-primary-foreground"
              >
                Continuar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={saving}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Criar Lead
              </Button>
            </>
          )}
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
  const [apptAddress, setApptAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<SourceType>('lead');
  const [newLeadForm, setNewLeadForm] = useState(EMPTY_NEW_LEAD);
  const { updateLeadStatus } = useLeadPipeline();
  const { addFollowUpAction } = useLeadFollowUp();

  const eligibleLeads = useMemo(() =>
    leads.filter(l => {
      const s = normalizeStatus(l.status);
      return ['cold_lead', 'warm_lead', 'estimate_requested'].includes(s) && !l.converted_to_project_id;
    }),
    [leads]
  );

  const resetForm = () => { 
    setSelectedLeadId(''); setApptDate(''); setApptTime(''); setApptAddress(''); setNotes(''); 
    setSource('lead'); setNewLeadForm(EMPTY_NEW_LEAD);
  };

  // Auto-fill address when lead is selected
  const selectedLead = eligibleLeads.find(l => l.id === selectedLeadId);
  useEffect(() => {
    if (selectedLead?.address) setApptAddress(selectedLead.address);
    else setApptAddress('');
  }, [selectedLeadId, selectedLead?.address]);

  const handleSave = async () => {
    if (source === 'lead' && !selectedLeadId) {
      toast.error('Selecione um lead');
      return;
    }
    if (source === 'new' && (!newLeadForm.name.trim() || !newLeadForm.phone.trim())) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    const addressValue = source === 'new' ? newLeadForm.address.trim() : apptAddress.trim();
    if (!addressValue) {
      toast.error('Endereço é obrigatório');
      return;
    }
    if (!apptDate || !apptTime) {
      toast.error('Selecione data e hora');
      return;
    }

    setSaving(true);
    try {
      let leadName = '';
      let leadPhone = '';
      let createdLeadId = '';

      if (source === 'new') {
        // Create new lead directly
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            name: newLeadForm.name.trim(),
            phone: newLeadForm.phone.trim(),
            email: newLeadForm.email.trim() || null,
            address: addressValue,
            lead_source: 'manual',
            status: 'estimate_scheduled',
            priority: 'medium',
            organization_id: AXO_ORG_ID,
          })
          .select('id')
          .is('deleted_at', null)
          .single();
        if (insertError) throw insertError;
        createdLeadId = newLead.id;
        leadName = newLeadForm.name.trim();
        leadPhone = newLeadForm.phone.trim();
      } else {
        const lead = eligibleLeads.find(l => l.id === selectedLeadId);
        if (!lead) return;
        createdLeadId = lead.id;
        leadName = lead.name;
        leadPhone = lead.phone;

        if (addressValue) {
          await supabase.from('leads').update({ address: addressValue }).eq('id', lead.id);
        }
        await updateLeadStatus(lead.id, 'estimate_scheduled');
      }

      // Create appointment
      await supabase.from('appointments').insert({
        customer_name: leadName,
        customer_phone: leadPhone,
        appointment_date: apptDate,
        appointment_time: apptTime,
        appointment_type: 'estimate',
        location: addressValue || null,
        notes: notes.trim() || null,
        organization_id: AXO_ORG_ID,
      });

      if (createdLeadId) {
        await addFollowUpAction(createdLeadId, {
          date: new Date().toISOString(),
          action: 'Visita agendada',
          notes: notes.trim() || undefined,
        });
      }

      toast.success('Visita agendada com sucesso');
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
          <SourceToggle source={source} onChange={(s) => { setSource(s); setSelectedLeadId(''); setNewLeadForm(EMPTY_NEW_LEAD); }} />

          {source === 'new' ? (
            <InlineNewLeadFields form={newLeadForm} setForm={setNewLeadForm} onCancel={() => setSource('lead')} />
          ) : (
            <LeadSelectorOrNew
              source={source}
              selectedLeadId={selectedLeadId}
              setSelectedLeadId={setSelectedLeadId}
              eligibleLeads={eligibleLeads}
              onSwitchToNew={() => { setSource('new'); setSelectedLeadId(''); }}
            />
          )}

          {source !== 'new' && (
            <div>
              <Label htmlFor="appt-address">Endereço *</Label>
              <Input 
                id="appt-address" 
                value={apptAddress} 
                onChange={e => setApptAddress(e.target.value)} 
                placeholder="Endereço do cliente..."
              />
            </div>
          )}

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

  const eligibleLeads = useMemo(() =>
    leads.filter(l => !!l.converted_to_project_id),
    [leads]
  );

  const resetForm = () => { setSelectedLeadId(''); };

  const handleGo = () => {
    const lead = eligibleLeads.find(l => l.id === selectedLeadId);
    if (!lead?.converted_to_project_id) return;
    onOpenChange(false);
    resetForm();
    navigate(`/admin/projects/${lead.converted_to_project_id}`);
  };

  const canGo = !!selectedLeadId;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
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
          <Button onClick={handleGo} disabled={!canGo} className="bg-primary text-primary-foreground">
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
  const [source, setSource] = useState<SourceType>('lead');
  const [newLeadForm, setNewLeadForm] = useState(EMPTY_NEW_LEAD);
  const { updateLeadStatus } = useLeadPipeline();
  const { addFollowUpAction } = useLeadFollowUp();

  const eligibleLeads = useMemo(() =>
    leads.filter(l => {
      const s = normalizeStatus(l.status);
      return ['cold_lead', 'warm_lead'].includes(s);
    }),
    [leads]
  );

  const resetForm = () => { 
    setSelectedLeadId(''); setSelectedServices([]); setBudget(''); setNotes(''); 
    setSource('lead'); setNewLeadForm(EMPTY_NEW_LEAD);
  };

  const toggleService = (svc: string) => {
    setSelectedServices(prev => 
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    );
  };

  const handleSave = async () => {
    if (source === 'lead' && !selectedLeadId) {
      toast.error('Selecione um lead');
      return;
    }
    if (source === 'new' && (!newLeadForm.name.trim() || !newLeadForm.phone.trim())) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      if (source === 'new') {
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            name: newLeadForm.name.trim(),
            phone: newLeadForm.phone.trim(),
            email: newLeadForm.email.trim() || null,
            address: newLeadForm.address.trim() || null,
            lead_source: 'manual',
            status: 'estimate_requested',
            priority: 'medium',
            services: selectedServices.length > 0 ? selectedServices : undefined,
            budget: budget ? parseFloat(budget) : undefined,
            notes: notes.trim() || null,
            organization_id: AXO_ORG_ID,
          })
          .select('id')
          .is('deleted_at', null)
          .single();
        if (insertError) throw insertError;

        if (newLead) {
          await addFollowUpAction(newLead.id, {
            date: new Date().toISOString(),
            action: 'Orçamento solicitado (novo lead)',
            notes: notes.trim() || undefined,
          });
        }
        toast.success('Lead criado e solicitação registrada');
      } else {
        const lead = eligibleLeads.find(l => l.id === selectedLeadId);
        if (!lead) return;

        const updateData: Record<string, any> = {};
        if (selectedServices.length > 0) updateData.services = selectedServices;
        if (budget) updateData.budget = parseFloat(budget);
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase.from('leads').update(updateData).eq('id', lead.id);
          if (error) throw error;
        }

        const ok = await updateLeadStatus(lead.id, 'estimate_requested');

        await addFollowUpAction(lead.id, {
          date: new Date().toISOString(),
          action: 'Orçamento solicitado',
          notes: notes.trim() || undefined,
        });

        if (ok) {
          toast.success('Solicitação de orçamento registrada');
        }
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
          <SourceToggle source={source} onChange={(s) => { setSource(s); setSelectedLeadId(''); setNewLeadForm(EMPTY_NEW_LEAD); }} />

          {source === 'new' ? (
            <InlineNewLeadFields form={newLeadForm} setForm={setNewLeadForm} onCancel={() => setSource('lead')} />
          ) : (
            <LeadSelectorOrNew
              source={source}
              selectedLeadId={selectedLeadId}
              setSelectedLeadId={setSelectedLeadId}
              eligibleLeads={eligibleLeads}
              onSwitchToNew={() => { setSource('new'); setSelectedLeadId(''); }}
            />
          )}

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

export function LinearPipeline({ leads, onRefresh, statusFilter, onClearFilter }: LinearPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [needsActionOnly, setNeedsActionOnly] = useState(false);

  // KPI quick filter
  type KpiKey = 'hot' | 'stale' | 'no_action' | 'closed_month';
  const [kpiFilter, setKpiFilter] = useState<KpiKey | null>(null);

  // Advanced filters
  const [filters, setFilters] = useState({
    stages: [] as PipelineStage[],
    sources: [] as string[],
    services: [] as string[],
    budgetMin: '',
    budgetMax: '',
    assignedTo: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount =
    filters.stages.length + filters.sources.length + filters.services.length +
    (filters.budgetMin ? 1 : 0) + (filters.budgetMax ? 1 : 0) + (filters.assignedTo ? 1 : 0);

  // Quick-action modal states
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Quick Quote state
  const [quickQuoteLead, setQuickQuoteLead] = useState<Lead | null>(null);
  const [showQuickQuote, setShowQuickQuote] = useState(false);

  const handleQuickQuote = useCallback((lead: Lead) => {
    setQuickQuoteLead(lead);
    setShowQuickQuote(true);
  }, []);

  // Unfiltered sales leads for stats (funnel bar uses all data)
  const allSalesLeads = useMemo(() => {
    return leads.filter(l =>
      SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage)
    );
  }, [leads]);

  // KPI counts derived from all sales leads + closed leads
  const kpiCounts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeDaysAgo = subDays(now, 3);
    return {
      hot: allSalesLeads.filter(l => l.priority === 'high' || (l.priority as any) === 'hot').length,
      stale: allSalesLeads.filter(l => new Date(l.updated_at) < threeDaysAgo).length,
      pipelineValue: allSalesLeads.reduce((s, l) => s + (l.budget || 0), 0),
      no_action: allSalesLeads.filter(l => !l.next_action_date && !(l as any).follow_up_date).length,
      closed_month: leads.filter(l => {
        const s = normalizeStatus(l.status);
        return (s === 'in_production' || (l as any).converted_to_project_id) &&
          new Date(l.updated_at) >= monthStart;
      }).length,
    };
  }, [allSalesLeads, leads]);

  const salesLeads = useMemo(() => {
    let filtered = leads.filter(l =>
      SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage)
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q))
      );
    }
    // KPI filter
    if (kpiFilter) {
      const now = new Date();
      const threeDaysAgo = subDays(now, 3);
      filtered = filtered.filter(l => {
        if (kpiFilter === 'hot') return l.priority === 'high' || (l.priority as any) === 'hot';
        if (kpiFilter === 'stale') return new Date(l.updated_at) < threeDaysAgo;
        if (kpiFilter === 'no_action') return !l.next_action_date && !(l as any).follow_up_date;
        if (kpiFilter === 'closed_month') return false; // closed leads aren't in salesLeads
        return true;
      });
    }
    // Advanced filters
    if (filters.stages.length > 0) {
      filtered = filtered.filter(l => filters.stages.includes(normalizeStatus(l.status)));
    }
    if (filters.sources.length > 0) {
      filtered = filtered.filter(l => filters.sources.includes(l.lead_source));
    }
    if (filters.services.length > 0) {
      filtered = filtered.filter(l =>
        Array.isArray(l.services) && l.services.some(s => filters.services.includes(s))
      );
    }
    if (filters.budgetMin) {
      const min = parseFloat(filters.budgetMin);
      if (!isNaN(min)) filtered = filtered.filter(l => (l.budget || 0) >= min);
    }
    if (filters.budgetMax) {
      const max = parseFloat(filters.budgetMax);
      if (!isNaN(max)) filtered = filtered.filter(l => (l.budget || 0) <= max);
    }
    if (filters.assignedTo) {
      const a = filters.assignedTo.toLowerCase();
      filtered = filtered.filter(l => (l.assigned_to || '').toLowerCase().includes(a));
    }
    return filtered;
  }, [leads, searchQuery, kpiFilter, filters]);

  const activeLeadIds = useMemo(() =>
    allSalesLeads
      .filter(l => !['completed', 'lost'].includes(normalizeStatus(l.status)))
      .map(l => l.id),
    [allSalesLeads]
  );
  const { nraMap } = useLeadNRABatch(activeLeadIds);

  // Check if a lead needs action (stale or blocked)
  const leadNeedsAction = useCallback((lead: Lead) => {
    const nra = nraMap[lead.id];
    const stale = differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
    const blocked = nra && (nra.severity === 'critical' || nra.severity === 'blocked');
    const followUpOverdue = lead.next_action_date && new Date(lead.next_action_date) < new Date();
    return stale || blocked || followUpOverdue || lead.follow_up_required;
  }, [nraMap]);

  // Apply "needs action" filter
  const filteredSalesLeads = useMemo(() => {
    if (!needsActionOnly) return salesLeads;
    return salesLeads.filter(leadNeedsAction);
  }, [salesLeads, needsActionOnly, leadNeedsAction]);

  // Stale leads per stage (5+ days)
  const stageStaleCounts = useMemo(() => {
    const out: Record<string, number> = {};
    const fiveDaysAgo = subDays(new Date(), 5);
    SALES_STAGES.forEach(stage => {
      out[stage] = allSalesLeads.filter(l =>
        normalizeStatus(l.status) === stage && new Date(l.updated_at) < fiveDaysAgo
      ).length;
    });
    return out;
  }, [allSalesLeads]);



  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Lead[]> = {
      cold_lead: [], warm_lead: [], estimate_requested: [],
      estimate_scheduled: [], in_draft: [], proposal_sent: [],
      proposal_rejected: [],
      in_production: [], completed: [], lost: []
    };
    filteredSalesLeads.forEach(lead => {
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
  }, [filteredSalesLeads]);

  // Flat sorted list for list view (filtered when statusFilter is active)
  const sortedLeads = useMemo(() => {
    const base = statusFilter
      ? filteredSalesLeads.filter(l => normalizeStatus(l.status) === statusFilter)
      : filteredSalesLeads;
    return [...base].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const valA = a.budget || 0;
      const valB = b.budget || 0;
      if (valA !== valB) return valB - valA;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [filteredSalesLeads, statusFilter]);

  // Stats from ALL leads (not filtered) for accurate funnel visualization
  const allLeadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    SALES_STAGES.forEach(s => grouped[s] = []);
    allSalesLeads.forEach(lead => {
      const stage = normalizeStatus(lead.status);
      if (grouped[stage]) grouped[stage].push(lead);
    });
    return grouped;
  }, [allSalesLeads]);

  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number; stale: number; blocked: number; avgDays: number }> = {};
    SALES_STAGES.forEach(stage => {
      const stageLeads = allLeadsByStage[stage] || [];
      const now = new Date();
      const totalDays = stageLeads.reduce((sum, l) => {
        const statusChanged = l.updated_at;
        return sum + differenceInDays(now, new Date(statusChanged));
      }, 0);
      stats[stage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0),
        stale: stageLeads.filter(l => differenceInHours(now, new Date(l.updated_at)) > 48).length,
        blocked: stageLeads.filter(l => {
          const nra = nraMap[l.id];
          return nra && (nra.severity === 'critical' || nra.severity === 'blocked');
        }).length,
        avgDays: stageLeads.length > 0 ? Math.round((totalDays / stageLeads.length) * 10) / 10 : 0,
      };
    });
    return stats;
  }, [allLeadsByStage, nraMap]);

  // Conversion rates between consecutive stages
  const conversionRates = useMemo(() => {
    const rates: Record<string, number> = {};
    for (let i = 0; i < SALES_STAGES.length - 1; i++) {
      const from = SALES_STAGES[i];
      const fromCount = stageStats[from]?.count || 0;
      // "converted" = all leads that are in this stage or beyond
      const beyondCount = SALES_STAGES.slice(i + 1).reduce((sum, s) => sum + (stageStats[s]?.count || 0), 0);
      const total = fromCount + beyondCount;
      rates[from] = total > 0 ? Math.round((beyondCount / total) * 100) : 0;
    }
    return rates;
  }, [stageStats]);

  const pipelineHealth = useMemo(() => {
    const active = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.count || 0), 0);
    const totalValue = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.value || 0), 0);
    const needsAction = allSalesLeads.filter(leadNeedsAction).length;
    return { active, totalValue, needsAction };
  }, [stageStats, allSalesLeads, leadNeedsAction]);

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


  // Advance to next stage (inline button in list view)
  const { updateLeadStatus } = useLeadPipeline();
  const advanceLead = async (lead: Lead) => {
    const stage = normalizeStatus(lead.status);
    const idx = SALES_STAGES.indexOf(stage as PipelineStage);
    if (idx < 0 || idx >= SALES_STAGES.length - 1) return;
    const next = SALES_STAGES[idx + 1];
    await updateLeadStatus(lead.id, next);
    onRefresh();
  };

  const clearAllFilters = () => {
    setKpiFilter(null);
    setNeedsActionOnly(false);
    setSearchQuery('');
    setFilters({ stages: [], sources: [], services: [], budgetMin: '', budgetMax: '', assignedTo: '' });
    onClearFilter?.();
  };

  const KPI_DEFS: { key: KpiKey; label: string; emoji: string; value: number | string; color: string }[] = [
    { key: 'hot', label: 'Quentes', emoji: '🔥', value: kpiCounts.hot, color: 'border-red-200 hover:bg-red-50 data-[active=true]:bg-red-100 data-[active=true]:border-red-400' },
    { key: 'stale', label: 'Parados +3d', emoji: '⏰', value: kpiCounts.stale, color: 'border-amber-200 hover:bg-amber-50 data-[active=true]:bg-amber-100 data-[active=true]:border-amber-400' },
    { key: 'no_action' as KpiKey, label: 'Sem próx. ação', emoji: '📋', value: kpiCounts.no_action, color: 'border-slate-200 hover:bg-slate-50 data-[active=true]:bg-slate-100 data-[active=true]:border-slate-400' },
    { key: 'closed_month', label: 'Fechados este mês', emoji: '✅', value: kpiCounts.closed_month, color: 'border-emerald-200 hover:bg-emerald-50 data-[active=true]:bg-emerald-100 data-[active=true]:border-emerald-400' },
  ];

  return (
    <div className="space-y-3">
      {/* KPI Pills Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {KPI_DEFS.slice(0, 2).map(k => (
          <button
            key={k.key as string}
            data-active={kpiFilter === k.key}
            onClick={() => setKpiFilter(kpiFilter === k.key ? null : k.key)}
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-card transition-all text-left",
              k.color
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">{k.emoji} {k.label}</span>
            <span className="text-lg font-bold text-foreground tabular-nums">{k.value}</span>
          </button>
        ))}
        {/* Pipeline $ pill — display only, no filter */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-card">
          <span className="text-xs font-medium text-muted-foreground">💰 Pipeline</span>
          <span className="text-lg font-bold text-primary tabular-nums">
            ${kpiCounts.pipelineValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        {KPI_DEFS.slice(2).map(k => (
          <button
            key={k.key as string}
            data-active={kpiFilter === k.key}
            onClick={() => setKpiFilter(kpiFilter === k.key ? null : k.key)}
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-card transition-all text-left",
              k.color
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">{k.emoji} {k.label}</span>
            <span className="text-lg font-bold text-foreground tabular-nums">{k.value}</span>
          </button>
        ))}
      </div>

      {/* Simplified Toolbar */}
      <div className="bg-card border rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap">
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNewLeadModal(true)}>
          <UserPlus className="w-3.5 h-3.5" /> Novo Lead
        </Button>

        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 space-y-3" align="end">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Filtros</h4>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ stages: [], sources: [], services: [], budgetMin: '', budgetMax: '', assignedTo: '' })}
                  className="text-[11px] text-primary hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Estágio</Label>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {SALES_STAGES.map(s => {
                  const active = filters.stages.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setFilters(f => ({
                        ...f,
                        stages: active ? f.stages.filter(x => x !== s) : [...f.stages, s]
                      }))}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors",
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fonte</Label>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {Array.from(new Set(allSalesLeads.map(l => l.lead_source))).filter(Boolean).map(src => {
                  const active = filters.sources.includes(src);
                  return (
                    <button
                      key={src}
                      onClick={() => setFilters(f => ({
                        ...f,
                        sources: active ? f.sources.filter(x => x !== src) : [...f.sources, src]
                      }))}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors",
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {sourceLabels[src] || src}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Serviço</Label>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {SERVICE_OPTIONS.map(([k, label]) => {
                  const active = filters.services.includes(k);
                  return (
                    <button
                      key={k}
                      onClick={() => setFilters(f => ({
                        ...f,
                        services: active ? f.services.filter(x => x !== k) : [...f.services, k]
                      }))}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors",
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor min</Label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={filters.budgetMin}
                  onChange={e => setFilters(f => ({ ...f, budgetMin: e.target.value }))}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor max</Label>
                <Input
                  type="number"
                  placeholder="$∞"
                  value={filters.budgetMax}
                  onChange={e => setFilters(f => ({ ...f, budgetMax: e.target.value }))}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Responsável</Label>
              <Input
                placeholder="Nome ou ID..."
                value={filters.assignedTo}
                onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="pt-2 border-t border-border">
              <Link
                to="/admin/leads/trash"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ver lixeira
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0 ml-auto">
          <button
            onClick={() => setViewMode('board')}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors",
              viewMode === 'board' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors border-l",
              viewMode === 'list' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(statusFilter || searchQuery || needsActionOnly || kpiFilter || activeFilterCount > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilter && (
            <Badge variant="secondary" className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
              STAGE_CONFIG[statusFilter]?.bgColor,
              STAGE_CONFIG[statusFilter]?.textColor
            )}>
              Estágio: {STAGE_LABELS[statusFilter]}
              <button onClick={onClearFilter} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-3 h-3" /></button>
            </Badge>
          )}
          {kpiFilter && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
              KPI: {KPI_DEFS.find(k => k.key === kpiFilter)?.label}
              <button onClick={() => setKpiFilter(null)} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-3 h-3" /></button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
              Busca: "{searchQuery}" ({filteredSalesLeads.length})
            </Badge>
          )}
          <button onClick={clearAllFilters} className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
            Limpar tudo
          </button>
        </div>
      )}


      {/* Board View */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-1 min-w-max items-start">
            {SALES_STAGES.map((stage, idx) => {
              const config = getStageConfig(stage);
              const stageLeads = leadsByStage[stage];
              const stats = stageStats[stage];
              const rate = conversionRates[stage];
              const stageLabel = getStageLabel(stage);

              return (
                <div key={stage} className="flex items-start">
                  <div
                    className={cn(
                      "w-[240px] sm:w-[260px] flex-shrink-0 flex flex-col transition-opacity duration-200",
                      statusFilter && statusFilter !== stage && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0",
                      config.bgColor,
                      statusFilter === stage && "ring-2 ring-offset-1 ring-primary"
                    )}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn("font-semibold text-xs truncate", config.textColor)}>
                          {stageLabel}
                        </span>
                        {stageStaleCounts[stage] >= 2 && (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none animate-pulse" title={`${stageStaleCounts[stage]} leads parados há 5d+`}>
                            {stageStaleCounts[stage]}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground font-medium bg-background/60 px-1.5 py-0.5 rounded">
                        {stats.count}
                      </span>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between px-3 py-1 border-x text-[10px]",
                      config.bgColor, "border-b"
                    )}>
                      <span className="text-muted-foreground">
                        {rate !== undefined ? `${rate}% avançam daqui` : '—'}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        ${stats.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="flex-1 border border-t-0 rounded-b-xl bg-muted/20">
                      <div className="max-h-[60vh] overflow-y-auto">
                        <div className="p-1.5 space-y-1.5">
                          {stageLeads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 px-3 text-center">
                              <p className="text-xs text-muted-foreground/60">Nenhum lead aqui ainda</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] gap-1"
                                onClick={() => setShowNewLeadModal(true)}
                              >
                                <PlusCircle className="w-3 h-3" />
                                Adicionar lead
                              </Button>
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
                                onAdvance={() => advanceLead(lead)}
                                canAdvance={!TERMINAL_SALES_STAGES.includes(stage)}
                                onQuickQuote={['estimate_scheduled', 'in_draft'].includes(normalizeStatus(lead.status)) ? () => handleQuickQuote(lead) : undefined}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {/* Table Header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[2fr_120px_130px_120px_120px_90px_90px_90px] gap-3 px-5 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
            <span>Lead</span>
            <span>Estágio</span>
            <span>Contato</span>
            <span>Último Contato</span>
            <span>Responsável</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Tempo</span>
            <span className="text-right">Ações</span>
          </div>
          {/* Table Body */}
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5 px-0.5">
              {sortedLeads.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground/60 text-xs">
                  Nenhum lead encontrado com esses filtros
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
                    onAdvance={() => advanceLead(lead)}
                    canAdvance={SALES_STAGES.indexOf(normalizeStatus(lead.status) as PipelineStage) < SALES_STAGES.length - 1}
                    onQuickQuote={['estimate_scheduled', 'in_draft'].includes(normalizeStatus(lead.status)) ? () => handleQuickQuote(lead) : undefined}
                  />
                ))
              )}
            </div>
          </div>
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
      <QuickApptModal open={showApptModal} onOpenChange={setShowApptModal} leads={allSalesLeads} onSuccess={onRefresh} />
      <QuickProposalModal open={showProposalModal} onOpenChange={setShowProposalModal} leads={allSalesLeads} />
      <QuickRequestModal open={showRequestModal} onOpenChange={setShowRequestModal} leads={allSalesLeads} onSuccess={onRefresh} />

      {/* Quick Quote Sheet */}
      <QuickQuoteSheet
        lead={quickQuoteLead}
        open={showQuickQuote}
        onClose={() => { setShowQuickQuote(false); setQuickQuoteLead(null); }}
        onSuccess={onRefresh}
      />
    </div>
  );
}

/* ─── Board Card ─── */
function PipelineCard({ lead, nra, isStale, isBlocked, onClick, onQuickQuote, onAdvance, canAdvance }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
  onQuickQuote?: () => void;
  onAdvance?: () => void;
  canAdvance?: boolean;
}) {
  const stageBadge = getStageTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const services: string[] = Array.isArray(lead.services) ? lead.services : [];
  const primaryService = services[0] ? (serviceLabels[services[0]] || services[0]) : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-xl border bg-card cursor-pointer transition-all group",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        isBlocked && "ring-2 ring-destructive/40 bg-destructive/5",
        isStale && !isBlocked && "ring-2 ring-[hsl(var(--state-risk))]/40 bg-[hsl(var(--state-risk))]/5"
      )}
    >
      {/* L1: Name + Value */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-sm text-foreground truncate leading-tight flex-1">
          {lead.name}
        </span>
        <span className="font-bold text-sm text-emerald-600 whitespace-nowrap flex-shrink-0 tabular-nums">
          {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* L2: City + service */}
      <div className="mt-1 text-[11px] text-muted-foreground truncate">
        {[lead.city, primaryService].filter(Boolean).join(' · ') || '—'}
      </div>

      {/* L3: Phone clickable */}
      <a
        href={`tel:${lead.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
      >
        <Phone className="w-3 h-3 flex-shrink-0" />
        <span>{lead.phone}</span>
      </a>

      {/* L4 + L5: Time badge + Source badge */}
      <div className="flex items-center justify-between gap-1.5 mt-2">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", stageBadge.className)}>
          {stageBadge.text} no estágio
        </span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
          {sourceLabels[lead.lead_source] || lead.lead_source}
        </Badge>
      </div>

      {/* Operational Alert (compact) */}
      {alert && (
        <div className={cn(
          "flex items-center gap-1 mt-1.5 text-[10px] font-medium",
          alert.type === 'critical' && "text-destructive",
          alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
          alert.type === 'info' && "text-primary"
        )}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{alert.text}</span>
        </div>
      )}

      {/* Hover quick-action row */}
      <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-muted/50 hover:bg-muted text-[10px] font-medium text-foreground"
          title="Ligar"
        >
          <Phone className="w-3 h-3" /> Ligar
        </a>
        {onQuickQuote && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickQuote(); }}
            className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-amber-100 hover:bg-amber-200 text-[10px] font-medium text-amber-700"
            title="Proposta"
          >
            <FileText className="w-3 h-3" /> Proposta
          </button>
        )}
        {onAdvance && canAdvance && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-primary/10 hover:bg-primary/20 text-[10px] font-medium text-primary"
            title="Avançar"
          >
            <ChevronRightIcon className="w-3 h-3" /> Avançar
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── List Row ─── */
function PipelineListRow({ lead, nra, isStale, isBlocked, onClick, onQuickQuote, onAdvance, canAdvance }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
  onQuickQuote?: () => void;
  onAdvance?: () => void;
  canAdvance?: boolean;
}) {
  const timeBadge = getTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const stage = normalizeStatus(lead.status);
  const config = STAGE_CONFIG[stage];
  const lastContact = lead.last_contacted_at
    ? format(new Date(lead.last_contacted_at), 'dd/MM')
    : '—';
  const assignedTo = lead.assigned_to || '—';

  return (
    <>
      {/* Desktop row */}
      <div
        onClick={onClick}
        className={cn(
          "hidden md:grid grid-cols-[2fr_120px_130px_120px_120px_90px_90px_90px] gap-3 px-5 py-3 rounded-xl border bg-card cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
          isBlocked && "border-destructive/40 bg-destructive/5",
          isStale && !isBlocked && "border-[hsl(var(--state-risk))]/40 bg-[hsl(var(--state-risk))]/5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
            config.bgColor, config.textColor
          )}>
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate leading-tight">{lead.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5">
                {sourceLabels[lead.lead_source] || lead.lead_source}
              </Badge>
              {alert && <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Badge className={cn("text-[10px] px-2 py-0.5 h-5 font-semibold rounded-md border-0", config.bgColor, config.textColor)}>
            {STAGE_LABELS[stage]}
          </Badge>
        </div>
        <div className="flex items-center">
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary">
            <Phone className="w-3 h-3" />
            <span className="truncate">{lead.phone}</span>
          </a>
        </div>
        <div className="flex items-center text-[11px] text-muted-foreground tabular-nums">
          {lastContact}
        </div>
        <div className="flex items-center text-[11px] text-muted-foreground truncate">
          {assignedTo}
        </div>
        <div className="flex items-center justify-end">
          <span className={cn("font-bold text-sm tabular-nums", lead.budget ? "text-emerald-600" : "text-muted-foreground/40")}>
            {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-end">
          <span className={cn("text-[10px] px-2 py-1 rounded-md font-semibold", timeBadge.className)}>{timeBadge.text}</span>
        </div>
        <div className="flex items-center justify-end">
          {onAdvance && canAdvance && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1 px-2"
              onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            >
              <ChevronRightIcon className="w-3 h-3" /> Avançar
            </Button>
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div
        onClick={onClick}
        className={cn(
          "md:hidden rounded-xl border bg-card p-3.5 cursor-pointer transition-all",
          isBlocked && "border-destructive/40 bg-destructive/5",
          isStale && !isBlocked && "border-[hsl(var(--state-risk))]/40 bg-[hsl(var(--state-risk))]/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
            config.bgColor, config.textColor
          )}>
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-foreground truncate">{lead.name}</span>
              <span className={cn("font-bold text-sm tabular-nums", lead.budget ? "text-emerald-600" : "text-muted-foreground/40")}>
                {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-[9px] px-1.5 py-0 h-4 font-semibold rounded border-0", config.bgColor, config.textColor)}>
                {STAGE_LABELS[stage]}
              </Badge>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", timeBadge.className)}>
                {timeBadge.text}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2.5 pl-12 text-[11px] text-muted-foreground">
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
          </a>
          {lead.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {lead.city}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pl-12 text-[10px] text-muted-foreground">
          <span>Últ. contato: {lastContact}</span>
          {onAdvance && canAdvance && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdvance(); }}
              className="inline-flex items-center gap-1 text-primary font-semibold"
            >
              <ChevronRightIcon className="w-3 h-3" /> Avançar
            </button>
          )}
        </div>
      </div>
    </>
  );
}

