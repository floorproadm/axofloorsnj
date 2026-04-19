import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AXO_ORG_ID } from "@/lib/constants";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadControlModal } from "@/components/admin/LeadControlModal";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  Building,
  Home,
  Pencil,
  BarChart3,
  List,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  Zap,
  ArrowRight,
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { STAGE_LABELS, STAGE_CONFIG, normalizeStatus } from "@/hooks/useLeadPipeline";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  lead_source: string;
  status: string;
  priority?: string;
  services?: any;
  budget: number | null;
  city: string | null;
  created_at: string;
  updated_at?: string;
  notes?: string | null;
  follow_up_required?: boolean | null;
  next_action_date?: string | null;
  follow_up_actions?: any;
  converted_to_project_id: string | null;
}

interface SourceStats {
  source: string;
  type: string;
  total: number;
  converted: number;
  lost: number;
  avgBudget: number;
}

const SOURCE_LABELS: Record<string, { label: string; type: string; icon: React.ComponentType<any>; url?: string }> = {
  'contact': { label: 'Formulário de Contato', type: 'Página', icon: FileText, url: '/contact' },
  'quiz': { label: 'Quiz Qualificador', type: 'Qualificador', icon: CheckCircle, url: '/quiz' },
  'floor-diagnostic': { label: 'Diagnóstico de Piso', type: 'Qualificador', icon: CheckCircle, url: '/floor-diagnostic' },
  'builders_page': { label: 'Página Builders', type: 'B2B', icon: Building, url: '/builders' },
  'realtors_page': { label: 'Página Realtors', type: 'B2B', icon: Home, url: '/realtors' },
  'lead_magnet': { label: 'Lead Magnet', type: 'Isca', icon: TrendingUp, url: '/gallery' },
  'manual': { label: 'Entrada Manual', type: 'Interno', icon: Pencil },
  'quick_quote': { label: 'Quick Quote', type: 'Ação Rápida', icon: Zap },
  'project_wizard': { label: 'Project Wizard', type: 'Qualificador', icon: CheckCircle, url: '/project-wizard' },
};

const normalizeSource = (source: string): string => {
  if (['contact_form', 'contact_page', 'contact_section'].includes(source)) {
    return 'contact';
  }
  return source;
};

type Period = "7d" | "30d" | "90d" | "6m" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
  { label: "6 meses", value: "6m" },
  { label: "Todos", value: "all" },
];

function getPeriodDate(period: Period): Date | null {
  const now = new Date();
  if (period === "7d") return subDays(now, 7);
  if (period === "30d") return subDays(now, 30);
  if (period === "90d") return subMonths(now, 3);
  if (period === "6m") return subMonths(now, 6);
  return null;
}

export default function Intake() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', city: '', budget: '', notes: ''
  });

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, email, lead_source, status, priority, services, budget, city, created_at, updated_at, notes, follow_up_required, next_action_date, follow_up_actions, converted_to_project_id')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setAllLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  // Filter leads by period
  const leads = useMemo(() => {
    const periodStart = getPeriodDate(period);
    if (!periodStart) return allLeads;
    return allLeads.filter(l => new Date(l.created_at) >= periodStart);
  }, [allLeads, period]);

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? period;

  // Source statistics
  const sourceStats = useMemo((): SourceStats[] => {
    const statsMap = new Map<string, SourceStats & { budgetSum: number; budgetCount: number }>();

    leads.forEach(lead => {
      const source = normalizeSource(lead.lead_source || 'website');
      const existing = statsMap.get(source) || {
        source, type: SOURCE_LABELS[source]?.type || 'Outro',
        total: 0, converted: 0, lost: 0, avgBudget: 0, budgetSum: 0, budgetCount: 0
      };
      existing.total++;
      if (lead.status === 'completed' || lead.converted_to_project_id) existing.converted++;
      if (lead.status === 'lost') existing.lost++;
      if (lead.budget && lead.budget > 0) { existing.budgetSum += lead.budget; existing.budgetCount++; }
      statsMap.set(source, existing);
    });

    return Array.from(statsMap.values())
      .map(stat => ({ ...stat, avgBudget: stat.budgetCount > 0 ? Math.round(stat.budgetSum / stat.budgetCount) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  // Quality insights
  const insights = useMemo(() => {
    const validSources = sourceStats.filter(s => s.total >= 2);
    const bestConversion = validSources.reduce((best, current) => {
      const currentRate = current.total > 0 ? current.converted / current.total : 0;
      const bestRate = best && best.total > 0 ? best.converted / best.total : 0;
      return currentRate > bestRate ? current : best;
    }, null as SourceStats | null);
    const mostLost = validSources.reduce((worst, current) => current.lost > (worst?.lost || 0) ? current : worst, null as SourceStats | null);
    const stuckInProposal = leads.filter(l => l.status === 'proposal_sent' && !l.converted_to_project_id);
    const stuckBySource = new Map<string, number>();
    stuckInProposal.forEach(l => { const s = normalizeSource(l.lead_source || 'website'); stuckBySource.set(s, (stuckBySource.get(s) || 0) + 1); });
    let stuckSource: string | null = null; let stuckCount = 0;
    stuckBySource.forEach((count, source) => { if (count > stuckCount) { stuckCount = count; stuckSource = source; } });
    const bestTicket = validSources.reduce((best, current) => current.avgBudget > (best?.avgBudget || 0) ? current : best, null as SourceStats | null);
    return { bestConversion, mostLost, stuckSource, stuckCount, bestTicket };
  }, [sourceStats, leads]);

  // Operational alerts
  const alerts = useMemo(() => {
    const result: { type: 'error' | 'warning' | 'success'; message: string; link?: string }[] = [];
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentLeads = leads.filter(l => new Date(l.created_at) >= sevenDaysAgo);
    const recentWithAppointment = recentLeads.filter(l => l.status !== 'cold_lead' && l.status !== 'lost');

    if (recentLeads.length > 0 && recentWithAppointment.length === 0) {
      result.push({ type: 'error', message: `${recentLeads.length} leads recentes, nenhum virou visita.`, link: '/admin/leads?status=cold_lead' });
    }
    const quizLeads = leads.filter(l => normalizeSource(l.lead_source) === 'quiz');
    const quizStuck = quizLeads.filter(l => l.status === 'cold_lead' || l.status === 'estimate_scheduled');
    if (quizLeads.length >= 3 && quizStuck.length / quizLeads.length > 0.5) {
      result.push({ type: 'warning', message: "Quiz gera bons leads, mas estão travando no follow-up.", link: '/admin/leads?status=cold_lead' });
    }
    if (recentLeads.length === 0) {
      result.push({ type: 'warning', message: "Nenhum lead recente. Hora de ativar a captação." });
    }
    return result;
  }, [leads]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: "Nome e telefone são obrigatórios.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: formData.name.trim(), phone: formData.phone.trim(),
        email: formData.email.trim() || null, city: formData.city.trim() || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        notes: formData.notes.trim() || null,
        lead_source: 'manual', status: 'cold_lead', organization_id: AXO_ORG_ID,
      });
      if (error) throw error;
      toast({ title: "Lead adicionado", description: `${formData.name} foi adicionado.` });
      setFormData({ name: '', phone: '', email: '', city: '', budget: '', notes: '' });
      setIsModalOpen(false);
      fetchLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const getSourceLabel = (source: string) => SOURCE_LABELS[source]?.label || source;
  const getSourceIcon = (source: string) => { const Icon = SOURCE_LABELS[source]?.icon || FileText; return <Icon className="h-4 w-4" />; };

  const selectedSourceLeads = useMemo(() => {
    if (!selectedSource) return [];
    return leads.filter(l => normalizeSource(l.lead_source || 'website') === selectedSource).slice(0, 15);
  }, [selectedSource, leads]);

  const selectedSourceStats = useMemo(() => {
    if (!selectedSource) return null;
    return sourceStats.find(s => s.source === selectedSource) || {
      source: selectedSource, type: SOURCE_LABELS[selectedSource]?.type || 'Outro',
      total: 0, converted: 0, lost: 0, avgBudget: 0
    };
  }, [selectedSource, sourceStats]);

  const getStatusBadge = (status: string) => {
    const normalized = normalizeStatus(status);
    const label = STAGE_LABELS[normalized] || status;
    const config = STAGE_CONFIG[normalized];
    return <Badge className={`${config?.bgColor || 'bg-muted'} ${config?.textColor || 'text-muted-foreground'} text-xs`}>{label}</Badge>;
  };

  const totalLeads = leads.length;
  const totalConverted = leads.filter(l => l.status === 'completed' || l.converted_to_project_id).length;
  const totalLost = leads.filter(l => l.status === 'lost').length;
  const conversionRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0;

  return (
    <AdminLayout
      title="Captação"
      breadcrumbs={[{ label: "Captação" }]}
    >
      <div className="space-y-5 animate-fade-in">
        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full md:w-auto justify-center md:justify-start">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <List className="w-4 h-4 mr-1.5" /> Fontes
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{totalLeads} leads no período</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* ─── Overview Tab ─── */}
              <TabsContent value="overview" className="space-y-5 mt-0">
                {/* Mission Control Alerts */}
                {alerts.length > 0 && (
                  <Card className="border-border/50 overflow-hidden">
                    <CardContent className="p-0 divide-y divide-border/50">
                      {alerts.map((alert, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            alert.type === 'error' ? "bg-[hsl(var(--state-blocked))]" :
                            alert.type === 'warning' ? "bg-[hsl(var(--state-risk))]" :
                            "bg-[hsl(var(--state-success))]"
                          )} />
                          {alert.type === 'error' && <AlertCircle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />}
                          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-risk))] shrink-0" />}
                          {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-[hsl(var(--state-success))] shrink-0" />}
                          <p className="text-sm flex-1">{alert.message}</p>
                          {alert.link && (
                            <Link to={alert.link} className="text-xs font-semibold text-primary hover:underline shrink-0 flex items-center gap-1">
                              Ver <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Total Leads</p>
                      <p className="text-2xl font-bold">{totalLeads}</p>
                      <p className="text-[11px] text-muted-foreground">{periodLabel}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Convertidos</p>
                      <p className="text-2xl font-bold text-[hsl(var(--state-success))]">{totalConverted}</p>
                      <p className="text-[11px] text-muted-foreground">{conversionRate}% taxa</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Perdidos</p>
                      <p className="text-2xl font-bold text-[hsl(var(--state-blocked))]">{totalLost}</p>
                      <p className="text-[11px] text-muted-foreground">{totalLeads > 0 ? Math.round((totalLost / totalLeads) * 100) : 0}% perda</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Fontes Ativas</p>
                      <p className="text-2xl font-bold">{sourceStats.length}</p>
                      <p className="text-[11px] text-muted-foreground">de {Object.keys(SOURCE_LABELS).length} configuradas</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className={cn("border", insights.bestConversion ? "border-[hsl(var(--state-success))]/30" : "border-border/50")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-[hsl(var(--state-success))]" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Maior Conversão</p>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {insights.bestConversion ? getSourceLabel(insights.bestConversion.source) : 'Sem dados'}
                      </p>
                      {insights.bestConversion && (
                        <p className="text-xs text-[hsl(var(--state-success))]">
                          {Math.round((insights.bestConversion.converted / insights.bestConversion.total) * 100)}% convertidos
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={cn("border", insights.mostLost ? "border-[hsl(var(--state-blocked))]/30" : "border-border/50")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-[hsl(var(--state-blocked))]" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mais Perdidos</p>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {insights.mostLost ? getSourceLabel(insights.mostLost.source) : 'Nenhum'}
                      </p>
                      {insights.mostLost && (
                        <p className="text-xs text-[hsl(var(--state-blocked))]">{insights.mostLost.lost} perdidos</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={cn("border", insights.stuckCount > 0 ? "border-[hsl(var(--state-risk))]/30" : "border-border/50")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-[hsl(var(--state-risk))]" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Travados</p>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {insights.stuckSource ? getSourceLabel(insights.stuckSource) : 'Nenhum'}
                      </p>
                      {insights.stuckCount > 0 && (
                        <p className="text-xs text-[hsl(var(--state-risk))]">{insights.stuckCount} em proposta</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={cn("border", insights.bestTicket ? "border-primary/30" : "border-border/50")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Maior Ticket</p>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {insights.bestTicket ? getSourceLabel(insights.bestTicket.source) : 'Sem dados'}
                      </p>
                      {insights.bestTicket && insights.bestTicket.avgBudget > 0 && (
                        <p className="text-xs text-primary">{formatCurrency(insights.bestTicket.avgBudget)} média</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Source Stats Table */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      Fontes Ativas ({periodLabel})
                    </p>
                    {sourceStats.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Nenhum lead no período</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Fonte</th>
                              <th className="text-left py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tipo</th>
                              <th className="text-center py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Leads</th>
                              <th className="text-center py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Convertidos</th>
                              <th className="text-center py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Perdidos</th>
                              <th className="text-center py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Taxa</th>
                              <th className="text-right py-2.5 px-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sourceStats.map((stat) => {
                              const rate = stat.total > 0 ? Math.round((stat.converted / stat.total) * 100) : 0;
                              return (
                                <tr
                                  key={stat.source}
                                  className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group"
                                  onClick={() => setSelectedSource(stat.source)}
                                >
                                  <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                      {getSourceIcon(stat.source)}
                                      <span className="font-medium text-sm group-hover:text-primary transition-colors">{getSourceLabel(stat.source)}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2">
                                    <Badge variant="secondary" className="text-xs">{stat.type}</Badge>
                                  </td>
                                  <td className="py-3 px-2 text-center font-semibold text-sm">{stat.total}</td>
                                  <td className="py-3 px-2 text-center text-sm font-medium text-[hsl(var(--state-success))]">{stat.converted}</td>
                                  <td className="py-3 px-2 text-center text-sm font-medium text-[hsl(var(--state-blocked))]">{stat.lost}</td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={cn("text-sm font-semibold",
                                      rate >= 30 ? "text-[hsl(var(--state-success))]" :
                                      rate >= 10 ? "text-[hsl(var(--state-risk))]" :
                                      "text-muted-foreground"
                                    )}>{rate}%</span>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── All Sources Tab ─── */}
              <TabsContent value="sources" className="space-y-5 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Object.entries(SOURCE_LABELS).map(([sourceKey, sourceInfo]) => {
                    const stats = sourceStats.find(s => s.source === sourceKey);
                    const IconComponent = sourceInfo.icon;
                    const hasActivity = stats && stats.total > 0;

                    return (
                      <Card
                        key={sourceKey}
                        className={cn(
                          "transition-all cursor-pointer hover:shadow-md border",
                          hasActivity
                            ? "border-[hsl(var(--state-success))]/30 hover:border-[hsl(var(--state-success))]/50"
                            : "border-border/50 opacity-70 hover:opacity-100"
                        )}
                        onClick={() => setSelectedSource(sourceKey)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className={cn("p-2 rounded-lg", hasActivity ? "bg-[hsl(var(--state-success))]/10" : "bg-muted")}>
                              <IconComponent className={cn("h-5 w-5", hasActivity ? "text-[hsl(var(--state-success))]" : "text-muted-foreground")} />
                            </div>
                            {hasActivity && (
                              <Badge className="bg-[hsl(var(--state-success))]/15 text-[hsl(var(--state-success))] text-[10px] border-0">Ativo</Badge>
                            )}
                          </div>
                          <p className="font-semibold text-sm">{sourceInfo.label}</p>
                          <Badge variant="secondary" className="text-[10px] mt-1">{sourceInfo.type}</Badge>
                          {stats ? (
                            <div className="flex items-center gap-3 mt-3 text-xs">
                              <span className="font-medium">{stats.total} leads</span>
                              <span className="text-[hsl(var(--state-success))]">{stats.converted} ✓</span>
                              <span className="text-[hsl(var(--state-blocked))]">{stats.lost} ✗</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-3">Sem leads no período</p>
                          )}
                          {sourceInfo.url && (
                            <a
                              href={sourceInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> Abrir formulário
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Add Manual Lead Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Lead Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="(000) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Ex: Newark" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input id="budget" type="number" value={formData.budget} onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observação</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Como conheceu esse cliente?" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Salvando..." : "Adicionar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Source Detail Sheet */}
        <Sheet open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <div className="flex items-center gap-3">
                {selectedSource && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getSourceIcon(selectedSource)}
                  </div>
                )}
                <div>
                  <SheetTitle>{selectedSource ? getSourceLabel(selectedSource) : ''}</SheetTitle>
                  <SheetDescription>
                    {selectedSource && SOURCE_LABELS[selectedSource]?.type || 'Fonte de captação'} · {periodLabel}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {selectedSourceStats && (
              <div className="mt-6 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedSourceStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[hsl(var(--state-success))]/10">
                    <p className="text-2xl font-bold text-[hsl(var(--state-success))]">{selectedSourceStats.converted}</p>
                    <p className="text-xs text-muted-foreground">Convertidos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[hsl(var(--state-blocked))]/10">
                    <p className="text-2xl font-bold text-[hsl(var(--state-blocked))]">{selectedSourceStats.lost}</p>
                    <p className="text-xs text-muted-foreground">Perdidos</p>
                  </div>
                </div>

                {/* Conversion Rate */}
                {selectedSourceStats.total > 0 && (
                  <div className="p-4 rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                      <span className="font-semibold">{Math.round((selectedSourceStats.converted / selectedSourceStats.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--state-success))] transition-all" style={{ width: `${(selectedSourceStats.converted / selectedSourceStats.total) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Avg Ticket */}
                {selectedSourceStats.avgBudget > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Ticket Médio</span>
                    </div>
                    <span className="font-semibold text-primary">{formatCurrency(selectedSourceStats.avgBudget)}</span>
                  </div>
                )}

                {/* Link to Pipeline filtered by source */}
                {selectedSource && selectedSourceStats.total > 0 && (
                  <Link
                    to={`/admin/leads`}
                    className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="text-sm font-medium">Ver no Pipeline</span>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}

                {/* Recent Leads */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Leads Recentes
                  </h4>
                  {selectedSourceLeads.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum lead no período</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2 pr-4">
                        {selectedSourceLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{lead.name}</p>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" /><span>{lead.phone}</span>
                                </div>
                                {lead.city && (
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" /><span>{lead.city}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {getStatusBadge(lead.status)}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(lead.created_at), 'dd/MM')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Lead Control Modal */}
        <LeadControlModal
          lead={selectedLead ? {
            ...selectedLead,
            email: selectedLead.email || undefined,
            priority: selectedLead.priority || 'medium',
            services: selectedLead.services || [],
            updated_at: selectedLead.updated_at || selectedLead.created_at,
          } : null}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={fetchLeads}
        />
      </div>
    </AdminLayout>
  );
}
