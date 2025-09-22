import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Phone,
  LogOut,
  Home,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LeadsManagement from './LeadsManagement';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  room_size?: string;
  location?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  message?: string;
  assigned_to?: string;
  follow_up_date?: string;
  last_contacted_at?: string;
  converted_to_project_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    acceptedProposals: 0,  // leads que aceitaram proposta (converted)
    rejectedProposals: 0,  // leads que rejeitaram (lost)
    conversionRate: 0
  });

  useEffect(() => {
    loadLeadsData();
  }, []);

  const loadLeadsData = async () => {
    setLoading(true);
    try {
      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      
      const processedLeads = (leadsData || []).map(lead => ({
        ...lead,
        services: Array.isArray(lead.services) ? lead.services as string[] : []
      }));
      setLeads(processedLeads);

      // Calculate stats focados em aceitação de propostas
      const total = processedLeads.length;
      const newCount = processedLeads.filter(l => l.status === 'new').length;
      const contactedCount = processedLeads.filter(l => l.status === 'contacted').length;
      const qualifiedCount = processedLeads.filter(l => l.status === 'qualified').length;
      const acceptedCount = processedLeads.filter(l => l.status === 'converted').length; // aceitaram proposta
      const rejectedCount = processedLeads.filter(l => l.status === 'lost').length; // rejeitaram proposta
      const conversionRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

      setStats({
        totalLeads: total,
        newLeads: newCount,
        contactedLeads: contactedCount,
        qualifiedLeads: qualifiedCount,
        acceptedProposals: acceptedCount,
        rejectedProposals: rejectedCount,
        conversionRate
      });

    } catch (error) {
      console.error('Error loading leads data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Por favor, atualize a página e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-grey/20 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-navy truncate">
                AXO Admin - Gestão de Leads
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1 sm:ml-2">Início</span>
                </Button>
              </Link>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="h-8 px-2 sm:px-3 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Analytics de Aceitação de Propostas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics de Propostas
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 mb-6">
            <Card className="col-span-1">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full mb-1 sm:mb-2 mx-auto">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.totalLeads}</div>
                <div className="text-xs text-grey">Total Leads</div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full mb-1 sm:mb-2 mx-auto">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.newLeads}</div>
                <div className="text-xs text-grey">Novos</div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full mb-1 sm:mb-2 mx-auto">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.contactedLeads}</div>
                <div className="text-xs text-grey">Contatados</div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full mb-1 sm:mb-2 mx-auto">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.qualifiedLeads}</div>
                <div className="text-xs text-grey">Qualificados</div>
              </CardContent>
            </Card>

            <Card className="col-span-1 border-green-200">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full mb-1 sm:mb-2 mx-auto">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-green-600 mb-1">{stats.acceptedProposals}</div>
                <div className="text-xs text-green-600 font-medium">✓ Aceitaram</div>
              </CardContent>
            </Card>

            <Card className="col-span-1 border-red-200">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-100 rounded-full mb-1 sm:mb-2 mx-auto">
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-red-600 mb-1">{stats.rejectedProposals}</div>
                <div className="text-xs text-red-600 font-medium">✗ Rejeitaram</div>
              </CardContent>
            </Card>

            <Card className="col-span-1 border-gold/30">
              <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gold/20 rounded-full mb-1 sm:mb-2 mx-auto">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold" />
                </div>
                <div className="text-sm sm:text-lg md:text-xl font-bold text-gold mb-1">{stats.conversionRate}%</div>
                <div className="text-xs text-gold font-medium">Taxa</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leads Management Completo */}
        <LeadsManagement />
      </div>
    </div>
  );
};

export default Admin;