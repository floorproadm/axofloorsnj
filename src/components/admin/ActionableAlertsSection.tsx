import React from 'react';
import { AlertTriangle, Clock, Camera, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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

  // 2. Proposals sent without follow-up (leads in 'quoted' status without follow-up actions)
  const quotedWithoutFollowUp = leads.filter(l => {
    if (l.status !== 'quoted') return false;
    const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
    return actions.length === 0;
  });

  // 3. Leads stalled > 48h (new or contacted leads not updated in 48h)
  const stalledLeads = leads.filter(l => {
    if (l.status === 'won' || l.status === 'lost' || l.status === 'converted') return false;
    const lastUpdate = new Date(l.updated_at);
    return lastUpdate < fortyEightHoursAgo;
  });

  const hasAlerts = projectsNeedingJobProof.length > 0 || quotedWithoutFollowUp.length > 0 || stalledLeads.length > 0;

  return (
    <div className="mb-6 space-y-3">
      <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        Ações Obrigatórias
      </h2>

      {!hasAlerts ? (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-700 font-medium">
            ✓ Nenhuma ação crítica agora
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {/* Projects blocked by JobProof */}
          {projectsNeedingJobProof.length > 0 && (
            <Alert className="border-destructive/50 bg-destructive/5">
              <Camera className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive font-semibold flex items-center gap-2">
                JobProof Pendente
                <Badge variant="destructive" className="ml-2">
                  {projectsNeedingJobProof.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Projetos bloqueados para conclusão - adicione fotos before/after:
                </p>
                <ul className="space-y-1">
                  {projectsNeedingJobProof.slice(0, 5).map(p => (
                    <li key={p.id} className="text-sm font-medium text-destructive">
                      • {p.customer_name}
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
          {quotedWithoutFollowUp.length > 0 && (
            <Alert className="border-amber-500/50 bg-amber-50">
              <Phone className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700 font-semibold flex items-center gap-2">
                Follow-up Obrigatório
                <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">
                  {quotedWithoutFollowUp.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Propostas enviadas aguardando primeiro follow-up:
                </p>
                <ul className="space-y-1">
                  {quotedWithoutFollowUp.slice(0, 5).map(l => (
                    <li key={l.id} className="text-sm font-medium text-amber-700">
                      • {l.name}
                    </li>
                  ))}
                  {quotedWithoutFollowUp.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      ... e mais {quotedWithoutFollowUp.length - 5}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Stalled leads */}
          {stalledLeads.length > 0 && (
            <Alert className="border-orange-500/50 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-700 font-semibold flex items-center gap-2">
                Leads Parados +48h
                <Badge className="ml-2 bg-orange-500 hover:bg-orange-600">
                  {stalledLeads.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Leads sem atualização há mais de 48 horas:
                </p>
                <ul className="space-y-1">
                  {stalledLeads.slice(0, 5).map(l => (
                    <li key={l.id} className="text-sm font-medium text-orange-700">
                      • {l.name} ({l.status})
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
