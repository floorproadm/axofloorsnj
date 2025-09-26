import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  city?: string;
  location?: string;
  created_at: string;
  follow_up_date?: string;
  last_contacted_at?: string;
}

export function useLeadsExport() {
  const { toast } = useToast();

  const exportToCSV = useCallback((leads: Lead[], filename: string = 'leads') => {
    try {
      // Define CSV headers
      const headers = [
        'Nome',
        'Email',
        'Telefone',
        'Fonte',
        'Status',
        'Prioridade',
        'Serviços',
        'Orçamento',
        'Tamanho do Ambiente',
        'Cidade',
        'Localização',
        'Data de Criação',
        'Follow-up Agendado',
        'Último Contato'
      ];

      // Convert leads to CSV rows
      const csvRows = leads.map(lead => [
        lead.name,
        lead.email || '',
        lead.phone,
        lead.lead_source.replace('_', ' '),
        lead.status,
        lead.priority,
        lead.services ? lead.services.join('; ') : '',
        lead.budget ? `$${lead.budget.toLocaleString()}` : '',
        lead.room_size || '',
        lead.city || '',
        lead.location || '',
        new Date(lead.created_at).toLocaleDateString('pt-BR'),
        lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('pt-BR') : '',
        lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('pt-BR') : ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: `${leads.length} leads exportados para CSV`
      });

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      });
    }
  }, [toast]);

  const exportToJSON = useCallback((leads: Lead[], filename: string = 'leads') => {
    try {
      const jsonContent = JSON.stringify(leads, null, 2);
      
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: `${leads.length} leads exportados para JSON`
      });

    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      });
    }
  }, [toast]);

  const generateReport = useCallback((leads: Lead[]) => {
    const now = new Date();
    const report = {
      generated_at: now.toISOString(),
      total_leads: leads.length,
      by_status: leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_priority: leads.reduce((acc, lead) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_source: leads.reduce((acc, lead) => {
        acc[lead.lead_source] = (acc[lead.lead_source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_city: leads.reduce((acc, lead) => {
        if (lead.city) {
          acc[lead.city] = (acc[lead.city] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      total_budget: leads.reduce((sum, lead) => sum + (lead.budget || 0), 0),
      average_budget: leads.filter(l => l.budget).length > 0 
        ? Math.round(leads.reduce((sum, lead) => sum + (lead.budget || 0), 0) / leads.filter(l => l.budget).length)
        : 0,
      conversion_rate: leads.length > 0 
        ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
        : 0,
      follow_ups_overdue: leads.filter(lead => {
        if (!lead.follow_up_date) return false;
        return new Date(lead.follow_up_date) < now && lead.status !== 'converted' && lead.status !== 'lost';
      }).length,
      not_contacted: leads.filter(lead => !lead.last_contacted_at).length
    };

    return report;
  }, []);

  const exportReport = useCallback((leads: Lead[], filename: string = 'leads_report') => {
    try {
      const report = generateReport(leads);
      const reportContent = JSON.stringify(report, null, 2);
      
      const blob = new Blob([reportContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório exportado",
        description: "Relatório analítico gerado com sucesso"
      });

    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    }
  }, [generateReport, toast]);

  return {
    exportToCSV,
    exportToJSON,
    exportReport,
    generateReport
  };
}