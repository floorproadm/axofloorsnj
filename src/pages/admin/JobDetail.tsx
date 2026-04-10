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
  ArrowLeft, Loader2, User, Phone, Mail, MapPin, Ruler, Calendar,
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

// ─── Inline editable field (Linear-style) ───
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
      <div className={cn("space-y-1.5", className)}>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-1.5">
          {type === 'textarea' ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="text-sm min-h-[72px] bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40" autoFocus />
          ) : (
            <Input type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="text-sm h-8 bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }} />
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 flex-shrink-0" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0" onClick={handleCancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group cursor-pointer rounded-md px-2.5 py-2 hover:bg-muted/40 transition-colors -mx-2.5", className)} onClick={() => { setDraft(value); setEditing(true); }}>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2 mt-0.5">
        {icon && <span className="text-muted-foreground/60 flex-shrink-0">{icon}</span>}
        <span className={cn("text-sm", value ? "font-medium text-foreground" : "text-muted-foreground/60 italic")}>{value || placeholder || 'Empty'}</span>
        <Pencil className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 ml-auto flex-shrink-0 transition-opacity" />
      </div>
    </div>
  );
}

// ─── Collapsible section (Linear-style) ───
function Section({ title, icon, children, defaultOpen = true, badge }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 py-2.5 px-1 hover:bg-muted/30 transition-colors rounded-md group">
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-90")} />
          <span className="text-muted-foreground/70">{icon}</span>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{title}</span>
          {badge && <span className="text-[10px] font-medium text-muted-foreground ml-1">{badge}</span>}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pb-2">
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

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground leading-tight truncate">
              {project.address || project.customer_name || 'New Job'}
            </h1>
          </div>
          <Select value={project.project_status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs font-semibold border-border/60 rounded-md gap-1.5 bg-card">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", currentStatus.dot)} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-header: type + actions */}
        <div className="flex items-center justify-between ml-11 mb-4">
          <p className="text-sm text-muted-foreground">{project.project_type}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1" onClick={() => setProposalOpen(true)}>
              <FileText className="w-3.5 h-3.5" /> Proposal
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1" onClick={() => setDocsOpen(true)}>
              <FolderOpen className="w-3.5 h-3.5" /> Docs
            </Button>
          </div>
        </div>

        {/* ═══ FINANCIAL METRICS ═══ */}
        <div className="mb-5">
          <JobFinancialHeader projectId={project.id} />
        </div>

        {/* ═══ NEXT ACTION BANNER ═══ */}
        {project.next_action && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 mb-5 rounded-lg border border-primary/20 bg-primary/5">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground">{project.next_action}</span>
            </div>
          </div>
        )}

        {/* ═══ SECTIONS ═══ */}
        <div className="space-y-1 divide-y divide-border/40">
          {/* 1. Job Info */}
          <Section title="Job Info" icon={<Hammer className="w-3.5 h-3.5" />} defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              <EditableField label="Service" value={project.project_type} onSave={(v) => updateField('project_type', v)} icon={<Hammer className="w-3.5 h-3.5" />} placeholder="e.g. Sand & Refinish" />
              <EditableField label="Sqft" value={project.square_footage?.toString() || ''} onSave={(v) => updateField('square_footage', v ? parseFloat(v) : null)} type="number" icon={<Ruler className="w-3.5 h-3.5" />} placeholder="sqft" />
              <EditableField label="Start" value={project.start_date || ''} onSave={(v) => updateField('start_date', v || null)} type="date" icon={<Calendar className="w-3.5 h-3.5" />} placeholder="Start date" />
              <EditableField label="End" value={project.completion_date || ''} onSave={(v) => updateField('completion_date', v || null)} type="date" icon={<Calendar className="w-3.5 h-3.5" />} placeholder="End date" />
              <EditableField label="Team Lead" value={project.team_lead || ''} onSave={(v) => updateField('team_lead', v || null)} icon={<User className="w-3.5 h-3.5" />} placeholder="Assign team lead" />
              <EditableField label="Schedule" value={project.work_schedule || ''} onSave={(v) => updateField('work_schedule', v)} icon={<Clock className="w-3.5 h-3.5" />} placeholder="8:00 AM - 5:00 PM" />
            </div>
            {project.team_members && project.team_members.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border/30">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Members</label>
                <div className="flex flex-wrap gap-1 mt-1">{project.team_members.map((m: string) => <Badge key={m} variant="secondary" className="text-[10px] h-5">{m}</Badge>)}</div>
              </div>
            )}
            {project.partner_name && (
              <div className="mt-3 pt-2 border-t border-border/30">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Partner</label>
                <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> {project.partner_name}</p>
              </div>
            )}
          </Section>

          {/* 2. Comments */}
          <Section title="Comments" icon={<MessageSquare className="w-3.5 h-3.5" />} defaultOpen>
            <CommentsSection projectId={project.id} />
          </Section>

          {/* 3. Client */}
          <Section title="Client" icon={<User className="w-3.5 h-3.5" />} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              <EditableField label="Name" value={project.customer_name} onSave={(v) => updateField('customer_name', v)} icon={<User className="w-3.5 h-3.5" />} placeholder="Customer name" />
              <EditableField label="Phone" value={project.customer_phone} onSave={(v) => updateField('customer_phone', v)} icon={<Phone className="w-3.5 h-3.5" />} placeholder="Phone" />
              <EditableField label="Email" value={project.customer_email || ''} onSave={(v) => updateField('customer_email', v)} icon={<Mail className="w-3.5 h-3.5" />} placeholder="Email" />
              <div className="space-y-1 px-2.5 py-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Address</label>
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
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground text-[11px] font-medium hover:bg-muted hover:text-foreground transition-colors">
                  <Navigation className="w-3 h-3" /> Maps
                </a>
              )}
              {project.customer_phone && (
                <>
                  <a href={`tel:${project.customer_phone}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground text-[11px] font-medium hover:bg-muted hover:text-foreground transition-colors">
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a href={`sms:${project.customer_phone}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground text-[11px] font-medium hover:bg-muted hover:text-foreground transition-colors">
                    <MessageSquare className="w-3 h-3" /> SMS
                  </a>
                </>
              )}
              {project.customer_email && (
                <a href={`mailto:${project.customer_email}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground text-[11px] font-medium hover:bg-muted hover:text-foreground transition-colors">
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}
            </div>
          </Section>

          {/* 4. Notes */}
          <Section title="Notes" icon={<StickyNote className="w-3.5 h-3.5" />}>
            <EditableField label="Project Notes" value={project.notes || ''} onSave={(v) => updateField('notes', v)} type="textarea" placeholder="Garage code, access info, special instructions..." />
          </Section>

          {/* 5. Materials */}
          <MaterialsSection projectId={project.id} />

          {/* 6. Labor */}
          <LaborSection projectId={project.id} />

          {/* 7. Invoices & Payments */}
          <Section title="Invoices & Payments" icon={<Receipt className="w-3.5 h-3.5" />}>
            <InvoicesPaymentsSection projectId={project.id} />
          </Section>

          {/* 8. Photos */}
          <Section title="Photos" icon={<Camera className="w-3.5 h-3.5" />}>
            <JobProofUploader projectId={project.id} />
          </Section>
        </div>
      </div>

      {/* Proposal Sheet */}
      <Sheet open={proposalOpen} onOpenChange={setProposalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Proposal</SheetTitle></SheetHeader>
          <div className="mt-4"><ProposalGenerator projectId={project.id} /></div>
        </SheetContent>
      </Sheet>

      {/* Documents Sheet */}
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
      {/* Input */}
      <div className="flex gap-2 mb-3">
        <Input placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="text-sm h-8 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" className="flex-shrink-0 h-8 w-8" disabled={isSubmitting || (!commentText.trim() && !commentImage)} onClick={handleSubmit}>
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {commentImagePreview && (
        <div className="relative inline-block mb-3">
          <img src={commentImagePreview} alt="Preview" className="h-16 rounded-md border border-border/50 object-cover" />
          <Button variant="destructive" size="icon" className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full" onClick={clearImage}><X className="w-2.5 h-2.5" /></Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-3 italic">No comments yet.</p>
      ) : (
        <div className="space-y-1 max-h-[360px] overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="group flex gap-2.5 p-2 rounded-md hover:bg-muted/30 transition-colors">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-foreground">{c.author_name}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)}><Trash2 className="w-2.5 h-2.5 text-destructive" /></Button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                {c.image_url && (
                  <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                    <img src={c.image_url} alt="Attachment" className="max-h-32 rounded-md border border-border/50 object-cover hover:opacity-90" />
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
    <Section title="Materials" icon={<Package className="w-3.5 h-3.5" />} defaultOpen={materials.length > 0} badge={total > 0 ? formatCurrency(total) : undefined}>
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {materials.length > 0 && (
            <div className="space-y-px mb-2">
              {materials.map((m) => (
                <div key={m.id} className="group flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.description}</p>
                    <p className="text-[11px] text-muted-foreground">{m.supplier || '—'} · {m.purchase_date || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMaterial({ id: m.id, projectId })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="rounded-md border border-border/50 bg-muted/20 p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm h-8 bg-card border-border/50 col-span-1" autoFocus />
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="text-sm h-8 bg-card border-border/50 col-span-1" />
                <Input type="number" placeholder="$ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-sm h-8 bg-card border-border/50 col-span-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={isAdding || !desc.trim() || !amount}>
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              <Plus className="w-3 h-3" /> Add material
            </button>
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
    <Section title="Labor" icon={<HardHat className="w-3.5 h-3.5" />} defaultOpen={entries.length > 0} badge={total > 0 ? formatCurrency(total) : undefined}>
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="space-y-px mb-2">
              {entries.map((e) => (
                <div key={e.id} className="group flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.worker_name}</p>
                    <p className="text-[11px] text-muted-foreground">{e.role || '—'} · {formatCurrency(e.daily_rate)}/d × {e.days_worked}d · {e.work_date || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(e.total_cost ?? e.daily_rate * e.days_worked)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEntry({ id: e.id, projectId })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="rounded-md border border-border/50 bg-muted/20 p-3 space-y-2">
              <Input placeholder="Worker name" value={name} onChange={(e) => setName(e.target.value)} className="text-sm h-8 bg-card border-border/50" autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Daily rate $" value={rate} onChange={(e) => setRate(e.target.value)} className="text-sm h-8 bg-card border-border/50" />
                <Input type="number" placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} className="text-sm h-8 bg-card border-border/50"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={isAdding || !name.trim() || !rate}>
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              <Plus className="w-3 h-3" /> Add labor entry
            </button>
          )}
        </>
      )}
    </Section>
  );
}
