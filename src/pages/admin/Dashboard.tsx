import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  Clock,
  TrendingDown,
  ArrowRight,
  Briefcase,
  Camera,
  Target,
  Percent,
  Activity,
  Inbox
} from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "Novo Contato",
  appt_scheduled: "Visita Agendada",
  proposal: "Orçamento Enviado",
  in_production: "Em Execução",
  completed: "Finalizado",
  lost: "Perdido"
};

const SOURCE_LABELS: Record<string, string> = {
  contact: "Contato",
  quiz: "Quiz",
  "floor-diagnostic": "Diagnóstico",
  builders_page: "Builders",
  realtors_page: "Realtors",
  lead_magnet: "Lead Magnet",
  manual: "Manual"
};

export default function Dashboard() {
  const {
    isLoading,
    error,
    lastUpdated,
    criticalAlerts,
    moneyMetrics,
    funnelMetrics,
    marginHealth,
    executionMetrics,
    intakeMetrics
  } = useDashboardData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (error) {
    return (
      <AdminLayout title="Dashboard Executivo" breadcrumbs={[{ label: "Dashboard" }]}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium text-destructive">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard Executivo" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-6">
        {/* TOP BAR: Hoje */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-navy">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sistema Online</span>
            </div>
            <span>
              Atualizado: {format(lastUpdated, "HH:mm")}
            </span>
          </div>
        </div>

        {/* BLOCO 1: ALERTAS CRÍTICOS */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas Críticos
          </h2>
          
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : criticalAlerts.hasNoCriticalIssues ? (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Nenhuma ação crítica hoje</p>
                  <p className="text-sm text-green-600">Todas as operações estão em dia</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {/* CRÍTICO: Proposals sem follow-up */}
              {criticalAlerts.proposalWithoutFollowUp.length > 0 && (
                <Link to="/admin/leads?status=proposal" className="block">
                  <Card className="border-red-300 bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Badge variant="destructive" className="mb-1">CRÍTICO</Badge>
                          <p className="font-medium text-red-800">
                            {criticalAlerts.proposalWithoutFollowUp.length} orçamento(s) sem follow-up
                          </p>
                          <p className="text-sm text-red-600 truncate">
                            Dinheiro travado: {formatCurrency(
                              criticalAlerts.proposalWithoutFollowUp.reduce((s, l) => s + (l.budget || 0), 0)
                            )}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* CRÍTICO: Jobs bloqueados por JobProof */}
              {criticalAlerts.jobsBlockedByProof.length > 0 && (
                <Link to="/admin/leads?tab=jobs" className="block">
                  <Card className="border-red-300 bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Camera className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Badge variant="destructive" className="mb-1">CRÍTICO</Badge>
                          <p className="font-medium text-red-800">
                            {criticalAlerts.jobsBlockedByProof.length} job(s) sem JobProof
                          </p>
                          <p className="text-sm text-red-600">
                            Não podem ser finalizados
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* CRÍTICO: Leads parados +48h */}
              {criticalAlerts.leadsStalled48h.length > 0 && (
                <Link to="/admin/leads" className="block">
                  <Card className="border-red-300 bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Badge variant="destructive" className="mb-1">CRÍTICO</Badge>
                          <p className="font-medium text-red-800">
                            {criticalAlerts.leadsStalled48h.length} lead(s) parado(s) +48h
                          </p>
                          <p className="text-sm text-red-600">
                            Risco de perda iminente
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* ATENÇÃO: Novos sem contato 24h */}
              {criticalAlerts.newLeadsNoContact24h.length > 0 && (
                <Link to="/admin/leads?status=new_lead" className="block">
                  <Card className="border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Badge className="bg-amber-100 text-amber-800 mb-1">ATENÇÃO</Badge>
                          <p className="font-medium text-amber-800">
                            {criticalAlerts.newLeadsNoContact24h.length} novo(s) sem contato
                          </p>
                          <p className="text-sm text-amber-600">
                            Mais de 24h aguardando
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* ATENÇÃO: Gargalo no pipeline */}
              {criticalAlerts.pipelineBottleneck && (
                <Link to="/admin/leads" className="block">
                  <Card className="border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Activity className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Badge className="bg-amber-100 text-amber-800 mb-1">ATENÇÃO</Badge>
                          <p className="font-medium text-amber-800">
                            Gargalo no pipeline
                          </p>
                          <p className="text-sm text-amber-600">
                            {criticalAlerts.pipelineBottleneck.count} em "{STAGE_LABELS[criticalAlerts.pipelineBottleneck.stage] || criticalAlerts.pipelineBottleneck.stage}"
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* BLOCO 2: DINHEIRO NO PIPELINE */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Dinheiro no Pipeline
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Leads Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-navy">{moneyMetrics.activeLeadsCount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Valor Estimado em Aberto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(moneyMetrics.estimatedValueOpen)}
                  </p>
                </CardContent>
              </Card>

              <Card className={moneyMetrics.blockedLeadsCount > 0 ? "border-red-200 bg-red-50/30" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Dinheiro Travado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${moneyMetrics.blockedLeadsCount > 0 ? "text-red-600" : "text-navy"}`}>
                    {formatCurrency(moneyMetrics.blockedLeadsValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {moneyMetrics.blockedLeadsCount} lead(s) bloqueado(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Velocidade Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-navy">
                    {moneyMetrics.avgVelocityDays} <span className="text-lg font-normal">dias</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo médio no pipeline
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* BLOCO 3: FUNIL SIMPLES */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Funil de Leads
          </h2>
          
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <Card>
              <CardContent className="py-4">
                {/* Desktop: Horizontal */}
                <div className="hidden md:flex items-center justify-between gap-2">
                  {(["new_lead", "appt_scheduled", "proposal", "in_production", "completed"] as const).map((stage, idx, arr) => (
                    <div key={stage} className="flex items-center flex-1">
                      <div className="flex-1 text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-navy">{funnelMetrics[stage]}</p>
                        <p className="text-xs text-muted-foreground">{STAGE_LABELS[stage]}</p>
                      </div>
                      {idx < arr.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-muted-foreground mx-1 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                  <div className="border-l-2 border-muted pl-4 ml-2">
                    <div className="text-center p-3 rounded-lg bg-red-50">
                      <p className="text-2xl font-bold text-red-600">{funnelMetrics.lost}</p>
                      <p className="text-xs text-red-600">{STAGE_LABELS.lost}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile: Vertical */}
                <div className="md:hidden space-y-2">
                  {(["new_lead", "appt_scheduled", "proposal", "in_production", "completed", "lost"] as const).map((stage) => (
                    <div 
                      key={stage} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        stage === "lost" ? "bg-red-50" : "bg-muted/50"
                      }`}
                    >
                      <span className={`text-sm ${stage === "lost" ? "text-red-600" : "text-muted-foreground"}`}>
                        {STAGE_LABELS[stage]}
                      </span>
                      <span className={`text-xl font-bold ${stage === "lost" ? "text-red-600" : "text-navy"}`}>
                        {funnelMetrics[stage]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Lost rate */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingDown className="w-4 h-4" />
                    <span>Taxa de perda (30 dias)</span>
                  </div>
                  <Badge variant={funnelMetrics.lostRate30d > 30 ? "destructive" : "secondary"}>
                    {funnelMetrics.lostRate30d}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* BLOCO 4: SAÚDE DE MARGEM */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Saúde de Margem
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : !marginHealth.hasData ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Percent className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Sem dados de margem suficientes ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os dados aparecerão conforme projetos forem calculados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Margem Média (30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${
                    marginHealth.avgMargin30d !== null && marginHealth.avgMargin30d >= 30 
                      ? "text-green-600" 
                      : "text-amber-600"
                  }`}>
                    {marginHealth.avgMargin30d !== null ? `${marginHealth.avgMargin30d}%` : "—"}
                  </p>
                </CardContent>
              </Card>

              <Card className={marginHealth.jobsBelowMinMargin > 0 ? "border-red-200 bg-red-50/30" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jobs Abaixo da Margem Mínima
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${
                    marginHealth.jobsBelowMinMargin > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {marginHealth.jobsBelowMinMargin}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lucro Estimado em Aberto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(marginHealth.estimatedProfitOpen)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* BLOCO 5: EXECUÇÃO (Jobs) */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Execução
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jobs em Produção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-navy">{executionMetrics.jobsInProduction}</p>
                </CardContent>
              </Card>

              <Card className={executionMetrics.jobsReadyToComplete > 0 ? "border-green-200 bg-green-50/30" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prontos para Concluir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${executionMetrics.jobsReadyToComplete > 0 ? "text-green-600" : "text-navy"}`}>
                    {executionMetrics.jobsReadyToComplete}
                  </p>
                </CardContent>
              </Card>

              <Card className={executionMetrics.jobsBlockedByProof > 0 ? "border-red-200 bg-red-50/30" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Bloqueados por JobProof
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${executionMetrics.jobsBlockedByProof > 0 ? "text-red-600" : "text-green-600"}`}>
                    {executionMetrics.jobsBlockedByProof}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* BLOCO 6: CAPTAÇÃO (Intake) */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Captação (30 dias)
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Top 3 Sources by Volume */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Fontes (Volume)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intakeMetrics.topSourcesByVolume.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  ) : (
                    <div className="space-y-2">
                      {intakeMetrics.topSourcesByVolume.map((s, idx) => (
                        <div key={s.source} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {idx + 1}. {SOURCE_LABELS[s.source] || s.source}
                          </span>
                          <Badge variant="secondary">{s.count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Source by Conversion */}
              <Card className={intakeMetrics.topSourceByConversion ? "border-green-200 bg-green-50/30" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Melhor Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intakeMetrics.topSourceByConversion ? (
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {intakeMetrics.topSourceByConversion.rate}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {SOURCE_LABELS[intakeMetrics.topSourceByConversion.source] || intakeMetrics.topSourceByConversion.source}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Mín. 3 leads por fonte
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Manual Leads */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Leads Manuais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-navy">{intakeMetrics.manualLeads30d}</p>
                  <p className="text-xs text-muted-foreground mt-1">Entrada manual nos últimos 30 dias</p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Footer: Read-only notice */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Dashboard somente leitura • Dados: leads, projects, job_costs, job_proof, company_settings
        </div>
      </div>
    </AdminLayout>
  );
}
