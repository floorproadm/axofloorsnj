import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Phone, Camera, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeStatus } from '@/hooks/useLeadPipeline';

interface Lead {
  id: string;
  name: string;
  status: string;
  follow_up_actions?: { date: string; action: string }[];
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

interface TensionMetricsCardsProps {
  leads: Lead[];
  projects: Project[];
  jobProofs: JobProof[];
}

type TensionLevel = 'ok' | 'attention' | 'critical';

function getTensionLevel(count: number): TensionLevel {
  if (count === 0) return 'ok';
  if (count <= 2) return 'attention';
  return 'critical';
}

function getTensionStyles(level: TensionLevel) {
  switch (level) {
    case 'ok':
      return {
        card: 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
        icon: 'bg-white/20',
        text: 'text-white',
        subtext: 'text-white/80'
      };
    case 'attention':
      return {
        card: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
        icon: 'bg-white/20',
        text: 'text-white',
        subtext: 'text-white/80'
      };
    case 'critical':
      return {
        card: 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
        icon: 'bg-white/20',
        text: 'text-white',
        subtext: 'text-white/80'
      };
  }
}

export function TensionMetricsCards({ leads, projects, jobProofs }: TensionMetricsCardsProps) {
  const navigate = useNavigate();
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 1. Leads sem resposta (new_lead status or stalled > 48h in early stages)
  const leadsWithoutResponse = leads.filter(l => {
    const normalized = normalizeStatus(l.status);
    if (normalized === 'new_lead') return true;
    if (normalized === 'appt_scheduled') {
      const lastUpdate = new Date(l.updated_at);
      return lastUpdate < fortyEightHoursAgo;
    }
    return false;
  });

  // 2. Propostas sem follow-up (proposal without follow-up actions)
  const proposalsWithoutFollowUp = leads.filter(l => {
    const normalized = normalizeStatus(l.status);
    if (normalized !== 'proposal') return false;
    const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
    return actions.length === 0;
  });

  // 3. Jobs bloqueados (in_progress without complete job proof)
  const blockedJobs = projects.filter(p => {
    if (p.project_status !== 'in_progress') return false;
    const proof = jobProofs.find(jp => jp.project_id === p.id);
    return !proof || !proof.before_image_url || !proof.after_image_url;
  });

  const metrics = [
    {
      label: 'Leads sem Resposta',
      count: leadsWithoutResponse.length,
      icon: AlertTriangle,
      onClick: () => navigate('/admin/leads'),
      description: leadsWithoutResponse.length === 0 ? 'Todos respondidos' : 'Precisam de contato'
    },
    {
      label: 'Propostas sem Follow-up',
      count: proposalsWithoutFollowUp.length,
      icon: Phone,
      onClick: () => navigate('/admin/leads'),
      description: proposalsWithoutFollowUp.length === 0 ? 'Todos acompanhados' : 'Aguardando ação'
    },
    {
      label: 'Jobs Bloqueados',
      count: blockedJobs.length,
      icon: Camera,
      onClick: () => navigate('/admin/leads'),
      description: blockedJobs.length === 0 ? 'Nenhum bloqueio' : 'Faltam fotos before/after'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric) => {
        const level = getTensionLevel(metric.count);
        const styles = getTensionStyles(level);
        const Icon = level === 'ok' ? CheckCircle : metric.icon;

        return (
          <Card
            key={metric.label}
            className={`cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg ${styles.card}`}
            onClick={metric.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${styles.text}`}>
                    {metric.count}
                  </p>
                  <p className={`text-sm font-semibold ${styles.text}`}>
                    {metric.label}
                  </p>
                  <p className={`text-xs mt-1 ${styles.subtext}`}>
                    {metric.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${styles.icon}`}>
                  <Icon className={`w-8 h-8 ${styles.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
