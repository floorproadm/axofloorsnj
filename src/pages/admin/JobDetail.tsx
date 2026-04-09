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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { JobCostEditor } from '@/components/admin/JobCostEditor';
import { ProposalGenerator } from '@/components/admin/ProposalGenerator';
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { ProjectDocumentsManager } from '@/components/admin/ProjectDocumentsManager';
import { JobChecklist } from '@/components/admin/JobChecklist';
import { useJobCost, useMarginValidation } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin, Ruler, Calendar,
  CheckCircle, AlertTriangle, Clock, Hammer, DollarSign, Calculator,
  Camera, FolderOpen, Pencil, Check, X, Navigation, Send, Users,
  Trash2, ImagePlus, MessageSquare, StickyNote
} from 'lucide-react';
import { AXO_ORG_ID } from '@/lib/constants';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'in_production', label: 'Active', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', label: 'Done', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

// Inline editable field component
function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  icon,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  type?: 'text' | 'textarea' | 'date' | 'number';
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("space-y-1", className)}>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-1.5">
          {type === 'textarea' ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="text-sm min-h-[80px]" autoFocus />
          ) : (
            <Input
              type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="text-sm h-9"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            />
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
    <div
      className={cn("group cursor-pointer rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors -mx-3", className)}
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 mt-0.5">
        {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
        <span className={cn("text-sm font-medium", !value && "text-muted-foreground italic")}>
          {value || placeholder || 'Click to edit'}
        </span>
        <Pencil className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 ml-auto flex-shrink-0 transition-colors" />
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: jobCost, refetch: refetchCost } = useJobCost(jobId || '');
  const { marginMinPercent } = useCompanySettings();

  const updateField = async (field: string, value: any) => {
    if (!jobId) return;
    const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', jobId);
    if (error) throw error;
    toast.success('Updated');
    refetch();
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateField('project_status', status);
    } catch (err: any) {
      toast.error(err?.message || 'Error updating status');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Job Detail" breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
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
  const hasBefore = project.job_proof.some((p: any) => p.before_image_url);
  const hasAfter = project.job_proof.some((p: any) => p.after_image_url);
  const proofComplete = hasBefore && hasAfter;
  const hasMeasurements = (project.square_footage ?? 0) > 0;
  const hasTeam = !!project.team_lead;

  const checklistItems = [
    { label: 'Measurements', ok: hasMeasurements },
    { label: 'Costs', ok: hasCosts },
    { label: 'Margin', ok: marginOk },
    { label: 'Team', ok: hasTeam },
    { label: 'Photos', ok: proofComplete },
  ];
  const progressPercent = Math.round((checklistItems.filter(i => i.ok).length / checklistItems.length) * 100);

  const addressFull = [project.address, project.city, project.zip_code].filter(Boolean).join(', ');
  const mapsUrl = addressFull ? `https://maps.google.com/?q=${encodeURIComponent(addressFull)}` : null;

  return (
    <AdminLayout
      title={project.address || project.customer_name}
      breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }, { label: project.address || project.customer_name }]}
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header: Back + Status + Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/admin/jobs')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {project.address || project.customer_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{project.project_type}</p>
            </div>
          </div>
          <Select value={project.project_status} onValueChange={handleStatusChange}>
            <SelectTrigger className={cn("h-9 w-auto min-w-[130px] text-xs font-semibold border rounded-full", currentStatus.color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
              <span className="text-sm font-bold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 mb-3" />
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {checklistItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  {item.ok ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                  <span className={cn("text-xs font-medium", item.ok ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TABS */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Client Info */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Client Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <EditableField
                    label="Customer Name"
                    value={project.customer_name}
                    onSave={(v) => updateField('customer_name', v)}
                    icon={<User className="w-4 h-4" />}
                    placeholder="Customer name"
                  />
                  <EditableField
                    label="Phone"
                    value={project.customer_phone}
                    onSave={(v) => updateField('customer_phone', v)}
                    icon={<Phone className="w-4 h-4" />}
                    placeholder="Phone number"
                  />
                  <EditableField
                    label="Email"
                    value={project.customer_email || ''}
                    onSave={(v) => updateField('customer_email', v)}
                    icon={<Mail className="w-4 h-4" />}
                    placeholder="Email address"
                  />
                  <EditableField
                    label="Address"
                    value={project.address || ''}
                    onSave={(v) => updateField('address', v)}
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="Street address"
                  />
                  <EditableField
                    label="City"
                    value={project.city || ''}
                    onSave={(v) => updateField('city', v)}
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="City"
                  />
                  <EditableField
                    label="Zip Code"
                    value={project.zip_code || ''}
                    onSave={(v) => updateField('zip_code', v)}
                    placeholder="ZIP"
                  />
                </div>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary font-medium hover:underline">
                    <Navigation className="w-3.5 h-3.5" /> Open in Google Maps
                  </a>
                )}
                {/* Quick contact actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-dashed">
                  <a href={`tel:${project.customer_phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a href={`sms:${project.customer_phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <MessageSquare className="w-3 h-3" /> SMS
                  </a>
                  {project.customer_email && (
                    <a href={`mailto:${project.customer_email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5" /> Project Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <EditableField
                    label="Service Type"
                    value={project.project_type}
                    onSave={(v) => updateField('project_type', v)}
                    icon={<Hammer className="w-4 h-4" />}
                    placeholder="e.g. Sand & Refinish"
                  />
                  <EditableField
                    label="Square Footage"
                    value={project.square_footage?.toString() || ''}
                    onSave={(v) => updateField('square_footage', v ? parseFloat(v) : null)}
                    type="number"
                    icon={<Ruler className="w-4 h-4" />}
                    placeholder="sqft"
                  />
                  <EditableField
                    label="Start Date"
                    value={project.start_date || ''}
                    onSave={(v) => updateField('start_date', v || null)}
                    type="date"
                    icon={<Calendar className="w-4 h-4" />}
                    placeholder="Select start date"
                  />
                  <EditableField
                    label="Completion Date"
                    value={project.completion_date || ''}
                    onSave={(v) => updateField('completion_date', v || null)}
                    type="date"
                    icon={<Calendar className="w-4 h-4" />}
                    placeholder="Select completion date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Team
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <EditableField
                    label="Team Lead"
                    value={project.team_lead || ''}
                    onSave={(v) => updateField('team_lead', v || null)}
                    icon={<User className="w-4 h-4" />}
                    placeholder="Assign team lead"
                  />
                  <EditableField
                    label="Work Schedule"
                    value={project.work_schedule || ''}
                    onSave={(v) => updateField('work_schedule', v)}
                    icon={<Clock className="w-4 h-4" />}
                    placeholder="8:00 AM - 5:00 PM"
                  />
                </div>
                {project.team_members && project.team_members.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Members</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {project.team_members.map((m: string) => (
                        <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {project.partner_name && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Partner</label>
                    <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" /> {project.partner_name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            {hasCosts && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Financial Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase">Revenue</p>
                      <p className="text-lg font-bold">{formatCurrency(jobCost?.estimated_revenue ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase">Total Cost</p>
                      <p className="text-lg font-bold">{formatCurrency(jobCost?.total_cost ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase">Profit</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(jobCost?.profit_amount ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase">Margin</p>
                      <p className={cn("text-lg font-bold", marginOk ? "text-emerald-600" : "text-destructive")}>
                        {currentMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── COSTS TAB ── */}
          <TabsContent value="costs" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <JobCostEditor projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PROPOSAL TAB ── */}
          <TabsContent value="proposal" className="mt-4">
            <ProposalGenerator projectId={project.id} />
          </TabsContent>

          {/* ── PHOTOS TAB ── */}
          <TabsContent value="photos" className="mt-4">
            <JobProofUploader projectId={project.id} />
          </TabsContent>

          {/* ── DOCUMENTS TAB ── */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <ProjectDocumentsManager projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── NOTES TAB ── */}
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <EditableField
                  label="Project Notes"
                  value={project.notes || ''}
                  onSave={(v) => updateField('notes', v)}
                  type="textarea"
                  icon={<StickyNote className="w-4 h-4" />}
                  placeholder="Garage Code, access info, special instructions..."
                />
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardContent className="p-5">
                <CommentsSection projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CHECKLIST TAB ── */}
          <TabsContent value="checklist" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <JobChecklist projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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

  const clearImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        project_id: projectId,
        content: commentText.trim() || '📷 Photo added',
        image_url: imageUrl,
        author_name: 'Admin',
        organization_id: AXO_ORG_ID,
      });
      if (error) throw error;
      setCommentText('');
      clearImage();
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Comment added');
    } catch {
      toast.error('Error posting comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('project_comments').delete().eq('id', id);
    if (error) toast.error('Error');
    else queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
  };

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <MessageSquare className="w-3.5 h-3.5" /> Comments
        {comments.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 h-4">{comments.length}</Badge>}
      </h3>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
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
              <Button variant="destructive" size="icon" className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full" onClick={clearImage}>
                <X className="w-3 h-3" />
              </Button>
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
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
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
