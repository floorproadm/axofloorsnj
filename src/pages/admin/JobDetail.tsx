import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProposalGenerator } from '@/components/admin/ProposalGenerator';
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { ProjectDocumentsManager } from '@/components/admin/ProjectDocumentsManager';
import { JobFinancialHeader } from '@/components/admin/job-detail/JobFinancialHeader';
import { InvoicesPaymentsSection } from '@/components/admin/job-detail/InvoicesPaymentsSection';
import { useMaterialCosts, useAddMaterialCost, useDeleteMaterialCost } from '@/hooks/useMaterialCosts';
import { useLaborEntries, useAddLaborEntry, useDeleteLaborEntry } from '@/hooks/useLaborEntries';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, User, Phone, Mail, Ruler, Calendar,
  Clock, Hammer, ChevronRight,
  Camera, Pencil, Check, X, Navigation, Send, Users,
  Trash2, ImagePlus, MessageSquare, StickyNote, FileText, FolderOpen,
  Package, HardHat, Plus, Target, Receipt
} from 'lucide-react';
import { AXO_ORG_ID } from '@/lib/constants';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'in_production', label: 'Active', dot: 'bg-blue-500' },
  { value: 'completed', label: 'Done', dot: 'bg-emerald-500' },
];

// ─── Compact property row ───
function PropRow({ label, value, icon, onSave, type = 'text', placeholder }: {
  label: string; value: string; icon: React.ReactNode;
  onSave: (v: string) => Promise<void>; type?: 'text' | 'date' | 'number';
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <span className="text-muted-foreground/50 w-4 flex-shrink-0">{icon}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16 flex-shrink-0">{label}</span>
        <Input type={type} value={draft} onChange={(e) => setDraft(e.target.value)} className="text-xs h-6 px-2 bg-muted/40 border-border/50 flex-1"
          autoFocus onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} />
        <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-500" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground" onClick={() => { setDraft(value); setEditing(false); }}>
          <X className="w-2.5 h-2.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1.5 py-1 cursor-pointer hover:bg-muted/20 rounded -mx-1 px-1 transition-colors" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="text-muted-foreground/50 w-4 flex-shrink-0">{icon}</span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16 flex-shrink-0">{label}</span>
      <span className={cn("text-xs flex-1 truncate", value ? "text-foreground" : "text-muted-foreground/40 italic")}>{value || placeholder || '—'}</span>
      <Pencil className="w-2.5 h-2.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 flex-shrink-0 transition-opacity" />
    </div>
  );
}

// ─── Collapsible section (compact) ───
function Section({ title, icon, children, defaultOpen = true, badge, className }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string; className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-1.5 py-2 px-0.5 hover:bg-muted/20 transition-colors rounded group">
          <ChevronRight className={cn("w-3 h-3 text-muted-foreground/50 transition-transform", open && "rotate-90")} />
          <span className="text-muted-foreground/60">{icon}</span>
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">{title}</span>
          {badge && <span className="text-[10px] font-medium text-muted-foreground tabular-nums ml-auto mr-1">{badge}</span>}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-5 pb-1.5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [proposalOpen, setProposalOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data, error } = await supabase.from('projects').select('*').eq('id', jobId).single();
      if (error) throw error;
      const [proofRes, partnerRes] = await Promise.all([
        supabase.from('job_proof').select('id, project_id, before_image_url, after_image_url').eq('project_id', jobId),
        data.referred_by_partner_id
          ? supabase.from('partners').select('id, company_name, contact_name').eq('id', data.referred_by_partner_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...data,
        team_lead: data.team_lead || null,
        team_members: data.team_members || [],
        work_schedule: data.work_schedule || '8:00 AM - 5:00 PM',
        job_proof: proofRes.data || [],
        partner_name: partnerRes.data ? ((partnerRes.data as any).contact_name || (partnerRes.data as any).company_name) : null,
      };
    },
    enabled: !!jobId,
  });

  const updateField = async (field: string, value: any) => {
    if (!jobId) return;
    const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', jobId);
    if (error) throw error;
    toast.success('Updated');
    refetch();
  };

  const handleStatusChange = async (status: string) => {
    try { await updateField('project_status', status); } catch (err: any) { toast.error(err?.message || 'Error'); }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Job" breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout title="Job" breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}>
        <div className="text-center py-20 text-muted-foreground">Job not found</div>
      </AdminLayout>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === project.project_status) || STATUS_OPTIONS[0];
  const addressFull = [project.address, project.city, project.zip_code].filter(Boolean).join(', ');
  const mapsUrl = addressFull ? `https://maps.google.com/?q=${encodeURIComponent(addressFull)}` : null;

  return (
    <AdminLayout
      title={project.address || project.customer_name || 'Job'}
      breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }, { label: project.address || project.customer_name || 'Job' }]}
    >
      <div className="max-w-3xl mx-auto pb-10">

        {/* ═══ ZONE 1: HEADER ═══ */}
        <div className="flex items-center gap-2.5 mb-3">
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-muted-foreground" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground leading-tight truncate flex-1">
            {project.address || project.customer_name || 'New Job'}
          </h1>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1" onClick={() => setProposalOpen(true)}>
              <FileText className="w-3 h-3" /> Proposal
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1" onClick={() => setDocsOpen(true)}>
              <FolderOpen className="w-3 h-3" /> Docs
            </Button>
            <Select value={project.project_status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-6 w-auto min-w-[90px] text-[10px] font-bold border-border/40 rounded gap-1 bg-card px-2">
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", currentStatus.dot)} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══ ZONE 2: FINANCIAL METRICS (dense) ═══ */}
        <JobFinancialHeader projectId={project.id} />

        {/* ═══ ZONE 3: NEXT ACTION ═══ */}
        {project.next_action && (
          <div className="flex items-center gap-2 px-3 py-2 mt-3 rounded-md border border-primary/20 bg-primary/5">
            <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-medium text-foreground">{project.next_action}</span>
          </div>
        )}

        {/* ═══ ZONE 4: JOB PROPERTIES (inline grid, always visible) ═══ */}
        <div className="mt-4 mb-1 px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <PropRow label="Service" value={project.project_type} icon={<Hammer className="w-3 h-3" />} onSave={(v) => updateField('project_type', v)} placeholder="e.g. Sand & Refinish" />
            <PropRow label="Sqft" value={project.square_footage?.toString() || ''} icon={<Ruler className="w-3 h-3" />} onSave={(v) => updateField('square_footage', v ? parseFloat(v) : null)} type="number" placeholder="—" />
            <PropRow label="Start" value={project.start_date || ''} icon={<Calendar className="w-3 h-3" />} onSave={(v) => updateField('start_date', v || null)} type="date" placeholder="—" />
            <PropRow label="End" value={project.completion_date || ''} icon={<Calendar className="w-3 h-3" />} onSave={(v) => updateField('completion_date', v || null)} type="date" placeholder="—" />
            <PropRow label="Lead" value={project.team_lead || ''} icon={<User className="w-3 h-3" />} onSave={(v) => updateField('team_lead', v || null)} placeholder="Assign" />
            <PropRow label="Hours" value={project.work_schedule || ''} icon={<Clock className="w-3 h-3" />} onSave={(v) => updateField('work_schedule', v)} placeholder="8-5 PM" />
          </div>
          {project.partner_name && (
            <div className="flex items-center gap-1.5 py-1 mt-0.5 text-xs">
              <Users className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16">Partner</span>
              <span className="text-foreground">{project.partner_name}</span>
            </div>
          )}
        </div>

        {/* ═══ ZONE 5: COMMENTS (always open, prominent) ═══ */}
        <div className="mt-3 mb-2 rounded-lg border border-border/40 bg-card/50">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/30">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">Comments</span>
          </div>
          <div className="px-3 py-2">
            <CommentsSection projectId={project.id} />
          </div>
        </div>

        {/* ═══ ZONE 6: COLLAPSIBLE SECTIONS ═══ */}
        <div className="mt-2 space-y-0 divide-y divide-border/30">
          {/* Client */}
          <Section title="Client" icon={<User className="w-3.5 h-3.5" />} defaultOpen={false}>
            <ClientSection project={project} updateField={updateField} refetch={refetch} mapsUrl={mapsUrl} />
          </Section>

          {/* Notes */}
          <Section title="Notes" icon={<StickyNote className="w-3.5 h-3.5" />}>
            <NotesSection value={project.notes || ''} onSave={(v) => updateField('notes', v)} />
          </Section>

          {/* Materials */}
          <MaterialsSection projectId={project.id} />

          {/* Labor */}
          <LaborSection projectId={project.id} />

          {/* Invoices & Payments */}
          <Section title="Invoices & Payments" icon={<Receipt className="w-3.5 h-3.5" />}>
            <InvoicesPaymentsSection projectId={project.id} />
          </Section>

          {/* Photos */}
          <Section title="Photos" icon={<Camera className="w-3.5 h-3.5" />}>
            <JobProofUploader projectId={project.id} />
          </Section>
        </div>
      </div>

      {/* Sheets */}
      <Sheet open={proposalOpen} onOpenChange={setProposalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Proposal</SheetTitle></SheetHeader>
          <div className="mt-4"><ProposalGenerator projectId={project.id} /></div>
        </SheetContent>
      </Sheet>
      <Sheet open={docsOpen} onOpenChange={setDocsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Documents</SheetTitle></SheetHeader>
          <div className="mt-4"><ProjectDocumentsManager projectId={project.id} /></div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════
// CLIENT SECTION
// ═══════════════════════════════════════
function ClientSection({ project, updateField, refetch, mapsUrl }: any) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        <PropRow label="Name" value={project.customer_name} icon={<User className="w-3 h-3" />} onSave={(v) => updateField('customer_name', v)} placeholder="Customer" />
        <PropRow label="Phone" value={project.customer_phone} icon={<Phone className="w-3 h-3" />} onSave={(v) => updateField('customer_phone', v)} placeholder="Phone" />
        <PropRow label="Email" value={project.customer_email || ''} icon={<Mail className="w-3 h-3" />} onSave={(v) => updateField('customer_email', v)} placeholder="Email" />
      </div>
      <div className="mt-1 mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Address</span>
        <div className="mt-0.5">
          <AddressAutocomplete
            value={project.address || ''}
            onChange={(v) => updateField('address', v)}
            onSelect={async (result) => {
              try {
                await supabase.from('projects').update({ address: result.full, city: result.city, zip_code: result.zip }).eq('id', project.id);
                refetch();
                toast.success('Address updated');
              } catch { toast.error('Failed'); }
            }}
            placeholder="Start typing…"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 text-muted-foreground text-[10px] font-medium hover:bg-muted hover:text-foreground transition-colors">
            <Navigation className="w-2.5 h-2.5" /> Maps
          </a>
        )}
        {project.customer_phone && (
          <>
            <a href={`tel:${project.customer_phone}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 text-muted-foreground text-[10px] font-medium hover:bg-muted hover:text-foreground transition-colors">
              <Phone className="w-2.5 h-2.5" /> Call
            </a>
            <a href={`sms:${project.customer_phone}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 text-muted-foreground text-[10px] font-medium hover:bg-muted hover:text-foreground transition-colors">
              <MessageSquare className="w-2.5 h-2.5" /> SMS
            </a>
          </>
        )}
        {project.customer_email && (
          <a href={`mailto:${project.customer_email}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 text-muted-foreground text-[10px] font-medium hover:bg-muted hover:text-foreground transition-colors">
            <Mail className="w-2.5 h-2.5" /> Email
          </a>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// NOTES SECTION
// ═══════════════════════════════════════
function NotesSection({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="text-xs min-h-[60px] bg-muted/30 border-border/40" autoFocus />
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</Button>
          <Button size="sm" className="h-6 text-[10px]" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded px-1 py-1 hover:bg-muted/20 transition-colors -mx-1" onClick={() => { setDraft(value); setEditing(true); }}>
      <p className={cn("text-xs leading-relaxed", value ? "text-foreground/80" : "text-muted-foreground/40 italic")}>
        {value || 'Click to add notes…'}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════
// COMMENTS SECTION
// ═══════════════════════════════════════
function CommentsSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['project-comments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCommentImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  const clearImage = () => { setCommentImage(null); setCommentImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleSubmit = async () => {
    if (!commentText.trim() && !commentImage) return;
    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (commentImage) {
        const ext = commentImage.name.split('.').pop() || 'jpg';
        const path = `${projectId}/comments/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('project-documents').upload(path, commentImage);
        if (upErr) throw upErr;
        const { data: urlData } = await supabase.storage.from('project-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
        imageUrl = urlData?.signedUrl || null;
      }
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId, content: commentText.trim() || '📷 Photo added', image_url: imageUrl, author_name: 'Admin', organization_id: AXO_ORG_ID,
      });
      if (error) throw error;
      setCommentText(''); clearImage();
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
    } catch { toast.error('Error'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('project_comments').delete().eq('id', id);
    if (error) toast.error('Error');
    else queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        <Input placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="text-xs h-7 bg-muted/20 border-border/30 flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="w-3 h-3" />
        </Button>
        <Button size="icon" className="h-7 w-7" disabled={isSubmitting || (!commentText.trim() && !commentImage)} onClick={handleSubmit}>
          {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </div>
      {commentImagePreview && (
        <div className="relative inline-block mb-2">
          <img src={commentImagePreview} alt="" className="h-12 rounded border border-border/40 object-cover" />
          <Button variant="destructive" size="icon" className="absolute -top-1 -right-1 h-4 w-4 rounded-full" onClick={clearImage}><X className="w-2 h-2" /></Button>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/50 text-center py-2 italic">No comments yet</p>
      ) : (
        <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="group flex gap-2 py-1.5 rounded hover:bg-muted/20 transition-colors">
              <div className="w-5 h-5 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold">{c.author_name}</span>
                  <span className="text-[9px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)}><Trash2 className="w-2 h-2 text-destructive" /></Button>
                </div>
                <p className="text-xs text-foreground/85 leading-snug">{c.content}</p>
                {c.image_url && <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="block mt-1"><img src={c.image_url} alt="" className="max-h-24 rounded border border-border/40 object-cover" /></a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MATERIALS
// ═══════════════════════════════════════
function MaterialsSection({ projectId }: { projectId: string }) {
  const { data: materials = [], isLoading } = useMaterialCosts(projectId);
  const { mutateAsync: addMaterial, isPending: isAdding } = useAddMaterialCost();
  const { mutateAsync: deleteMaterial } = useDeleteMaterialCost();
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');

  const total = materials.reduce((s, m) => s + m.amount, 0);

  const handleAdd = async () => {
    if (!desc.trim() || !amount) return;
    try {
      await addMaterial({ project_id: projectId, description: desc, supplier: supplier || undefined, amount: parseFloat(amount) });
      setDesc(''); setSupplier(''); setAmount(''); setShowForm(false);
    } catch { toast.error('Error'); }
  };

  return (
    <Section title="Materials" icon={<Package className="w-3.5 h-3.5" />} defaultOpen={materials.length > 0} badge={total > 0 ? formatCurrency(total) : undefined}>
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {materials.length > 0 && (
            <div className="space-y-0 mb-1.5">
              {materials.map((m) => (
                <div key={m.id} className="group flex items-center justify-between py-1 px-1 rounded hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground">{m.description}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{m.supplier || ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMaterial({ id: m.id, projectId })}><Trash2 className="w-2.5 h-2.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showForm ? (
            <div className="rounded border border-border/40 bg-muted/10 p-2 space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-xs h-7 bg-card border-border/40" autoFocus />
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="text-xs h-7 bg-card border-border/40" />
                <Input type="number" placeholder="$ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-xs h-7 bg-card border-border/40"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-6 text-[10px]" onClick={handleAdd} disabled={isAdding || !desc.trim() || !amount}>
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-0.5">
              <Plus className="w-2.5 h-2.5" /> Add material
            </button>
          )}
        </>
      )}
    </Section>
  );
}

// ═══════════════════════════════════════
// LABOR
// ═══════════════════════════════════════
function LaborSection({ projectId }: { projectId: string }) {
  const { data: entries = [], isLoading } = useLaborEntries(projectId);
  const { mutateAsync: addEntry, isPending: isAdding } = useAddLaborEntry();
  const { mutateAsync: deleteEntry } = useDeleteLaborEntry();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [days, setDays] = useState('1');

  const total = entries.reduce((s, e) => s + (e.total_cost ?? e.daily_rate * e.days_worked), 0);

  const handleAdd = async () => {
    if (!name.trim() || !rate) return;
    try {
      await addEntry({ project_id: projectId, worker_name: name, daily_rate: parseFloat(rate), days_worked: parseFloat(days) || 1 });
      setName(''); setRate(''); setDays('1'); setShowForm(false);
    } catch { toast.error('Error'); }
  };

  return (
    <Section title="Labor" icon={<HardHat className="w-3.5 h-3.5" />} defaultOpen={entries.length > 0} badge={total > 0 ? formatCurrency(total) : undefined}>
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="space-y-0 mb-1.5">
              {entries.map((e) => (
                <div key={e.id} className="group flex items-center justify-between py-1 px-1 rounded hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground">{e.worker_name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{formatCurrency(e.daily_rate)}/d × {e.days_worked}d</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold tabular-nums">{formatCurrency(e.total_cost ?? e.daily_rate * e.days_worked)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEntry({ id: e.id, projectId })}><Trash2 className="w-2.5 h-2.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showForm ? (
            <div className="rounded border border-border/40 bg-muted/10 p-2 space-y-1.5">
              <Input placeholder="Worker name" value={name} onChange={(e) => setName(e.target.value)} className="text-xs h-7 bg-card border-border/40" autoFocus />
              <div className="grid grid-cols-2 gap-1.5">
                <Input type="number" placeholder="Rate $/day" value={rate} onChange={(e) => setRate(e.target.value)} className="text-xs h-7 bg-card border-border/40" />
                <Input type="number" placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} className="text-xs h-7 bg-card border-border/40"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-6 text-[10px]" onClick={handleAdd} disabled={isAdding || !name.trim() || !rate}>
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-0.5">
              <Plus className="w-2.5 h-2.5" /> Add labor entry
            </button>
          )}
        </>
      )}
    </Section>
  );
}
