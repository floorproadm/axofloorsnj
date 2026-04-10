import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock, Hammer, ChevronDown, ChevronRight,
  Camera, Pencil, Check, X, Navigation, Send, Users,
  Trash2, ImagePlus, MessageSquare, StickyNote, FileText, FolderOpen,
  Package, HardHat, Plus, Target, Receipt, MapPin, ExternalLink
} from 'lucide-react';
import { AXO_ORG_ID } from '@/lib/constants';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { value: 'in_production', label: 'Active', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { value: 'completed', label: 'Done', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
];

// ─── Inline editable field ───
function EditableField({ label, value, icon, onSave, type = 'text', placeholder }: {
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
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/30">
        <span className="text-muted-foreground w-5 flex-shrink-0">{icon}</span>
        <span className="text-sm font-medium text-muted-foreground w-20 flex-shrink-0">{label}</span>
        <Input type={type} value={draft} onChange={(e) => setDraft(e.target.value)} className="text-sm h-9 flex-1"
          autoFocus onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => { setDraft(value); setEditing(false); }}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="text-muted-foreground w-5 flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <span className={cn("text-sm font-medium flex-1 truncate", value ? "text-foreground" : "text-muted-foreground/40 italic")}>{value || placeholder || '—'}</span>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 flex-shrink-0 transition-opacity" />
    </div>
  );
}

// ─── Section card ───
function SectionCard({ title, icon, children, defaultOpen = true, badge, action }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string; action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors py-3.5 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
                {icon}
              </div>
              <CardTitle className="text-base font-semibold text-foreground flex-1">{title}</CardTitle>
              {badge && (
                <Badge variant="secondary" className="text-xs font-bold tabular-nums px-2.5 py-0.5">
                  {badge}
                </Badge>
              )}
              {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
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
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout title="Job" breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}>
        <div className="text-center py-20 text-muted-foreground text-lg">Job not found</div>
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
      <div className="max-w-4xl mx-auto pb-12 space-y-5">

        {/* ═══ HERO HEADER ═══ */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* Top row: back + actions */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground gap-2" onClick={() => navigate('/admin/jobs')}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 text-sm gap-2" onClick={() => setProposalOpen(true)}>
                  <FileText className="w-4 h-4" /> Proposal
                </Button>
                <Button variant="outline" size="sm" className="h-9 text-sm gap-2" onClick={() => setDocsOpen(true)}>
                  <FolderOpen className="w-4 h-4" /> Docs
                </Button>
              </div>
            </div>

            {/* Title + Status */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {project.address || project.customer_name || 'New Job'}
                </h1>
                {project.customer_name && project.address && (
                  <p className="text-base text-muted-foreground mt-1 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {project.customer_name}
                    {project.customer_phone && (
                      <span className="text-muted-foreground/60">· {project.customer_phone}</span>
                    )}
                  </p>
                )}
                {addressFull && mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {addressFull}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Select value={project.project_status} onValueChange={handleStatusChange}>
                <SelectTrigger className={cn(
                  "h-10 w-auto min-w-[130px] text-sm font-bold rounded-lg gap-2 px-4 border",
                  currentStatus.bg
                )}>
                  <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", currentStatus.dot)} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2 text-sm">
                        <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Action Banner */}
            {project.next_action && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 mb-4">
                <Target className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">{project.next_action}</span>
              </div>
            )}

            {/* Partner badge */}
            {project.partner_name && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Partner: {project.partner_name}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* ═══ FINANCIAL METRICS ═══ */}
        <JobFinancialHeader projectId={project.id} />

        {/* ═══ JOB DETAILS ═══ */}
        <SectionCard title="Job Details" icon={<Hammer className="w-4 h-4" />} defaultOpen={true}>
          <div className="divide-y divide-border/30">
            <EditableField label="Service" value={project.project_type} icon={<Hammer className="w-4 h-4" />} onSave={(v) => updateField('project_type', v)} placeholder="e.g. Sand & Refinish" />
            <EditableField label="Sqft" value={project.square_footage?.toString() || ''} icon={<Ruler className="w-4 h-4" />} onSave={(v) => updateField('square_footage', v ? parseFloat(v) : null)} type="number" placeholder="—" />
            <EditableField label="Start Date" value={project.start_date || ''} icon={<Calendar className="w-4 h-4" />} onSave={(v) => updateField('start_date', v || null)} type="date" placeholder="—" />
            <EditableField label="End Date" value={project.completion_date || ''} icon={<Calendar className="w-4 h-4" />} onSave={(v) => updateField('completion_date', v || null)} type="date" placeholder="—" />
            <EditableField label="Team Lead" value={project.team_lead || ''} icon={<User className="w-4 h-4" />} onSave={(v) => updateField('team_lead', v || null)} placeholder="Assign team lead" />
            <EditableField label="Schedule" value={project.work_schedule || ''} icon={<Clock className="w-4 h-4" />} onSave={(v) => updateField('work_schedule', v)} placeholder="8:00 AM - 5:00 PM" />
          </div>
        </SectionCard>

        {/* ═══ COMMENTS ═══ */}
        <SectionCard title="Team Comments" icon={<MessageSquare className="w-4 h-4" />} defaultOpen={true}>
          <CommentsSection projectId={project.id} />
        </SectionCard>

        {/* ═══ CLIENT ═══ */}
        <SectionCard title="Client Info" icon={<User className="w-4 h-4" />} defaultOpen={false}>
          <ClientSection project={project} updateField={updateField} refetch={refetch} mapsUrl={mapsUrl} />
        </SectionCard>

        {/* ═══ NOTES ═══ */}
        <SectionCard title="Notes" icon={<StickyNote className="w-4 h-4" />} defaultOpen={true}>
          <NotesSection value={project.notes || ''} onSave={(v) => updateField('notes', v)} />
        </SectionCard>

        {/* ═══ MATERIALS ═══ */}
        <MaterialsSection projectId={project.id} />

        {/* ═══ LABOR ═══ */}
        <LaborSection projectId={project.id} />

        {/* ═══ INVOICES & PAYMENTS ═══ */}
        <SectionCard title="Invoices & Payments" icon={<Receipt className="w-4 h-4" />} defaultOpen={true}>
          <InvoicesPaymentsSection projectId={project.id} />
        </SectionCard>

        {/* ═══ PHOTOS ═══ */}
        <SectionCard title="Photos & Proof" icon={<Camera className="w-4 h-4" />} defaultOpen={true}>
          <JobProofUploader projectId={project.id} />
        </SectionCard>
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
    <div className="space-y-2">
      <div className="divide-y divide-border/30">
        <EditableField label="Name" value={project.customer_name} icon={<User className="w-4 h-4" />} onSave={(v) => updateField('customer_name', v)} placeholder="Customer name" />
        <EditableField label="Phone" value={project.customer_phone} icon={<Phone className="w-4 h-4" />} onSave={(v) => updateField('customer_phone', v)} placeholder="Phone number" />
        <EditableField label="Email" value={project.customer_email || ''} icon={<Mail className="w-4 h-4" />} onSave={(v) => updateField('customer_email', v)} placeholder="Email address" />
      </div>
      <div className="pt-3">
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Address</label>
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
          placeholder="Start typing address…"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap pt-2">
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-sm text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
            <Navigation className="w-3.5 h-3.5" /> Maps
          </a>
        )}
        {project.customer_phone && (
          <>
            <a href={`tel:${project.customer_phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-sm text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            <a href={`sms:${project.customer_phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-sm text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> SMS
            </a>
          </>
        )}
        {project.customer_email && (
          <a href={`mailto:${project.customer_email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-sm text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
        )}
      </div>
    </div>
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
      <div className="space-y-3">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="text-sm min-h-[100px]" autoFocus />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="h-9 text-sm" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</Button>
          <Button size="sm" className="h-9 text-sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded-lg px-3 py-3 hover:bg-muted/20 transition-colors -mx-1" onClick={() => { setDraft(value); setEditing(true); }}>
      <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", value ? "text-foreground" : "text-muted-foreground/40 italic")}>
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
      {/* Comment input */}
      <div className="flex gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <Input placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="text-sm h-10"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
          {commentImagePreview && (
            <div className="relative inline-block">
              <img src={commentImagePreview} alt="" className="h-16 rounded-lg border border-border/40 object-cover" />
              <Button variant="destructive" size="icon" className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full" onClick={clearImage}><X className="w-3 h-3" /></Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
            <Button variant="ghost" size="sm" className="h-8 text-sm text-muted-foreground gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4" /> Photo
            </Button>
            <Button size="sm" className="h-8 text-sm ml-auto gap-1.5" disabled={isSubmitting || (!commentText.trim() && !commentImage)} onClick={handleSubmit}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground/50 text-center py-4 italic">No comments yet — start the conversation</p>
      ) : (
        <div className="space-y-1 max-h-[350px] overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="group flex gap-3 py-3 px-2 rounded-lg hover:bg-muted/20 transition-colors">
              <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {new Date(c.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{c.content}</p>
                {c.image_url && (
                  <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <img src={c.image_url} alt="" className="max-h-32 rounded-lg border border-border/40 object-cover" />
                  </a>
                )}
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
    <SectionCard title="Materials" icon={<Package className="w-4 h-4" />} defaultOpen={materials.length > 0}
      badge={total > 0 ? formatCurrency(total) : undefined}
      action={
        <Button variant="ghost" size="sm" className="h-8 text-sm gap-1.5 text-muted-foreground" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      }>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {materials.length > 0 ? (
            <div className="divide-y divide-border/20">
              {materials.map((m) => (
                <div key={m.id} className="group flex items-center justify-between py-2.5 px-1 rounded hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.description}</p>
                    {m.supplier && <p className="text-xs text-muted-foreground">{m.supplier}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(m.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMaterial({ id: m.id, projectId })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showForm && (
            <p className="text-sm text-muted-foreground/50 text-center py-3 italic">No materials logged yet</p>
          )}
          {showForm && (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm h-10" autoFocus />
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="text-sm h-10" />
                <Input type="number" placeholder="$ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-sm h-10"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="h-9 text-sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-9 text-sm" onClick={handleAdd} disabled={isAdding || !desc.trim() || !amount}>
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Material'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
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
    <SectionCard title="Labor" icon={<HardHat className="w-4 h-4" />} defaultOpen={entries.length > 0}
      badge={total > 0 ? formatCurrency(total) : undefined}
      action={
        <Button variant="ghost" size="sm" className="h-8 text-sm gap-1.5 text-muted-foreground" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      }>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {entries.length > 0 ? (
            <div className="divide-y divide-border/20">
              {entries.map((e) => (
                <div key={e.id} className="group flex items-center justify-between py-2.5 px-1 rounded hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{e.worker_name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(e.daily_rate)}/day × {e.days_worked} days</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(e.total_cost ?? e.daily_rate * e.days_worked)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEntry({ id: e.id, projectId })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showForm && (
            <p className="text-sm text-muted-foreground/50 text-center py-3 italic">No labor entries yet</p>
          )}
          {showForm && (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3 mt-2">
              <Input placeholder="Worker name" value={name} onChange={(e) => setName(e.target.value)} className="text-sm h-10" autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Rate $/day" value={rate} onChange={(e) => setRate(e.target.value)} className="text-sm h-10" />
                <Input type="number" placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} className="text-sm h-10"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="h-9 text-sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-9 text-sm" onClick={handleAdd} disabled={isAdding || !name.trim() || !rate}>
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Entry'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
