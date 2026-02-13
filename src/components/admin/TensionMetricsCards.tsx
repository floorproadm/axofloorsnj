import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Phone, CheckCircle, AlertOctagon, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeStatus } from '@/hooks/useLeadPipeline';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  status: string;
  follow_up_actions?: { date: string; action: string }[];
  updated_at: string;
}

interface TensionMetricsCardsProps {
  leads: Lead[];
}

type TensionLevel = 'ok' | 'attention' | 'critical';

function getTensionLevel(count: number): TensionLevel {
  if (count === 0) return 'ok';
  if (count <= 2) return 'attention';
  return 'critical';
}

// Sistema de sinais visuais conforme spec
function getTensionStyles(level: TensionLevel) {
  switch (level) {
    case 'ok':
      return {
        card: 'bg-[hsl(var(--state-success-bg))] border-[hsl(var(--state-success))] hover:shadow-lg',
        iconBg: 'bg-[hsl(var(--state-success))]',
        text: 'text-[hsl(var(--state-success))]',
        subtext: 'text-emerald-600/80',
        badge: 'OK'
      };
    case 'attention':
      return {
        card: 'bg-[hsl(var(--state-risk-bg))] border-[hsl(var(--state-risk))] hover:shadow-lg animate-pulse-slow',
        iconBg: 'bg-[hsl(var(--state-risk))]',
        text: 'text-[hsl(var(--state-risk))]',
        subtext: 'text-amber-600/80',
        badge: 'ATENÇÃO'
      };
    case 'critical':
      return {
        card: 'bg-[hsl(var(--state-blocked-bg))] border-[hsl(var(--state-blocked))] hover:shadow-lg ring-2 ring-red-400/30',
        iconBg: 'bg-[hsl(var(--state-blocked))]',
        text: 'text-[hsl(var(--state-blocked))]',
        subtext: 'text-red-600/80',
        badge: 'CRÍTICO'
      };
  }
}

export function TensionMetricsCards({ leads }: TensionMetricsCardsProps) {
  const navigate = useNavigate();
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 1. Leads sem resposta (new_lead status or stalled > 48h in early stages)
  const leadsWithoutResponse = leads.filter(l => {
    const normalized = normalizeStatus(l.status);
    if (normalized === 'cold_lead') return true;
    if (normalized === 'warm_lead' || normalized === 'estimate_requested') {
      const lastUpdate = new Date(l.updated_at);
      return lastUpdate < fortyEightHoursAgo;
    }
    return false;
  });

  // 2. Propostas sem follow-up (proposal without follow-up actions)
  const proposalsWithoutFollowUp = leads.filter(l => {
    const normalized = normalizeStatus(l.status);
    if (normalized !== 'proposal_sent') return false;
    const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
    return actions.length === 0;
  });

  const metrics = [
    {
      label: 'Leads Novos',
      count: leadsWithoutResponse.length,
      icon: Clock,
      criticalIcon: AlertTriangle,
      onClick: () => navigate('/admin/leads'),
      descriptionZero: 'Todos contatados ✓',
      descriptionActive: 'Aguardando primeiro contato'
    },
    {
      label: 'Orçamentos Pendentes',
      count: proposalsWithoutFollowUp.length,
      icon: Phone,
      criticalIcon: AlertOctagon,
      onClick: () => navigate('/admin/leads'),
      descriptionZero: 'Todos acompanhados ✓',
      descriptionActive: 'Sem follow-up registrado'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {metrics.map((metric) => {
        const level = getTensionLevel(metric.count);
        const styles = getTensionStyles(level);
        const Icon = level === 'ok' ? CheckCircle : (level === 'critical' ? metric.criticalIcon : metric.icon);

        return (
          <Card
            key={metric.label}
            className={cn(
              "cursor-pointer transition-all duration-200 transform hover:scale-[1.02] border-2",
              styles.card
            )}
            onClick={metric.onClick}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Número grande */}
                  <p className={cn("text-3xl sm:text-4xl font-bold tracking-tight", styles.text)}>
                    {metric.count}
                  </p>
                  {/* Label de contexto */}
                  <p className={cn("text-sm sm:text-base font-semibold", styles.text)}>
                    {metric.label}
                  </p>
                  {/* Descrição */}
                  <p className={cn("text-xs sm:text-sm", styles.subtext)}>
                    {metric.count === 0 ? metric.descriptionZero : metric.descriptionActive}
                  </p>
                </div>
                {/* Ícone com fundo colorido */}
                <div className={cn(
                  "p-2.5 sm:p-3 rounded-xl flex-shrink-0",
                  styles.iconBg
                )}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
              
              {/* Badge de urgência */}
              {level !== 'ok' && (
                <div className={cn(
                  "mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide",
                  level === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                )}>
                  {level === 'critical' ? '🛑' : '⚠️'} {styles.badge}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
