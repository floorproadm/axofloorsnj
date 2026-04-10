import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { JobCostEditor } from '@/components/admin/JobCostEditor';
import { ProposalGenerator } from '@/components/admin/ProposalGenerator';
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { ProjectDocumentsManager } from '@/components/admin/ProjectDocumentsManager';
import { useJobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useMaterialCosts, useAddMaterialCost, useDeleteMaterialCost } from '@/hooks/useMaterialCosts';
import { useLaborEntries, useAddLaborEntry, useDeleteLaborEntry } from '@/hooks/useLaborEntries';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin, Ruler, Calendar,
  Clock, Hammer, DollarSign, ChevronDown,
  Camera, Pencil, Check, X, Navigation, Send, Users,
  Trash2, ImagePlus, MessageSquare, StickyNote, FileText, FolderOpen,
  Package, HardHat, Plus, Lightbulb
} from 'lucide-react';
import { AXO_ORG_ID } from '@/lib/constants';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'in_production', label: 'Active', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', label: 'Done', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

// ─── Inline editable field ───
function EditableField({
  label, value, onSave, type = 'text', icon, placeholder, className,
}: {
  label: string; value: string; onSave: (val: string) => Promise<void>;
  type?: 'text' | 'textarea' | 'date' | 'number'; icon?: React.ReactNode;
  placeholder?: string; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };
  const handleCancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <div className={cn("space-y-1", className)}>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-1.5">
          {type === 'textarea' ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="text-sm min-h-[80px]" autoFocus />
          ) : (
            <Input type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="text-sm h-9" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }} />
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex-shrink-0" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={handleCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group cursor-pointer rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors -mx-3", className)} onClick={() => { setDraft(value); setEditing(true); }}>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 mt-0.5">
        {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
        <span className={cn("text-sm font-medium", !value && "text-muted-foreground italic")}>{value || placeholder || 'Click to edit'}</span>
        <Pencil className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 ml-auto flex-shrink-0 transition-colors" />
      </div>
    </div>
  );
}

// ─── Collapsible section wrapper ───
function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              {icon} {title}
            </h3>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-5 pb-5 pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
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
      const [costsRes, proofRes, partnerRes] = await Promise.all([
        supabase.from('job_costs').select('*').eq('project_id', jobId).maybeSingle(),
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
        job_costs: costsRes.data || null,
        job_proof: proofRes.data || [],
        partner_name: partnerRes.data ? ((partnerRes.data as any).contact_name || (partnerRes.data as any).company_name) : null,
      };
    },
    enabled: !!jobId,
  });

  const { data: jobCost } = useJobCost(jobId || '');
  const { marginMinPercent } = useCompanySettings();

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
      <AdminLayout title="Job Detail" breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout title="Job Detail" breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}>
        <div className="text-center py-20 text-muted-foreground">Job not found</div>
      </AdminLayout>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === project.project_status) || STATUS_OPTIONS[0];
  const currentMargin = jobCost?.margin_percent ?? 0;
  const marginOk = !!(jobCost && currentMargin >= marginMinPercent && (jobCost.estimated_revenue ?? 0) > 0);
  const hasCosts = !!(jobCost && (jobCost.labor_cost > 0 || jobCost.material_cost > 0));
  const addressFull = [project.address, project.city, project.zip_code].filter(Boolean).join(', ');
  const mapsUrl = addressFull ? `https://maps.google.com/?q=${encodeURIComponent(addressFull)}` : null;

  return (
    <AdminLayout
      title={project.address || project.customer_name}
      breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }, { label: project.address || project.customer_name }]}
    >
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* ─── Header: Back + Status + Actions ─── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => navigate('/admin/jobs')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight truncate">
                {project.address || project.customer_name || 'New Job'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{project.project_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setProposalOpen(true)}>
              <FileText className="w-3.5 h-3.5" /> Proposal
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setDocsOpen(true)}>
              <FolderOpen className="w-3.5 h-3.5" /> Docs
            </Button>
            <Select value={project.project_status} onValueChange={handleStatusChange}>
              <SelectTrigger className={cn("h-8 w-auto min-w-[110px] text-xs font-semibold border rounded-full", currentStatus.color)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── NEXT ACTION BANNER ─── */}
        {project.next_action && (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Next Action</p>
                <p className="text-sm font-medium text-foreground">{project.next_action}</p>
              </div>
            </CardContent>
          </Card>
        )}


        <Section title="Client" icon={<User className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <EditableField label="Name" value={project.customer_name} onSave={(v) => updateField('customer_name', v)} icon={<User className="w-4 h-4" />} placeholder="Customer name" />
            <EditableField label="Phone" value={project.customer_phone} onSave={(v) => updateField('customer_phone', v)} icon={<Phone className="w-4 h-4" />} placeholder="Phone" />
            <EditableField label="Email" value={project.customer_email || ''} onSave={(v) => updateField('customer_email', v)} icon={<Mail className="w-4 h-4" />} placeholder="Email" />
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Address</label>
              <AddressAutocomplete
                value={project.address || ''}
                onChange={(v) => updateField('address', v)}
                onSelect={async (result) => {
                  try {
                    await supabase.from('projects').update({ address: result.full, city: result.city, zip_code: result.zip }).eq('id', project.id);
                    refetch();
                    toast.success('Address updated');
                  } catch { toast.error('Failed to save address'); }
                }}
                placeholder="Start typing an address…"
              />
            </div>
          </div>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary font-medium hover:underline">
              <Navigation className="w-3.5 h-3.5" /> Open in Google Maps
            </a>
          )}
          <div className="flex gap-2 mt-3 pt-3 border-t border-dashed">
            {project.customer_phone && (
              <>
                <a href={`tel:${project.customer_phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
                  <Phone className="w-3 h-3" /> Call
                </a>
                <a href={`sms:${project.customer_phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <MessageSquare className="w-3 h-3" /> SMS
                </a>
              </>
            )}
            {project.customer_email && (
              <a href={`mailto:${project.customer_email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                <Mail className="w-3 h-3" /> Email
              </a>
            )}
          </div>
        </Section>

        {/* ─── JOB INFO ─── */}
        <Section title="Job Info" icon={<Hammer className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <EditableField label="Service" value={project.project_type} onSave={(v) => updateField('project_type', v)} icon={<Hammer className="w-4 h-4" />} placeholder="e.g. Sand & Refinish" />
            <EditableField label="Sqft" value={project.square_footage?.toString() || ''} onSave={(v) => updateField('square_footage', v ? parseFloat(v) : null)} type="number" icon={<Ruler className="w-4 h-4" />} placeholder="sqft" />
            <EditableField label="Start" value={project.start_date || ''} onSave={(v) => updateField('start_date', v || null)} type="date" icon={<Calendar className="w-4 h-4" />} placeholder="Start date" />
            <EditableField label="End" value={project.completion_date || ''} onSave={(v) => updateField('completion_date', v || null)} type="date" icon={<Calendar className="w-4 h-4" />} placeholder="End date" />
            <EditableField label="Team Lead" value={project.team_lead || ''} onSave={(v) => updateField('team_lead', v || null)} icon={<User className="w-4 h-4" />} placeholder="Assign team lead" />
            <EditableField label="Schedule" value={project.work_schedule || ''} onSave={(v) => updateField('work_schedule', v)} icon={<Clock className="w-4 h-4" />} placeholder="8:00 AM - 5:00 PM" />
          </div>
          {project.team_members && project.team_members.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Members</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">{project.team_members.map((m: string) => <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>)}</div>
            </div>
          )}
          {project.partner_name && (
            <div className="mt-3 pt-3 border-t border-dashed">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Partner</label>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> {project.partner_name}</p>
            </div>
          )}
        </Section>

        {/* ─── COSTS ─── */}
        <Section title="Costs" icon={<DollarSign className="w-3.5 h-3.5" />} defaultOpen={hasCosts}>
          {hasCosts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Revenue</p>
                <p className="text-base font-bold">{formatCurrency(jobCost?.estimated_revenue ?? 0)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Cost</p>
                <p className="text-base font-bold">{formatCurrency(jobCost?.total_cost ?? 0)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Profit</p>
                <p className="text-base font-bold text-emerald-600">{formatCurrency(jobCost?.profit_amount ?? 0)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Margin</p>
                <p className={cn("text-base font-bold", marginOk ? "text-emerald-600" : currentMargin > 0 ? "text-amber-500" : "text-destructive")}>
                  {currentMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          <JobCostEditor projectId={project.id} />
        </Section>

        {/* ─── MATERIALS ─── */}
        <MaterialsSection projectId={project.id} />

        {/* ─── LABOR ─── */}
        <LaborSection projectId={project.id} />


        <Section title="Notes" icon={<StickyNote className="w-3.5 h-3.5" />}>
          <EditableField label="Project Notes" value={project.notes || ''} onSave={(v) => updateField('notes', v)} type="textarea" placeholder="Garage code, access info, special instructions..." />
        </Section>

        {/* ─── PHOTOS ─── */}
        <Section title="Photos" icon={<Camera className="w-3.5 h-3.5" />}>
          <JobProofUploader projectId={project.id} />
        </Section>

        {/* ─── COMMENTS ─── */}
        <Section title="Comments" icon={<MessageSquare className="w-3.5 h-3.5" />}>
          <CommentsSection projectId={project.id} />
        </Section>
      </div>

      {/* ─── Proposal Sheet ─── */}
      <Sheet open={proposalOpen} onOpenChange={setProposalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Proposal</SheetTitle></SheetHeader>
          <div className="mt-4"><ProposalGenerator projectId={project.id} /></div>
        </SheetContent>
      </Sheet>

      {/* ─── Documents Sheet ─── */}
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
      toast.success('Comment added');
    } catch { toast.error('Error posting comment'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('project_comments').delete().eq('id', id);
    if (error) toast.error('Error');
    else queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
            <Button variant="outline" size="icon" className="flex-shrink-0 h-9 w-9" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button size="icon" className="flex-shrink-0 h-9 w-9" disabled={isSubmitting || (!commentText.trim() && !commentImage)} onClick={handleSubmit}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {commentImagePreview && (
            <div className="relative inline-block">
              <img src={commentImagePreview} alt="Preview" className="h-20 rounded-lg border object-cover" />
              <Button variant="destructive" size="icon" className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full" onClick={clearImage}><X className="w-3 h-3" /></Button>
            </div>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 italic">No comments yet.</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="group flex gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold">{c.author_name}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
                <p className="text-sm leading-relaxed">{c.content}</p>
                {c.image_url && (
                  <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <img src={c.image_url} alt="Attachment" className="max-h-40 rounded-lg border object-cover hover:opacity-90" />
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
// MATERIALS SECTION
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
      toast.success('Material added');
    } catch { toast.error('Error adding material'); }
  };

  return (
    <Section title={`Materials${total > 0 ? ` · ${formatCurrency(total)}` : ''}`} icon={<Package className="w-3.5 h-3.5" />} defaultOpen={materials.length > 0}>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {materials.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {materials.map((m) => (
                <div key={m.id} className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.description}</p>
                    <p className="text-xs text-muted-foreground">{m.supplier || 'No supplier'} · {m.purchase_date}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold">{formatCurrency(m.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMaterial({ id: m.id, projectId })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showForm ? (
            <div className="space-y-2 p-3 rounded-lg border border-dashed">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm h-8" />
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="text-sm h-8" />
              </div>
              <div className="flex gap-2">
                <Input type="number" placeholder="Amount $" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-sm h-8"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
                <Button size="sm" className="h-8" onClick={handleAdd} disabled={isAdding || !desc.trim() || !amount}>
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowForm(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => setShowForm(true)}>
              <Plus className="w-3 h-3" /> Add Material
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

// ═══════════════════════════════════════
// LABOR SECTION
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
      toast.success('Labor entry added');
    } catch { toast.error('Error adding entry'); }
  };

  return (
    <Section title={`Labor${total > 0 ? ` · ${formatCurrency(total)}` : ''}`} icon={<HardHat className="w-3.5 h-3.5" />} defaultOpen={entries.length > 0}>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {entries.map((e) => (
                <div key={e.id} className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.worker_name}</p>
                    <p className="text-xs text-muted-foreground">{e.role} · {formatCurrency(e.daily_rate)}/day × {e.days_worked}d · {e.work_date}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold">{formatCurrency(e.total_cost ?? e.daily_rate * e.days_worked)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteEntry({ id: e.id, projectId })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showForm ? (
            <div className="space-y-2 p-3 rounded-lg border border-dashed">
              <Input placeholder="Worker name" value={name} onChange={(e) => setName(e.target.value)} className="text-sm h-8" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Daily rate $" value={rate} onChange={(e) => setRate(e.target.value)} className="text-sm h-8" />
                <Input type="number" placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} className="text-sm h-8"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 flex-1" onClick={handleAdd} disabled={isAdding || !name.trim() || !rate}>
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowForm(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => setShowForm(true)}>
              <Plus className="w-3 h-3" /> Add Labor Entry
            </Button>
          )}
        </>
      )}
    </Section>
  );
}
