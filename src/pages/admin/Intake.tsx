import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Globe,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

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
};

// Normalize legacy contact sources to unified 'contact'
const normalizeSource = (source: string): string => {
  if (['contact_form', 'contact_page', 'contact_section'].includes(source)) {
    return 'contact';
  }
  return source;
};

export default function Intake() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  // Form state for manual lead
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    budget: '',
    notes: ''
  });

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, email, lead_source, status, priority, services, budget, city, created_at, updated_at, notes, follow_up_required, next_action_date, follow_up_actions, converted_to_project_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os leads.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Calculate source statistics
  const sourceStats = useMemo((): SourceStats[] => {
    const statsMap = new Map<string, SourceStats>();

    leads.forEach(lead => {
      // Normalize legacy contact sources to unified 'contact'
      const rawSource = lead.lead_source || 'website';
      const source = normalizeSource(rawSource);
      const existing = statsMap.get(source) || {
        source,
        type: SOURCE_LABELS[source]?.type || 'Outro',
        total: 0,
        converted: 0,
        lost: 0,
        avgBudget: 0,
        budgetSum: 0,
        budgetCount: 0
      };

      existing.total++;
      
      if (lead.status === 'completed' || lead.converted_to_project_id) {
        existing.converted++;
      }
      if (lead.status === 'lost') {
        existing.lost++;
      }
      if (lead.budget && lead.budget > 0) {
        (existing as any).budgetSum += lead.budget;
        (existing as any).budgetCount++;
      }

      statsMap.set(source, existing);
    });

    return Array.from(statsMap.values())
      .map(stat => ({
        ...stat,
        avgBudget: (stat as any).budgetCount > 0 
          ? Math.round((stat as any).budgetSum / (stat as any).budgetCount)
          : 0
      }))
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

    const mostLost = validSources.reduce((worst, current) => {
      return current.lost > (worst?.lost || 0) ? current : worst;
    }, null as SourceStats | null);

    const stuckInProposal = leads.filter(l => 
      l.status === 'proposal' && !l.converted_to_project_id
    );
    const stuckBySource = new Map<string, number>();
    stuckInProposal.forEach(l => {
      const source = l.lead_source || 'website';
      stuckBySource.set(source, (stuckBySource.get(source) || 0) + 1);
    });
    let maxStuckSource: string | null = null;
    let maxStuckCount = 0;
    stuckBySource.forEach((count, source) => {
      if (count > maxStuckCount) {
        maxStuckCount = count;
        maxStuckSource = source;
      }
    });

    const bestTicket = validSources.reduce((best, current) => {
      return current.avgBudget > (best?.avgBudget || 0) ? current : best;
    }, null as SourceStats | null);

    return {
      bestConversion,
      mostLost,
      stuckSource: maxStuckSource,
      stuckCount: maxStuckCount,
      bestTicket
    };
  }, [sourceStats, leads]);

  // Operational alerts
  const alerts = useMemo(() => {
    const result: { type: 'error' | 'warning' | 'success'; message: string }[] = [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = leads.filter(l => new Date(l.created_at) >= sevenDaysAgo);
    const recentWithAppointment = recentLeads.filter(l => 
      l.status !== 'new_lead' && l.status !== 'lost'
    );

    if (recentLeads.length > 0 && recentWithAppointment.length === 0) {
      result.push({
        type: 'error',
        message: `Você recebeu ${recentLeads.length} leads nos últimos 7 dias, mas nenhum virou visita.`
      });
    }

    // Check if quiz leads are stuck
    const quizLeads = leads.filter(l => l.lead_source === 'quiz');
    const quizStuck = quizLeads.filter(l => l.status === 'new_lead' || l.status === 'appt_scheduled');
    if (quizLeads.length >= 3 && quizStuck.length / quizLeads.length > 0.5) {
      result.push({
        type: 'warning',
        message: "A fonte 'Quiz' gera bons leads, mas está travando no follow-up."
      });
    }

    // Check manual vs forms performance
    const manualLeads = leads.filter(l => l.lead_source === 'manual');
    const formLeads = leads.filter(l => 
      l.lead_source === 'contact_form' || 
      l.lead_source === 'contact_page' ||
      l.lead_source === 'contact_section'
    );
    const manualConverted = manualLeads.filter(l => l.status === 'completed' || l.converted_to_project_id).length;
    const formConverted = formLeads.filter(l => l.status === 'completed' || l.converted_to_project_id).length;
    
    if (manualLeads.length >= 3 && formLeads.length >= 3) {
      const manualRate = manualConverted / manualLeads.length;
      const formRate = formConverted / formLeads.length;
      if (manualRate > formRate) {
        result.push({
          type: 'success',
          message: "Leads manuais estão convertendo melhor que formulários."
        });
      }
    }

    // No leads recently
    if (recentLeads.length === 0) {
      result.push({
        type: 'warning',
        message: "Nenhum lead nos últimos 7 dias. Hora de ativar a captação."
      });
    }

    return result;
  }, [leads]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        city: formData.city.trim() || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        notes: formData.notes.trim() || null,
        lead_source: 'manual',
        status: 'new_lead'
      });

      if (error) throw error;

      toast({
        title: "Lead adicionado",
        description: `${formData.name} foi adicionado com sucesso.`
      });

      setFormData({ name: '', phone: '', email: '', city: '', budget: '', notes: '' });
      setIsModalOpen(false);
      fetchLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o lead.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getSourceLabel = (source: string) => {
    return SOURCE_LABELS[source]?.label || source;
  };

  const getSourceIcon = (source: string) => {
    const IconComponent = SOURCE_LABELS[source]?.icon || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  // Get leads filtered by selected source (normalize legacy sources)
  const selectedSourceLeads = useMemo(() => {
    if (!selectedSource) return [];
    return leads
      .filter(l => normalizeSource(l.lead_source || 'website') === selectedSource)
      .slice(0, 10); // Show last 10 leads
  }, [selectedSource, leads]);

  const selectedSourceStats = useMemo(() => {
    if (!selectedSource) return null;
    return sourceStats.find(s => s.source === selectedSource) || {
      source: selectedSource,
      type: SOURCE_LABELS[selectedSource]?.type || 'Outro',
      total: 0,
      converted: 0,
      lost: 0,
      avgBudget: 0
    };
  }, [selectedSource, sourceStats]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: string }> = {
      'new_lead': { label: 'Novo', variant: 'bg-blue-100 text-blue-800' },
      'appt_scheduled': { label: 'Visita', variant: 'bg-purple-100 text-purple-800' },
      'proposal': { label: 'Orçamento', variant: 'bg-amber-100 text-amber-800' },
      'in_production': { label: 'Em Execução', variant: 'bg-cyan-100 text-cyan-800' },
      'completed': { label: 'Finalizado', variant: 'bg-green-100 text-green-800' },
      'lost': { label: 'Perdido', variant: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || { label: status, variant: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${config.variant} text-xs`}>{config.label}</Badge>;
  };

  return (
    <AdminLayout 
      title="Captação & Entrada de Leads" 
      breadcrumbs={[{ label: "Captação" }]}
    >
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto overflow-x-hidden">
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              Entenda de onde vêm seus leads e adicione novos contatos manualmente
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lead Manual
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Todas as Fontes</span>
                <span className="sm:hidden">Fontes</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {Object.keys(SOURCE_LABELS).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quality Insights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Best Conversion */}
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/20">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Maior Conversão</p>
                        <p className="font-semibold text-sm truncate">
                          {insights.bestConversion 
                            ? getSourceLabel(insights.bestConversion.source)
                            : 'Sem dados'}
                        </p>
                        {insights.bestConversion && (
                          <p className="text-xs text-success">
                            {Math.round((insights.bestConversion.converted / insights.bestConversion.total) * 100)}% convertidos
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Most Lost */}
                <Card className="border-blocked/30 bg-blocked/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blocked/20">
                        <TrendingDown className="h-5 w-5 text-blocked" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Mais Perdidos</p>
                        <p className="font-semibold text-sm truncate">
                          {insights.mostLost 
                            ? getSourceLabel(insights.mostLost.source)
                            : 'Nenhum'}
                        </p>
                        {insights.mostLost && (
                          <p className="text-xs text-blocked">
                            {insights.mostLost.lost} leads perdidos
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stuck in Proposal */}
                <Card className="border-risk/30 bg-risk/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-risk/20">
                        <Clock className="h-5 w-5 text-risk" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Travados em Proposta</p>
                        <p className="font-semibold text-sm truncate">
                          {insights.stuckSource 
                            ? getSourceLabel(insights.stuckSource)
                            : 'Nenhum'}
                        </p>
                        {insights.stuckCount > 0 && (
                          <p className="text-xs text-risk">
                            {insights.stuckCount} leads parados
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Ticket */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Maior Ticket Médio</p>
                        <p className="font-semibold text-sm truncate">
                          {insights.bestTicket 
                            ? getSourceLabel(insights.bestTicket.source)
                            : 'Sem dados'}
                        </p>
                        {insights.bestTicket && insights.bestTicket.avgBudget > 0 && (
                          <p className="text-xs text-primary">
                            {formatCurrency(insights.bestTicket.avgBudget)} média
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Operational Alerts */}
              {alerts.length > 0 && (
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        alert.type === 'error' 
                          ? 'bg-blocked/10 border-blocked/30 text-blocked' 
                          : alert.type === 'warning'
                          ? 'bg-risk/10 border-risk/30 text-risk'
                          : 'bg-success/10 border-success/30 text-success'
                      }`}
                    >
                      {alert.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0" />}
                      {alert.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Source Stats Table - Last 30 Days */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Fontes Ativas (Últimos 30 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  {sourceStats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum lead nos ultimos 30 dias</p>
                      <p className="text-sm">Verifique campanhas, site ou adicione manualmente</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Fonte</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tipo</th>
                            <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Leads</th>
                            <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Convertidos</th>
                            <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Perdidos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sourceStats.map((stat) => (
                            <tr key={stat.source} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  {getSourceIcon(stat.source)}
                                  <span className="font-medium text-sm">{getSourceLabel(stat.source)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant="secondary" className="text-xs">
                                  {stat.type}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-semibold">{stat.total}</span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="text-success font-medium">{stat.converted}</span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="text-blocked font-medium">{stat.lost}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Sources Tab */}
            <TabsContent value="sources" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Todas as Fontes de Captação</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(SOURCE_LABELS).length} fontes configuradas
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lista completa de todas as fontes de captação disponíveis no sistema
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(SOURCE_LABELS).map(([sourceKey, sourceInfo]) => {
                      const stats = sourceStats.find(s => s.source === sourceKey);
                      const IconComponent = sourceInfo.icon;
                      const hasActivity = stats && stats.total > 0;
                      
                      return (
                        <Card 
                          key={sourceKey} 
                          className={`transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                            hasActivity 
                              ? 'border-success/30 bg-success/5 hover:border-success/50' 
                              : 'border-muted bg-muted/20 opacity-75 hover:opacity-100'
                          }`}
                          onClick={() => setSelectedSource(sourceKey)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                hasActivity ? 'bg-success/20' : 'bg-muted'
                              }`}>
                                <IconComponent className={`h-5 w-5 ${
                                  hasActivity ? 'text-success' : 'text-muted-foreground'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-sm truncate">
                                    {sourceInfo.label}
                                  </p>
                                  {hasActivity && (
                                    <Badge className="bg-success/20 text-success text-xs shrink-0">
                                      Ativo
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {sourceInfo.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {sourceKey}
                                  </span>
                                </div>
                                {stats ? (
                                  <div className="flex items-center gap-3 mt-2 text-xs">
                                    <span className="text-foreground font-medium">
                                      {stats.total} leads
                                    </span>
                                    <span className="text-success">
                                      {stats.converted} ✓
                                    </span>
                                    <span className="text-blocked">
                                      {stats.lost} ✗
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Sem leads nos últimos 30 dias
                                  </p>
                                )}
                                {sourceInfo.url && (
                                  <a
                                    href={sourceInfo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Ir para formulário
                                  </a>
                                )}
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Source Types Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Tipos de Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {['Página', 'Qualificador', 'B2B', 'Isca', 'Interno', 'Referência'].map(type => {
                      const sourcesOfType = Object.entries(SOURCE_LABELS).filter(
                        ([_, info]) => info.type === type
                      );
                      const activeCount = sourcesOfType.filter(([key]) => 
                        sourceStats.some(s => s.source === key && s.total > 0)
                      ).length;
                      
                      return (
                        <div key={type} className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{sourcesOfType.length}</p>
                          <p className="text-sm text-muted-foreground">{type}</p>
                          <p className="text-xs text-success mt-1">
                            {activeCount} ativas
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Add Manual Lead Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Lead Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(000) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ex: Newark"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observação inicial</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Como você conheceu esse cliente? Algum detalhe importante?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Adicionar Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Source Quickview Sheet */}
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
                    {selectedSource && SOURCE_LABELS[selectedSource]?.type || 'Fonte de captação'}
                  </SheetDescription>
                </div>
              </div>
              {selectedSource && SOURCE_LABELS[selectedSource]?.url && (
                <a
                  href={SOURCE_LABELS[selectedSource].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Formulário
                </a>
              )}
            </SheetHeader>
            
            {selectedSourceStats && (
              <div className="mt-6 space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedSourceStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total (30d)</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-success/10">
                    <p className="text-2xl font-bold text-success">{selectedSourceStats.converted}</p>
                    <p className="text-xs text-muted-foreground">Convertidos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blocked/10">
                    <p className="text-2xl font-bold text-blocked">{selectedSourceStats.lost}</p>
                    <p className="text-xs text-muted-foreground">Perdidos</p>
                  </div>
                </div>

                {/* Conversion Rate */}
                {selectedSourceStats.total > 0 && (
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                      <span className="font-semibold">
                        {Math.round((selectedSourceStats.converted / selectedSourceStats.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success transition-all"
                        style={{ 
                          width: `${(selectedSourceStats.converted / selectedSourceStats.total) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Average Ticket */}
                {selectedSourceStats.avgBudget > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Ticket Médio</span>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatCurrency(selectedSourceStats.avgBudget)}
                    </span>
                  </div>
                )}

                {/* Recent Leads */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Leads Recentes
                  </h4>
                  {selectedSourceLeads.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum lead nos últimos 30 dias</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2 pr-4">
                        {selectedSourceLeads.map((lead) => (
                          <div 
                            key={lead.id} 
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{lead.name}</p>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{lead.phone}</span>
                                </div>
                                {lead.email && (
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                {lead.city && (
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{lead.city}</span>
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
                            {lead.budget && lead.budget > 0 && (
                              <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs">
                                <DollarSign className="h-3 w-3 text-primary" />
                                <span className="text-primary font-medium">
                                  {formatCurrency(lead.budget)}
                                </span>
                              </div>
                            )}
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
