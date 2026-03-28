import { useMemo, useState, useCallback, useEffect } from "react";
import { usePartnersData } from "@/hooks/admin/usePartnersData";
import { AXO_ORG_ID } from "@/lib/constants";
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
import { QuickQuoteSheet } from "@/components/admin/QuickQuoteSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Phone, MapPin, 
  Clock, AlertTriangle,
  LayoutGrid, List,
  UserPlus, CalendarPlus, FileText, PlusCircle,
  Loader2, X, Zap, Search, Filter
} from "lucide-react";
import { differenceInHours, differenceInDays, format } from "date-fns";
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
};

interface LinearPipelineProps {
  leads: Lead[];
  onRefresh: () => void;
  statusFilter?: PipelineStage;
  onClearFilter?: () => void;
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

/* ─── Reusable Source Toggle (Lead | Parceiro | Novo) ─── */
type SourceType = 'lead' | 'partner' | 'new';

function SourceToggle({ source, onChange }: { source: SourceType; onChange: (s: SourceType) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {([['lead', 'Lead'], ['partner', 'Parceiro'], ['new', '+ Novo']] as const).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
            source === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Inline New Lead Fields ─── */
function InlineNewLeadFields({ form, setForm }: {
  form: { name: string; phone: string; email: string; address: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; address: string }>>;
}) {
  return (
    <div className="space-y-2 p-3 border border-dashed border-border rounded-lg bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground">Dados do novo lead</p>
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

const EMPTY_NEW_LEAD = { name: '', phone: '', email: '', address: '' };

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
        organization_id: AXO_ORG_ID,
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
  const [apptAddress, setApptAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<SourceType>('lead');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [newLeadForm, setNewLeadForm] = useState(EMPTY_NEW_LEAD);
  const { updateLeadStatus } = useLeadPipeline();
  const { addFollowUpAction } = useLeadFollowUp();
  const { partners } = usePartnersData();

  const activePartners = useMemo(() =>
    partners.filter(p => ['active', 'trial_first_job'].includes(p.status)),
    [partners]
  );

  const eligibleLeads = useMemo(() =>
    leads.filter(l => {
      const s = normalizeStatus(l.status);
      return ['cold_lead', 'warm_lead', 'estimate_requested'].includes(s) && !l.converted_to_project_id;
    }),
    [leads]
  );

  const resetForm = () => { 
    setSelectedLeadId(''); setApptDate(''); setApptTime(''); setApptAddress(''); setNotes(''); 
    setSource('lead'); setSelectedPartnerId(''); setNewLeadForm(EMPTY_NEW_LEAD);
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
    if (source === 'partner' && !selectedPartnerId) {
      toast.error('Selecione um parceiro');
      return;
    }
    if (!apptAddress.trim()) {
      toast.error('Endereço é obrigatório');
      return;
    }
    if (!apptDate || !apptTime) {
      toast.error('Selecione data e hora');
      return;
    }

    setSaving(true);
    try {
      if (source === 'partner') {
        const partner = activePartners.find(p => p.id === selectedPartnerId);
        if (!partner) throw new Error('Parceiro não encontrado');

        // Create lead from partner
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            name: partner.contact_name,
            phone: partner.phone || 'N/A',
            email: partner.email,
            lead_source: 'referral',
            status: 'estimate_scheduled',
            priority: 'high',
            address: apptAddress.trim(),
            notes: `Via parceiro: ${partner.company_name}`,
            referred_by_partner_id: partner.id,
            organization_id: AXO_ORG_ID,
          })
          .select('id')
          .single();
        if (insertError) throw insertError;

        // Create appointment
        await supabase.from('appointments').insert({
          customer_name: partner.contact_name,
          customer_phone: partner.phone || 'N/A',
          appointment_date: apptDate,
          appointment_time: apptTime,
          appointment_type: 'estimate',
          location: apptAddress.trim(),
          notes: notes.trim() || `Parceiro: ${partner.company_name}`,
          organization_id: AXO_ORG_ID,
        });

        // Increment partner referrals
        await supabase
          .from('partners')
          .update({ 
            total_referrals: (partner.total_referrals || 0) + 1,
            last_contacted_at: new Date().toISOString(),
          } as any)
          .eq('id', partner.id);

        if (newLead) {
          await addFollowUpAction(newLead.id, {
            date: new Date().toISOString(),
            action: 'Visita agendada via parceiro',
            notes: `Parceiro: ${partner.company_name}`,
          });
        }

        toast.success('Visita agendada via parceiro');
      } else {
        const lead = eligibleLeads.find(l => l.id === selectedLeadId);
        if (!lead) return;

        // Save address to lead
        if (apptAddress.trim()) {
          await supabase.from('leads').update({ address: apptAddress.trim() }).eq('id', lead.id);
        }

        const { error: apptError } = await supabase.from('appointments').insert({
          customer_name: lead.name,
          customer_phone: lead.phone,
          appointment_date: apptDate,
          appointment_time: apptTime,
          appointment_type: 'estimate',
          location: apptAddress.trim() || null,
          notes: notes.trim() || null,
          organization_id: AXO_ORG_ID,
        });
        if (apptError) throw apptError;

        const ok = await updateLeadStatus(lead.id, 'estimate_scheduled');

        await addFollowUpAction(lead.id, {
          date: new Date().toISOString(),
          action: 'Visita agendada',
          notes: notes.trim() || undefined,
        });

        if (ok) {
          toast.success('Visita agendada com sucesso');
        }
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
          {/* Source toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => { setSource('lead'); setSelectedPartnerId(''); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
                source === 'lead' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lead
            </button>
            <button
              onClick={() => { setSource('partner'); setSelectedLeadId(''); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
                source === 'partner' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Parceiro
            </button>
          </div>

          {source === 'lead' ? (
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
          ) : (
            <div>
              <Label>Parceiro *</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um parceiro..." />
                </SelectTrigger>
                <SelectContent>
                  {activePartners.length === 0 ? (
                    <SelectItem value="_none" disabled>Nenhum parceiro ativo</SelectItem>
                  ) : (
                    activePartners.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.contact_name} — {p.company_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="appt-address">Endereço *</Label>
            <Input 
              id="appt-address" 
              value={apptAddress} 
              onChange={e => setApptAddress(e.target.value)} 
              placeholder="Endereço do cliente..."
            />
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
  const [source, setSource] = useState<'lead' | 'partner'>('lead');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const { partners } = usePartnersData();

  // Partners that have referred leads with projects
  const partnerLeadsWithProject = useMemo(() =>
    leads.filter(l => !!l.converted_to_project_id && !!l.referred_by_partner_id),
    [leads]
  );

  const partnersWithProjects = useMemo(() => {
    const partnerIds = new Set(partnerLeadsWithProject.map(l => l.referred_by_partner_id));
    return partners.filter(p => partnerIds.has(p.id));
  }, [partners, partnerLeadsWithProject]);

  // Leads with project linked
  const eligibleLeads = useMemo(() =>
    leads.filter(l => !!l.converted_to_project_id),
    [leads]
  );

  const resetForm = () => { setSelectedLeadId(''); setSelectedPartnerId(''); setSource('lead'); };

  const handleGo = () => {
    if (source === 'partner') {
      // Find leads referred by this partner that have a project
      const partnerLeads = partnerLeadsWithProject.filter(l => l.referred_by_partner_id === selectedPartnerId);
      if (partnerLeads.length > 0 && partnerLeads[0].converted_to_project_id) {
        onOpenChange(false);
        resetForm();
        navigate(`/admin/projects/${partnerLeads[0].converted_to_project_id}`);
      }
    } else {
      const lead = eligibleLeads.find(l => l.id === selectedLeadId);
      if (!lead?.converted_to_project_id) return;
      onOpenChange(false);
      resetForm();
      navigate(`/admin/projects/${lead.converted_to_project_id}`);
    }
  };

  const canGo = source === 'lead' ? !!selectedLeadId : !!selectedPartnerId;

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
          <p className="text-sm text-muted-foreground">Selecione o lead ou parceiro com projeto para abrir o gerador de proposta.</p>

          {/* Source toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => { setSource('lead'); setSelectedPartnerId(''); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
                source === 'lead' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lead
            </button>
            <button
              onClick={() => { setSource('partner'); setSelectedLeadId(''); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
                source === 'partner' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Parceiro
            </button>
          </div>

          {source === 'lead' ? (
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
          ) : (
            <div>
              <Label>Parceiro com Projeto *</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um parceiro..." />
                </SelectTrigger>
                <SelectContent>
                  {partnersWithProjects.length === 0 ? (
                    <SelectItem value="_none" disabled>Nenhum parceiro com projeto</SelectItem>
                  ) : (
                    partnersWithProjects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.contact_name} — {p.company_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
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
  const [source, setSource] = useState<'lead' | 'partner'>('lead');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const { updateLeadStatus } = useLeadPipeline();
  const { addFollowUpAction } = useLeadFollowUp();
  const { partners } = usePartnersData();

  const activePartners = useMemo(() =>
    partners.filter(p => ['active', 'trial_first_job'].includes(p.status)),
    [partners]
  );

  // Leads eligible: warm leads that can move to estimate_requested
  const eligibleLeads = useMemo(() =>
    leads.filter(l => {
      const s = normalizeStatus(l.status);
      return ['cold_lead', 'warm_lead'].includes(s);
    }),
    [leads]
  );

  const resetForm = () => { 
    setSelectedLeadId(''); setSelectedServices([]); setBudget(''); setNotes(''); 
    setSource('lead'); setSelectedPartnerId('');
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
    if (source === 'partner' && !selectedPartnerId) {
      toast.error('Selecione um parceiro');
      return;
    }

    setSaving(true);
    try {
      if (source === 'partner') {
        // Create a new lead from the partner
        const partner = activePartners.find(p => p.id === selectedPartnerId);
        if (!partner) throw new Error('Parceiro não encontrado');

        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            name: partner.contact_name,
            phone: partner.phone || 'N/A',
            email: partner.email,
            lead_source: 'referral',
            status: 'estimate_requested',
            priority: 'high',
            services: selectedServices.length > 0 ? selectedServices : undefined,
            budget: budget ? parseFloat(budget) : undefined,
            notes: notes.trim() || `Via parceiro: ${partner.company_name}`,
            referred_by_partner_id: partner.id,
            organization_id: AXO_ORG_ID,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Increment partner referrals
        await supabase
          .from('partners')
          .update({ 
            total_referrals: (partner.total_referrals || 0) + 1,
            last_contacted_at: new Date().toISOString(),
          } as any)
          .eq('id', partner.id);

        if (newLead) {
          await addFollowUpAction(newLead.id, {
            date: new Date().toISOString(),
            action: 'Orçamento solicitado via parceiro',
            notes: `Parceiro: ${partner.company_name}`,
          });
        }

        toast.success('Solicitação registrada via parceiro');
      } else {
        const lead = eligibleLeads.find(l => l.id === selectedLeadId);
        if (!lead) return;

        // Update informational fields
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
          {/* Source toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => { setSource('lead'); setSelectedPartnerId(''); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
                source === 'lead' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lead
            </button>
            <button
              onClick={() => { setSource('partner'); setSelectedLeadId(''); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors",
                source === 'partner' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Parceiro
            </button>
          </div>

          {source === 'lead' ? (
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
          ) : (
            <div>
              <Label>Parceiro *</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um parceiro..." />
                </SelectTrigger>
                <SelectContent>
                  {activePartners.length === 0 ? (
                    <SelectItem value="_none" disabled>Nenhum parceiro ativo</SelectItem>
                  ) : (
                    activePartners.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.contact_name} — {p.company_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
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

  const salesLeads = useMemo(() => {
    let filtered = leads.filter(l => SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage));
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.phone.includes(q) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [leads, searchQuery]);

  // Unfiltered sales leads for stats (funnel bar uses all data)
  const allSalesLeads = useMemo(() => 
    leads.filter(l => SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage)),
    [leads]
  );

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

  if (allSalesLeads.length === 0 && !searchQuery) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
          <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Nenhum lead ativo. Verifique campanhas ou site.</h3>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Sem leads no funil, nao ha faturamento futuro.
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
      <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-3">
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
                ${pipelineHealth.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            {pipelineHealth.needsAction > 0 && (
              <>
                <div className="h-6 sm:h-8 w-px bg-border" />
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Atenção</span>
                  <span className="text-lg sm:text-xl font-bold text-destructive">{pipelineHealth.needsAction}</span>
                </div>
              </>
            )}
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

        {/* Funnel Health Bar */}
        {pipelineHealth.active > 0 && (
          <div className="space-y-1">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/40">
              {SALES_STAGES.map(stage => {
                const count = stageStats[stage]?.count || 0;
                if (count === 0) return null;
                const pct = (count / pipelineHealth.active) * 100;
                const config = STAGE_CONFIG[stage];
                return (
                  <div
                    key={stage}
                    className={cn("h-full transition-all", config.bgColor, "opacity-80")}
                    style={{ width: `${pct}%`, minWidth: count > 0 ? '4px' : '0' }}
                    title={`${STAGE_LABELS[stage]}: ${count} leads (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {SALES_STAGES.filter(s => (stageStats[s]?.count || 0) > 0).map(stage => {
                const config = STAGE_CONFIG[stage];
                return (
                  <span key={stage} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className={cn("w-2 h-2 rounded-full inline-block", config.bgColor)} />
                    {STAGE_LABELS[stage]} ({stageStats[stage]?.count})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 2: Search + Needs Action Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
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
          <Button
            size="sm"
            variant={needsActionOnly ? "default" : "outline"}
            className={cn(
              "text-xs h-8 flex-shrink-0 gap-1.5",
              needsActionOnly && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
            onClick={() => setNeedsActionOnly(!needsActionOnly)}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atenção</span>
            {pipelineHealth.needsAction > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0 rounded-full font-bold",
                needsActionOnly 
                  ? "bg-destructive-foreground/20 text-destructive-foreground" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {pipelineHealth.needsAction}
              </span>
            )}
          </Button>
        </div>

        {/* Row 3: Action Buttons — differentiated */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
          <Button
            size="sm"
            className="text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowNewLeadModal(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Lead
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowApptModal(true)}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Appt.
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowProposalModal(true)}
          >
            <FileText className="w-3.5 h-3.5" />
            Proposal
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => setShowRequestModal(true)}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Request
          </Button>
        </div>
      </div>

      {/* Active Filter Chip */}
      {(statusFilter || searchQuery || needsActionOnly) && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilter && (
            <Badge variant="secondary" className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
              STAGE_CONFIG[statusFilter]?.bgColor,
              STAGE_CONFIG[statusFilter]?.textColor
            )}>
              Filtro: {STAGE_LABELS[statusFilter]}
              <button
                onClick={onClearFilter}
                className="ml-1 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                aria-label="Limpar filtro"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
              Busca: "{searchQuery}" ({filteredSalesLeads.length})
            </Badge>
          )}
          {needsActionOnly && (
            <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              Modo Atenção
            </Badge>
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-1 min-w-max items-start">
            {SALES_STAGES.map((stage, idx) => {
              const config = STAGE_CONFIG[stage];
              const stageLeads = leadsByStage[stage];
              const stats = stageStats[stage];
              const rate = conversionRates[stage];

              return (
                <div key={stage} className="flex items-start">
                  <div
                    className={cn(
                      "w-[240px] sm:w-[260px] flex-shrink-0 flex flex-col transition-opacity duration-200",
                      statusFilter && statusFilter !== stage && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0",
                      config.bgColor,
                      statusFilter === stage && "ring-2 ring-offset-1 ring-primary"
                    )}>
                      <span className={cn("font-semibold text-xs truncate", config.textColor)}>
                        {STAGE_LABELS[stage]}
                      </span>
                      {stats.avgDays > 0 && (
                        <span className="text-[9px] text-muted-foreground font-medium bg-background/60 px-1.5 py-0.5 rounded">
                          ~{stats.avgDays}d
                        </span>
                      )}
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
                      <div className="max-h-[60vh] overflow-y-auto">
                        <div className="p-1.5 space-y-1.5">
                          {stageLeads.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground/60 text-xs">
                              Sem leads neste estagio
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
                                onQuickQuote={['estimate_scheduled', 'in_draft'].includes(normalizeStatus(lead.status)) ? () => handleQuickQuote(lead) : undefined}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion rate arrow between stages */}
                  {idx < SALES_STAGES.length - 1 && rate !== undefined && (
                    <div className="flex flex-col items-center justify-center px-0.5 pt-8 flex-shrink-0">
                      <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                        {rate}%
                      </span>
                      <span className="text-muted-foreground/40 text-xs">→</span>
                    </div>
                  )}
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
          <div className="hidden md:grid grid-cols-[2fr_130px_140px_160px_100px_90px] gap-3 px-5 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
            <span>Lead</span>
            <span>Estágio</span>
            <span>Contato</span>
            <span>Serviços</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Tempo</span>
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
function PipelineCard({ lead, nra, isStale, isBlocked, onClick, onQuickQuote }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
  onQuickQuote?: () => void;
}) {
  const timeBadge = getTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const services: string[] = Array.isArray(lead.services) ? lead.services : [];

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border bg-card cursor-pointer transition-all group",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        isBlocked && "ring-2 ring-destructive/40 bg-destructive/5",
        isStale && !isBlocked && "ring-2 ring-[hsl(var(--state-risk))]/40 bg-[hsl(var(--state-risk))]/5"
      )}
    >
      {/* Row 1: Name + Value */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-bold text-sm text-foreground truncate leading-tight">
            {lead.name.toUpperCase()}
          </span>
        </div>
        <span className="font-bold text-sm text-foreground whitespace-nowrap flex-shrink-0">
          {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* Row 2: Contact info */}
      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span>{lead.phone}</span>
        </a>
        {lead.city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {lead.city}
          </span>
        )}
      </div>

      {/* Divider: Serviços */}
      {services.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border/40">
          <span className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Serviços</span>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {services.map(s => (
              <Badge key={s} variant="secondary" className="text-[9px] px-2 py-0.5 h-auto bg-primary/10 text-primary border-primary/20">
                {serviceLabels[s] || s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Source badge */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-auto">
          {sourceLabels[lead.lead_source] || lead.lead_source}
        </Badge>
      </div>

      {/* Quick Quote button */}
      {onQuickQuote && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickQuote(); }}
          className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/60 w-full text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          Quick Quote
        </button>
      )}

      {/* Operational Alert */}
      {alert && (
        <div className={cn(
          "flex items-center gap-1.5 mt-3 pt-3 border-t border-border/60 text-[11px] font-medium",
          alert.type === 'critical' && "text-destructive",
          alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
          alert.type === 'info' && "text-primary"
        )}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{alert.text}</span>
        </div>
      )}
    </div>
  );
}

/* ─── List Row ─── */
function PipelineListRow({ lead, nra, isStale, isBlocked, onClick, onQuickQuote }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
  onQuickQuote?: () => void;
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
          "hidden md:grid grid-cols-[2fr_130px_140px_160px_100px_90px] gap-3 px-5 py-3.5 rounded-xl border bg-card cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-[1px]",
          isBlocked && "border-destructive/40 bg-destructive/5 shadow-destructive/10",
          isStale && !isBlocked && "border-[hsl(var(--state-risk))]/40 bg-[hsl(var(--state-risk))]/5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circle */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
            config.bgColor, config.textColor
          )}>
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate leading-tight">{lead.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 border-muted-foreground/20">
                {sourceLabels[lead.lead_source] || lead.lead_source}
              </Badge>
              {alert && (
                <AlertTriangle className={cn(
                  "w-3 h-3 flex-shrink-0",
                  alert.type === 'critical' && "text-destructive",
                  alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
                  alert.type === 'info' && "text-primary"
                )} />
              )}
            </div>
            {onQuickQuote && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onQuickQuote(); }}
                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors w-fit"
              >
                <Zap className="w-3 h-3" />
                Quick Quote
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <Badge className={cn("text-[10px] px-2 py-0.5 h-5 font-semibold rounded-md", config.bgColor, config.textColor, "border-0")}>
            {STAGE_LABELS[stage]}
          </Badge>
        </div>
        <div className="flex items-center">
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors group">
            <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Phone className="w-3 h-3" />
            </div>
            <span className="truncate">{lead.phone}</span>
          </a>
        </div>
        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          {services.slice(0, 2).map(s => (
            <Badge key={s} variant="secondary" className="text-[9px] px-2 py-0.5 h-5 bg-muted/80 text-muted-foreground font-medium">
              {serviceLabels[s] || s}
            </Badge>
          ))}
          {services.length > 2 && <span className="text-[9px] text-muted-foreground font-medium">+{services.length - 2}</span>}
          {services.length === 0 && <span className="text-[10px] text-muted-foreground/40">—</span>}
        </div>
        <div className="flex items-center justify-end">
          <span className={cn(
            "font-bold text-sm",
            lead.budget ? "text-foreground" : "text-muted-foreground/40"
          )}>
            {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-end">
          <span className={cn("text-[10px] px-2 py-1 rounded-md font-semibold", timeBadge.className)}>{timeBadge.text}</span>
        </div>
      </div>

      {/* Mobile card */}
      <div
        onClick={onClick}
        className={cn(
          "md:hidden rounded-xl border bg-card p-3.5 cursor-pointer transition-all duration-200",
          "hover:shadow-md active:scale-[0.99]",
          isBlocked && "border-destructive/40 bg-destructive/5",
          isStale && !isBlocked && "border-[hsl(var(--state-risk))]/40 bg-[hsl(var(--state-risk))]/5"
        )}
      >
        {/* Row 1: Avatar + Name + Value */}
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
              <span className={cn(
                "font-bold text-sm whitespace-nowrap",
                lead.budget ? "text-foreground" : "text-muted-foreground/40"
              )}>
                {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-[9px] px-1.5 py-0 h-4 font-semibold rounded", config.bgColor, config.textColor, "border-0")}>
                {STAGE_LABELS[stage]}
              </Badge>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", timeBadge.className)}>
                {timeBadge.text}
              </span>
            </div>
          </div>
        </div>
        {/* Row 2: Contact info */}
        <div className="flex items-center gap-3 mt-2.5 pl-12 text-[11px] text-muted-foreground">
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary transition-colors">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
          </a>
          {lead.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {lead.city}
            </span>
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-muted-foreground/20">
            {sourceLabels[lead.lead_source] || lead.lead_source}
          </Badge>
        </div>
        {onQuickQuote && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onQuickQuote(); }}
            className="flex items-center gap-1.5 mt-2.5 pl-12 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Quick Quote
          </button>
        )}
        {/* Row 3: Alert */}
        {alert && (
          <div className={cn(
            "flex items-center gap-1.5 mt-2 pl-12 text-[10px] font-medium",
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
