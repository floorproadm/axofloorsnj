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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProposalGenerator } from '@/components/admin/ProposalGenerator';
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { ProjectDocumentsManager } from '@/components/admin/ProjectDocumentsManager';
import { InvoicesPaymentsSection } from '@/components/admin/job-detail/InvoicesPaymentsSection';
import { useMaterialCosts, useAddMaterialCost, useDeleteMaterialCost } from '@/hooks/useMaterialCosts';
import { useLaborEntries, useAddLaborEntry, useDeleteLaborEntry } from '@/hooks/useLaborEntries';
import { useJobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useProjectSignals, computeRisk } from '@/hooks/useProjectSignals';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, User, Phone, Mail, Ruler, Calendar,
  Clock, Hammer, Camera, Pencil, Check, X, Navigation, Send, Users,
  Trash2, ImagePlus, MessageSquare, StickyNote, FileText, FolderOpen,
  Package, HardHat, Plus, Target, Receipt, MapPin, ExternalLink,
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  MoreVertical, Link2, CalendarPlus
} from 'lucide-react';
import { AXO_ORG_ID } from '@/lib/constants';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400' },
  { value: 'in_production', label: 'Active', color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
  { value: 'completed', label: 'Done', color: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400' },
];

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [proposalOpen, setProposalOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        work_schedule: data.work_schedule || '',
        job_proof: proofRes.data || [],
        partner_name: partnerRes.data ? ((partnerRes.data as any).contact_name || (partnerRes.data as any).company_name) : null,
      };
    },
    enabled: !!jobId,
  });

  // Risk + signals (reuses pipeline engine)
  const { data: signals } = useProjectSignals(jobId ? [jobId] : []);
  const { data: jobCostForRisk } = useJobCost(jobId || '');
  const hasMissingProof = jobId ? signals?.missingProof.has(jobId) ?? false : false;
  const hasOverdueInvoice = jobId ? signals?.overdueInvoice.has(jobId) ?? false : false;
  const risk = computeRisk({
    marginPercent: jobCostForRisk?.margin_percent ?? null,
    hasMissingProof,
    hasOverdueInvoice,
    status: project?.project_status || 'pending',
  });
  const riskColor = risk.level === 'risk' ? 'bg-red-500' : risk.level === 'watch' ? 'bg-amber-500' : 'bg-emerald-500';

  const updateField = async (field: string, value: any) => {
    if (!jobId) return;
    const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', jobId);
    if (error) { toast.error('Failed to save'); throw error; }
    toast.success('Saved');
    refetch();
  };

  const updateMultipleFields = async (fields: Record<string, any>) => {
    if (!jobId) return;
    const { error } = await supabase.from('projects').update(fields).eq('id', jobId);
    if (error) { toast.error('Failed to save'); throw error; }
    toast.success('Saved');
    refetch();
  };

  const handleDelete = async () => {
    if (!jobId) return;
    setDeleting(true);
    const { error } = await supabase.from('projects').delete().eq('id', jobId);
    setDeleting(false);
    setConfirmDelete(false);
    if (error) {
      toast.error('Failed to delete job');
      return;
    }
    toast.success('Job deleted');
    queryClient.invalidateQueries({ queryKey: ['hub-projects'] });
    queryClient.invalidateQueries({ queryKey: ['admin-data'] });
    navigate('/admin/projects');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      title=""
      breadcrumbs={[{ label: 'Jobs', href: '/admin/jobs' }]}
    >
      <div className="max-w-5xl mx-auto pb-16 space-y-6">

        {/* ═══ OPERATIONAL HEADER ═══ */}
        <div className="space-y-4">
          {/* Back + actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2" onClick={() => navigate('/admin/jobs')}>
              <ArrowLeft className="w-4 h-4" /> Jobs
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setProposalOpen(true)}>
                <FileText className="w-4 h-4" /> Proposal
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setDocsOpen(true)}>
                <FolderOpen className="w-4 h-4" /> Docs
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" aria-label="More actions">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {mapsUrl && (
                    <DropdownMenuItem onClick={() => window.open(mapsUrl, '_blank')}>
                      <Navigation className="w-4 h-4 mr-2" /> Open in Maps
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={copyLink}>
                    <Link2 className="w-4 h-4 mr-2" /> Copy link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Identity block */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", riskColor)}
                    title={risk.reasons.length ? risk.reasons.join(' · ') : 'Healthy'}
                  />
                  <h1 className="text-xl font-bold text-foreground leading-tight truncate">
                    {project.address || project.customer_name || 'New Job'}
                  </h1>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  {project.customer_name && (
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {project.customer_name}</span>
                  )}
                  {project.customer_phone && (
                    <a href={`tel:${project.customer_phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {project.customer_phone}
                    </a>
                  )}
                  {project.customer_email && (
                    <a href={`mailto:${project.customer_email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {project.customer_email}
                    </a>
                  )}
                </div>
                {addressFull && mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {addressFull} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Select value={project.project_status} onValueChange={(v) => updateField('project_status', v)}>
                <SelectTrigger className="h-9 w-auto min-w-[120px] text-sm font-semibold gap-2 px-3">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", currentStatus.color)} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2"><span className={cn("w-2 h-2 rounded-full", s.color)} />{s.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Risk / signal badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {project.partner_name && (
                <Badge variant="outline" className="text-xs gap-1.5 font-normal">
                  <Users className="w-3 h-3 text-primary" /> Partner: {project.partner_name}
                </Badge>
              )}
              {hasOverdueInvoice && (
                <Badge variant="outline" className="text-xs gap-1.5 font-normal border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" /> Overdue invoice
                </Badge>
              )}
              {hasMissingProof && (project.project_status === 'completed' || project.project_status === 'in_production') && (
                <Badge variant="outline" className="text-xs gap-1.5 font-normal border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  <Camera className="w-3 h-3" /> Need photos
                </Badge>
              )}
            </div>
          </div>

          {/* Next Action */}
          {project.next_action && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-sm">
              <Target className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">{project.next_action}</span>
            </div>
          )}

          {/* Quick Action Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
            <QuickAction icon={<CalendarPlus className="w-3.5 h-3.5" />} label="Schedule" onClick={() => navigate(`/admin/schedule?project=${project.id}`)} />
            <QuickAction icon={<Package className="w-3.5 h-3.5" />} label="Add Cost" onClick={() => scrollToId('section-materials')} />
            <QuickAction icon={<Receipt className="w-3.5 h-3.5" />} label="New Invoice" onClick={() => scrollToId('section-invoices')} />
            <QuickAction icon={<Camera className="w-3.5 h-3.5" />} label="Upload Proof" onClick={() => scrollToId('section-photos')} />
            {project.project_status !== 'completed' && (
              <QuickAction
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                label="Mark Complete"
                onClick={() => updateField('project_status', 'completed')}
                accent
              />
            )}
          </div>
        </div>

        {/* ═══ FINANCIAL SNAPSHOT ═══ */}
        <FinancialSnapshot
          projectId={project.id}
          onSetRevenue={() => scrollToId('section-materials')}
          onAddCost={() => scrollToId('section-materials')}
          onCreateInvoice={() => scrollToId('section-invoices')}
        />

        {/* ═══ PHOTOS — operational priority (blocks completion) ═══ */}
        <div id="section-photos">
          <Section title="Photos & Proof" icon={<Camera className="w-4 h-4" />}>
            <JobProofUploader projectId={project.id} />
          </Section>
        </div>

        {/* ═══ MATERIALS ═══ */}
        <div id="section-materials"><MaterialsBlock projectId={project.id} /></div>

        {/* ═══ LABOR ═══ */}
        <LaborBlock projectId={project.id} />

        {/* ═══ INVOICES & PAYMENTS ═══ */}
        <div id="section-invoices">
          <Section title="Invoices & Payments" icon={<Receipt className="w-4 h-4" />}>
            <InvoicesPaymentsSection projectId={project.id} />
          </Section>
        </div>

        {/* ═══ JOB INFO (compact, empty fields collapsed) ═══ */}
        <Section
          title="Job Details"
          icon={<Hammer className="w-4 h-4" />}
          action={
            editingSection !== 'job' && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditingSection('job')}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )
          }
        >
          {editingSection === 'job' ? (
            <JobDetailsEditForm
              project={project}
              onSave={async (fields) => { await updateMultipleFields(fields); setEditingSection(null); }}
              onCancel={() => setEditingSection(null)}
            />
          ) : (
            <CompactJobDetails project={project} onEditEmpty={() => setEditingSection('job')} />
          )}
        </Section>

        {/* ═══ NOTES ═══ */}
        <Section title="Notes" icon={<StickyNote className="w-4 h-4" />}>
          <NotesBlock value={project.notes || ''} onSave={(v) => updateField('notes', v)} />
        </Section>

        {/* ═══ COMMENTS ═══ */}
        <Section title="Comments" icon={<MessageSquare className="w-4 h-4" />}>
          <CommentsBlock projectId={project.id} />
        </Section>

        {/* ═══ CLIENT ═══ */}
        <Section
          title="Client"
          icon={<User className="w-4 h-4" />}
          action={
            editingSection !== 'client' && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditingSection('client')}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )
          }
        >
          {editingSection === 'client' ? (
            <ClientEditForm
              project={project}
              onSave={async (fields) => { await updateMultipleFields(fields); setEditingSection(null); }}
              onCancel={() => setEditingSection(null)}
              onAddressSelect={async (result: any) => {
                await supabase.from('projects').update({ address: result.full, city: result.city, zip_code: result.zip }).eq('id', project.id);
                refetch();
                toast.success('Address updated');
                setEditingSection(null);
              }}
            />
          ) : (
            <div className="space-y-0">
              <PropRow label="Name" value={project.customer_name} />
              <PropRow label="Phone" value={project.customer_phone} action={
                project.customer_phone ? (
                  <div className="flex gap-1">
                    <a href={`tel:${project.customer_phone}`} className="text-xs text-primary hover:underline">Call</a>
                    <span className="text-muted-foreground">·</span>
                    <a href={`sms:${project.customer_phone}`} className="text-xs text-primary hover:underline">SMS</a>
                  </div>
                ) : null
              } />
              <PropRow label="Email" value={project.customer_email} action={
                project.customer_email ? <a href={`mailto:${project.customer_email}`} className="text-xs text-primary hover:underline">Email</a> : null
              } />
              <PropRow label="Address" value={addressFull || null} action={
                mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5"><Navigation className="w-3 h-3" /> Maps</a> : null
              } />
            </div>
          )}
        </Section>
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

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-semibold text-foreground">{project.address || project.customer_name || 'the project'}</span> and all related costs, invoices, photos, and chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

/* ═══════════════════════════════════════════════
   QUICK ACTION CHIP
   ═══════════════════════════════════════════════ */
function QuickAction({ icon, label, onClick, accent }: {
  icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
        accent
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
          : "border-border/60 bg-card hover:bg-muted/40 text-foreground"
      )}
    >
      {icon} {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   COMPACT JOB DETAILS — only filled fields + empty footer
   ═══════════════════════════════════════════════ */
function CompactJobDetails({ project, onEditEmpty }: { project: any; onEditEmpty: () => void }) {
  const fields = [
    { key: 'project_type', label: 'Service', value: project.project_type },
    { key: 'square_footage', label: 'Sqft', value: project.square_footage ? `${project.square_footage} sqft` : null },
    { key: 'start_date', label: 'Start', value: project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null },
    { key: 'completion_date', label: 'End', value: project.completion_date ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null },
    { key: 'team_lead', label: 'Team Lead', value: project.team_lead },
    { key: 'work_schedule', label: 'Schedule', value: project.work_schedule },
  ];
  const filled = fields.filter(f => f.value);
  const empty = fields.filter(f => !f.value);

  if (filled.length === 0) {
    return (
      <button
        type="button"
        onClick={onEditEmpty}
        className="w-full text-left text-sm text-muted-foreground/60 italic hover:text-foreground transition-colors py-1"
      >
        No details yet — click to add service, sqft, dates, team lead…
      </button>
    );
  }

  return (
    <div className="space-y-0">
      {filled.map(f => <PropRow key={f.key} label={f.label} value={f.value as string} />)}
      {empty.length > 0 && (
        <button
          type="button"
          onClick={onEditEmpty}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 pt-2 border-t border-border/20 w-full text-left"
        >
          <span className="text-muted-foreground/60">{empty.length} empty</span>
          {' · '}
          <span className="text-primary hover:underline">+ Add {empty.map(e => e.label).join(', ')}</span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REUSABLE LAYOUT PRIMITIVES
   ═══════════════════════════════════════════════ */

function Section({ title, icon, children, action }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="border border-border/50 rounded-xl bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/30 bg-muted/20">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground flex-1">{title}</h2>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function PropRow({ label, value, action }: { label: string; value: string | null | undefined; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
      <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <span className={cn("text-sm flex-1 text-right", value ? "text-foreground font-medium" : "text-muted-foreground/40 italic")}>
        {value || '—'}
      </span>
      {action && <span className="ml-2 flex-shrink-0">{action}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FINANCIAL SNAPSHOT (replaces JobFinancialHeader)
   ═══════════════════════════════════════════════ */

function FinancialSnapshot({ projectId, onSetRevenue, onAddCost, onCreateInvoice }: {
  projectId: string;
  onSetRevenue?: () => void;
  onAddCost?: () => void;
  onCreateInvoice?: () => void;
}) {
  const { data: jobCost } = useJobCost(projectId);
  const { marginMinPercent } = useCompanySettings();

  const { data: paymentInfo } = useQuery({
    queryKey: ['payment-snapshot', projectId],
    queryFn: async () => {
      const [invRes, payRes] = await Promise.all([
        supabase.from('invoices').select('id, status, amount, total_amount, due_date').eq('project_id', projectId),
        supabase.from('payments').select('amount, status').eq('project_id', projectId).eq('category', 'received').eq('status', 'completed'),
      ]);
      const invoices = invRes.data || [];
      const payments = payRes.data || [];
      const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount ?? i.amount ?? 0), 0);
      const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
      const hasOverdue = invoices.some(i => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date());
      const allPaid = invoices.length > 0 && invoices.every(i => i.status === 'paid');
      return { totalInvoiced, totalReceived, balance: totalInvoiced - totalReceived, hasOverdue, allPaid, hasInvoices: invoices.length > 0 };
    },
  });

  const revenue = jobCost?.estimated_revenue ?? 0;
  const totalCost = jobCost?.total_cost ?? 0;
  const margin = jobCost?.margin_percent ?? 0;
  const profit = revenue - totalCost;
  const marginOk = !!(jobCost && margin >= marginMinPercent && revenue > 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetricCard
        label="Revenue"
        value={formatCurrency(revenue)}
        icon={<DollarSign className="w-4 h-4" />}
        emptyCta={revenue === 0 && onSetRevenue ? { label: 'Set revenue', onClick: onSetRevenue } : undefined}
      />
      <MetricCard
        label="Cost"
        value={formatCurrency(totalCost)}
        icon={<Package className="w-4 h-4" />}
        emptyCta={totalCost === 0 && onAddCost ? { label: '+ Add first cost', onClick: onAddCost } : undefined}
      />
      <MetricCard
        label="Margin"
        value={`${margin.toFixed(1)}%`}
        sub={revenue > 0 ? `${formatCurrency(profit)} profit` : undefined}
        icon={marginOk ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        accent={marginOk ? 'emerald' : margin > 0 ? 'amber' : undefined}
      />
      <MetricCard
        label="Payment"
        value={
          paymentInfo?.allPaid ? 'Paid' :
          paymentInfo?.hasOverdue ? 'Overdue' :
          paymentInfo?.hasInvoices ? 'Awaiting' : 'No Invoice'
        }
        sub={paymentInfo && paymentInfo.balance > 0 && !paymentInfo.allPaid ? `${formatCurrency(paymentInfo.balance)} due` : undefined}
        icon={
          paymentInfo?.allPaid ? <CheckCircle2 className="w-4 h-4" /> :
          paymentInfo?.hasOverdue ? <AlertTriangle className="w-4 h-4" /> :
          <DollarSign className="w-4 h-4" />
        }
        accent={paymentInfo?.allPaid ? 'emerald' : paymentInfo?.hasOverdue ? 'red' : undefined}
        emptyCta={!paymentInfo?.hasInvoices && onCreateInvoice ? { label: '+ Create invoice', onClick: onCreateInvoice } : undefined}
      />
    </div>
  );
}
function MetricCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  accent?: 'emerald' | 'amber' | 'red';
  emptyCta?: { label: string; onClick: () => void };
}) {
  const accentColor = accent === 'emerald' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : accent === 'red' ? 'text-red-600' : 'text-foreground';
  return (
    <div className="border border-border/50 rounded-xl bg-card p-3.5 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-lg font-bold tabular-nums", accentColor)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
      {emptyCta && (
        <button
          type="button"
          onClick={emptyCta.onClick}
          className="text-xs text-primary hover:underline font-medium"
        >
          {emptyCta.label}
        </button>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════
   JOB DETAILS EDIT FORM
   ═══════════════════════════════════════════════ */

function JobDetailsEditForm({ project, onSave, onCancel }: {
  project: any; onSave: (fields: Record<string, any>) => Promise<void>; onCancel: () => void;
}) {
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crew-members-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, role').order('full_name');
      if (error) throw error;
      return (data ?? []).filter((p: any) => p.full_name);
    },
  });
  const [fields, setFields] = useState({
    project_type: project.project_type || '',
    square_footage: project.square_footage?.toString() || '',
    start_date: project.start_date || '',
    completion_date: project.completion_date || '',
    team_lead: project.team_lead || '',
    work_schedule: project.work_schedule || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        project_type: fields.project_type,
        square_footage: fields.square_footage ? parseFloat(fields.square_footage) : null,
        start_date: fields.start_date || null,
        completion_date: fields.completion_date || null,
        team_lead: fields.team_lead || null,
        work_schedule: fields.work_schedule || null,
      });
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <FormRow label="Service">
        <Select value={fields.project_type} onValueChange={(v) => setFields(f => ({ ...f, project_type: v }))}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {['Sanding & Finish', 'New Installation', 'Staircase', 'Repair', 'Vinyl Plank', 'Custom'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>
      <FormRow label="Sqft">
        <Input type="number" value={fields.square_footage} onChange={(e) => setFields(f => ({ ...f, square_footage: e.target.value }))} placeholder="—" />
      </FormRow>
      <FormRow label="Start">
        <Input type="date" value={fields.start_date} onChange={(e) => setFields(f => ({ ...f, start_date: e.target.value }))} />
      </FormRow>
      <FormRow label="End">
        <Input type="date" value={fields.completion_date} onChange={(e) => setFields(f => ({ ...f, completion_date: e.target.value }))} />
      </FormRow>
      <FormRow label="Team Lead">
        <Select value={fields.team_lead} onValueChange={(v) => setFields(f => ({ ...f, team_lead: v }))}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select crew member" />
          </SelectTrigger>
          <SelectContent>
            {crewMembers.map((m: any) => (
              <SelectItem key={m.id} value={m.full_name}>{m.full_name}{m.role ? ` · ${m.role}` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>
      <FormRow label="Schedule">
        <Input value={fields.work_schedule} onChange={(e) => setFields(f => ({ ...f, work_schedule: e.target.value }))} placeholder="8:00 AM - 5:00 PM" />
      </FormRow>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save All'}
        </Button>
      </div>
    </div>
  );
}

function ClientEditForm({ project, onSave, onCancel, onAddressSelect }: {
  project: any; onSave: (fields: Record<string, any>) => Promise<void>; onCancel: () => void;
  onAddressSelect: (result: any) => void;
}) {
  const [fields, setFields] = useState({
    customer_name: project.customer_name || '',
    customer_phone: project.customer_phone || '',
    customer_email: project.customer_email || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(fields); } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <FormRow label="Name">
        <Input value={fields.customer_name} onChange={(e) => setFields(f => ({ ...f, customer_name: e.target.value }))} />
      </FormRow>
      <FormRow label="Phone">
        <Input value={fields.customer_phone} onChange={(e) => setFields(f => ({ ...f, customer_phone: e.target.value }))} />
      </FormRow>
      <FormRow label="Email">
        <Input value={fields.customer_email} onChange={(e) => setFields(f => ({ ...f, customer_email: e.target.value }))} />
      </FormRow>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Address</label>
        <AddressAutocomplete
          value={project.address || ''}
          onChange={() => {}}
          onSelect={onAddressSelect}
          placeholder="Start typing address…"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground w-24 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NOTES BLOCK
   ═══════════════════════════════════════════════ */

function NotesBlock({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
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
      <div className="space-y-2">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[100px] text-sm" autoFocus />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded-lg p-2 hover:bg-muted/20 transition-colors -m-2" onClick={() => { setDraft(value); setEditing(true); }}>
      <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", value ? "text-foreground" : "text-muted-foreground/40 italic")}>
        {value || 'Click to add notes…'}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMMENTS BLOCK
   ═══════════════════════════════════════════════ */

function CommentsBlock({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  const clearImage = () => { setImage(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const submit = async () => {
    if (!text.trim() && !image) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (image) {
        const ext = image.name.split('.').pop() || 'jpg';
        const path = `${projectId}/comments/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('project-documents').upload(path, image);
        if (upErr) throw upErr;
        const { data: urlData } = await supabase.storage.from('project-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
        imageUrl = urlData?.signedUrl || null;
      }
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId, content: text.trim() || '📷 Photo', image_url: imageUrl, author_name: 'Admin', organization_id: AXO_ORG_ID,
      });
      if (error) throw error;
      setText(''); clearImage();
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Comment added');
    } catch { toast.error('Error posting comment'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('project_comments').delete().eq('id', id);
    if (error) toast.error('Error');
    else {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Deleted');
    }
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Input placeholder="Write a comment…" value={text} onChange={(e) => setText(e.target.value)} className="text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} />
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="" className="h-14 rounded border border-border/40 object-cover" />
              <Button variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full" onClick={clearImage}><X className="w-3 h-3" /></Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="w-3.5 h-3.5" /> Photo
            </Button>
            <Button size="sm" className="text-xs ml-auto gap-1" disabled={submitting || (!text.trim() && !image)} onClick={submit}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send</>}
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-3 italic">No comments yet</p>
      ) : (
        <div className="space-y-0 max-h-[300px] overflow-y-auto divide-y divide-border/20">
          {comments.map((c: any) => (
            <div key={c.id} className="group flex gap-2.5 py-2.5">
              <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{c.content}</p>
                {c.image_url && (
                  <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                    <img src={c.image_url} alt="" className="max-h-28 rounded border border-border/40 object-cover" />
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

/* ═══════════════════════════════════════════════
   MATERIALS BLOCK
   ═══════════════════════════════════════════════ */

function MaterialsBlock({ projectId }: { projectId: string }) {
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
      setDesc(''); setSupplier(''); setAmount('');
      setShowForm(false);
      toast.success('Material added');
    } catch { toast.error('Error adding material'); }
  };

  return (
    <Section
      title="Materials"
      icon={<Package className="w-4 h-4" />}
      action={
        <div className="flex items-center gap-2">
          {total > 0 && <span className="text-xs font-bold tabular-nums text-muted-foreground">{formatCurrency(total)}</span>}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {materials.length > 0 ? (
            <div className="divide-y divide-border/20">
              {materials.map((m) => (
                <div key={m.id} className="group flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{m.description}</p>
                    {m.supplier && <p className="text-xs text-muted-foreground">{m.supplier}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMaterial({ id: m.id, projectId })}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showForm && (
            <p className="text-xs text-muted-foreground/50 text-center py-2 italic">No materials logged</p>
          )}
          {showForm && (
            <div className="border border-border/50 rounded-lg bg-muted/10 p-3 space-y-2 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm" autoFocus />
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="text-sm" />
                <Input type="number" placeholder="$ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="text-xs" onClick={handleAdd} disabled={isAdding || !desc.trim() || !amount}>
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   LABOR BLOCK
   ═══════════════════════════════════════════════ */

function LaborBlock({ projectId }: { projectId: string }) {
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
      setName(''); setRate(''); setDays('1');
      setShowForm(false);
      toast.success('Labor entry added');
    } catch { toast.error('Error adding entry'); }
  };

  return (
    <Section
      title="Labor"
      icon={<HardHat className="w-4 h-4" />}
      action={
        <div className="flex items-center gap-2">
          {total > 0 && <span className="text-xs font-bold tabular-nums text-muted-foreground">{formatCurrency(total)}</span>}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {entries.length > 0 ? (
            <div className="divide-y divide-border/20">
              {entries.map((e) => (
                <div key={e.id} className="group flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{e.worker_name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(e.daily_rate)}/day × {e.days_worked}d</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(e.total_cost ?? e.daily_rate * e.days_worked)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEntry({ id: e.id, projectId })}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showForm && (
            <p className="text-xs text-muted-foreground/50 text-center py-2 italic">No labor entries</p>
          )}
          {showForm && (
            <div className="border border-border/50 rounded-lg bg-muted/10 p-3 space-y-2 mt-2">
              <Input placeholder="Worker name" value={name} onChange={(e) => setName(e.target.value)} className="text-sm" autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="$/day" value={rate} onChange={(e) => setRate(e.target.value)} className="text-sm" />
                <Input type="number" placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} className="text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="text-xs" onClick={handleAdd} disabled={isAdding || !name.trim() || !rate}>
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
