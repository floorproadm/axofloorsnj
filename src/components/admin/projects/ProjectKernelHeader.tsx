import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MapPin, MoreVertical, Trash2, ArrowRight, CheckCircle2, ExternalLink, Link2 } from 'lucide-react';
import { ProjectKPIBar } from './ProjectKPIBar';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useJobCost } from '@/hooks/useJobCosts';
import { useMaterialCosts } from '@/hooks/useMaterialCosts';
import { useLaborEntries } from '@/hooks/useLaborEntries';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'in_production', label: 'Active', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'paid', label: 'Paid', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
];

const DESTRUCTIVE = new Set(['cancelled', 'paid']);

interface Props {
  project: any;
  onPortalClick?: () => void;
}

export function ProjectKernelHeader({ project, onPortalClick }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: jobCost } = useJobCost(project.id);
  const { data: materials } = useMaterialCosts(project.id);
  const { data: labor } = useLaborEntries(project.id);

  const totalCosts =
    (materials ?? []).reduce((s, m) => s + Number(m.amount || 0), 0) +
    (labor ?? []).reduce((s, l) => s + Number(l.total_cost || 0), 0);
  const revenue = Number(jobCost?.estimated_revenue ?? 0);

  async function applyStatus(status: string) {
    const { error } = await supabase.from('projects').update({ project_status: status }).eq('id', project.id);
    if (error) {
      toast.error('Could not update status', { description: error.message });
      return;
    }
    toast.success(`Status → ${status}`);
    qc.invalidateQueries({ queryKey: ['project-detail', project.id] });
    qc.invalidateQueries({ queryKey: ['hub-projects'] });
  }

  function onStatusChange(s: string) {
    if (DESTRUCTIVE.has(s)) setPendingStatus(s);
    else applyStatus(s);
  }

  async function handleClearNextAction() {
    const { error } = await supabase
      .from('projects')
      .update({ next_action: null, next_action_date: null })
      .eq('id', project.id);
    if (error) return toast.error('Could not clear');
    toast.success('Action cleared');
    qc.invalidateQueries({ queryKey: ['project-detail', project.id] });
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from('projects').delete().eq('id', project.id);
    setDeleting(false);
    if (error) return toast.error('Could not delete', { description: error.message });
    toast.success('Project deleted');
    navigate('/admin/projects');
  }

  const statusCfg = STATUSES.find((s) => s.value === project.project_status);

  return (
    <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2.5 pb-3 sm:py-3 bg-background/95 backdrop-blur border-b border-border space-y-2.5 sm:space-y-3">
      {/* Row 1: Back + Status + Menu (compact top bar on mobile) */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Select value={project.project_status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[96px] px-2 gap-1">
              <SelectValue>
                <Badge variant="outline" className={`${statusCfg?.color || ''} text-[10px] py-0 px-1.5`}>
                  {statusCfg?.label || project.project_status}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/measurements?project=${project.id}`)}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Editor completo de medidas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {onPortalClick && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs px-2"
              onClick={onPortalClick}
              disabled={!project.customer_id}
              title={project.customer_id ? 'Compartilhar Portal do Cliente' : 'Projeto sem cliente vinculado'}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal do Cliente</span>
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Title + Address + Type pill */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate leading-tight">
          {project.customer_name || 'Sem cliente'}
        </h1>
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
            {project.address ? `${project.address}${project.city ? `, ${project.city}` : ''}` : 'Sem endereço'}
          </span>
          {project.project_type && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0 max-w-[140px] truncate">
              {project.project_type}
            </Badge>
          )}
        </div>
      </div>

      {/* Row 3: KPI Bar */}
      <ProjectKPIBar estimatedRevenue={revenue} totalCost={totalCosts} />


      {/* Row 3: Next Action banner */}
      {project.next_action && (
        <div className="rounded-lg border border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/10 px-3 py-2 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-[hsl(var(--gold))] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--gold))]">
              Next Action
            </p>
            <p className="text-sm font-medium text-foreground leading-tight truncate">
              {project.next_action}
              {project.next_action_date && (
                <span className="text-xs text-muted-foreground ml-2 font-normal">
                  · {format(new Date(project.next_action_date), 'MMM d')}
                </span>
              )}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={handleClearNextAction}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
          </Button>
        </div>
      )}

      {/* Confirm destructive status */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === 'paid' ? 'Mark project as Paid?' : 'Cancel this project?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === 'paid'
                ? 'This closes the financial cycle. Make sure all invoices and payments are reconciled.'
                : 'This removes the project from the active pipeline. You can revert by changing the status again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStatus) applyStatus(pendingStatus);
                setPendingStatus(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              Linked costs, measurements, invoices and chat history may also be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
