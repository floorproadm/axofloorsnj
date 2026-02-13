import React from 'react';
import { AlertTriangle, Clock, Camera, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { normalizeStatus, STAGE_LABELS } from '@/hooks/useLeadPipeline';

interface Lead {
  id: string;
  name: string;
  status: string;
  follow_up_actions?: { date: string; action: string }[];
  next_action_date?: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  customer_name: string;
  project_status: string;
}

interface JobProof {
  project_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
}

interface ActionableAlertsSectionProps {
  leads: Lead[];
  projects: Project[];
  jobProofs?: JobProof[];
}

export function ActionableAlertsSection({ leads, projects, jobProofs = [] }: ActionableAlertsSectionProps) {
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 1. Projects blocked by JobProof (in_progress projects without complete job proof)
  const projectsNeedingJobProof = projects.filter(p => {
    if (p.project_status !== 'in_progress') return false;
    const proof = jobProofs.find(jp => jp.project_id === p.id);
    return !proof || !proof.before_image_url || !proof.after_image_url;
  });

  // 2. Proposals sent without follow-up (leads in 'proposal' or 'quoted' status without follow-up actions)
  const proposalWithoutFollowUp = leads.filter(l => {
    const normalized = normalizeStatus(l.status);
    if (normalized !== 'proposal_sent') return false;
    const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
    return actions.length === 0;
  });

  // 3. Leads stalled > 48h (active leads not updated in 48h)
  const stalledLeads = leads.filter(l => {
    const normalized = normalizeStatus(l.status);
    // Exclude terminal states
    if (normalized === 'completed' || normalized === 'lost') return false;
    const lastUpdate = new Date(l.updated_at);
    return lastUpdate < fortyEightHoursAgo;
  });

  const hasAlerts = projectsNeedingJobProof.length > 0 || proposalWithoutFollowUp.length > 0 || stalledLeads.length > 0;

  return (
    <div className="mb-6 space-y-3">
      <h2 className="text-lg font-bold text-navy flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-[hsl(var(--state-blocked))]" />
        Ações Obrigatórias
      </h2>

      {!hasAlerts ? (
        <div className="p-4 rounded-lg bg-[hsl(var(--state-success-bg))] border-2 border-[hsl(var(--state-success))] flex items-center gap-3">
          <div className="p-2 rounded-full bg-[hsl(var(--state-success))]">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <p className="text-[hsl(var(--state-success))] font-semibold">
            ✓ Nenhuma ação crítica agora — Tudo em dia!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Projects blocked by JobProof */}
          {projectsNeedingJobProof.length > 0 && (
            <Alert className="border-2 border-[hsl(var(--state-blocked))] bg-[hsl(var(--state-blocked-bg))]">
              <Camera className="h-4 w-4 text-[hsl(var(--state-blocked))]" />
              <AlertTitle className="text-[hsl(var(--state-blocked))] font-bold flex items-center gap-2">
                🛑 Jobs Travados — Faltam Fotos
                <Badge className="ml-2 bg-[hsl(var(--state-blocked))] text-white">
                  {projectsNeedingJobProof.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-red-700 mb-2">
                  Estes jobs não podem ser fechados sem fotos before/after:
                </p>
                <ul className="space-y-1">
                  {projectsNeedingJobProof.slice(0, 5).map(p => (
                    <li key={p.id} className="text-sm font-medium text-[hsl(var(--state-blocked))] flex items-center gap-2">
                      <Camera className="w-3 h-3" />
                      {p.customer_name}
                    </li>
                  ))}
                  {projectsNeedingJobProof.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      ... e mais {projectsNeedingJobProof.length - 5}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Proposals without follow-up */}
          {proposalWithoutFollowUp.length > 0 && (
            <Alert className="border-2 border-[hsl(var(--state-risk))] bg-[hsl(var(--state-risk-bg))]">
              <Phone className="h-4 w-4 text-[hsl(var(--state-risk))]" />
              <AlertTitle className="text-amber-700 font-bold flex items-center gap-2">
                ⚠️ Follow-up Obrigatório
                <Badge className="ml-2 bg-[hsl(var(--state-risk))] text-white">
                  {proposalWithoutFollowUp.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-amber-700 mb-2">
                  Orçamentos enviados aguardando primeiro contato:
                </p>
                <ul className="space-y-1">
                  {proposalWithoutFollowUp.slice(0, 5).map(l => (
                    <li key={l.id} className="text-sm font-medium text-amber-700 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {l.name}
                    </li>
                  ))}
                  {proposalWithoutFollowUp.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      ... e mais {proposalWithoutFollowUp.length - 5}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Stalled leads */}
          {stalledLeads.length > 0 && (
            <Alert className="border-2 border-orange-400 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-700 font-bold flex items-center gap-2">
                ⏰ Leads Parados +48h
                <Badge className="ml-2 bg-orange-500 text-white">
                  {stalledLeads.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-orange-700 mb-2">
                  Leads sem atualização há mais de 48 horas — Ligar agora:
                </p>
                <ul className="space-y-1">
                  {stalledLeads.slice(0, 5).map(l => (
                    <li key={l.id} className="text-sm font-medium text-orange-700 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {l.name} <span className="text-xs text-orange-500">({STAGE_LABELS[normalizeStatus(l.status)]})</span>
                    </li>
                  ))}
                  {stalledLeads.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      ... e mais {stalledLeads.length - 5}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
