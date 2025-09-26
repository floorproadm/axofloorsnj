import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  FileText, 
  Table, 
  BarChart3,
  Calendar,
  ChevronDown
} from "lucide-react";
import { useLeadsExport } from "@/hooks/admin/useLeadsExport";

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

interface ExportManagerProps {
  leads: Lead[];
  selectedLeads?: Lead[];
  className?: string;
}

export function ExportManager({ leads, selectedLeads, className }: ExportManagerProps) {
  const { exportToCSV, exportToJSON, exportReport, generateReport } = useLeadsExport();
  
  const dataToExport = selectedLeads && selectedLeads.length > 0 ? selectedLeads : leads;
  const hasSelection = selectedLeads && selectedLeads.length > 0;

  const handleExportCSV = () => {
    const filename = hasSelection ? 'leads_selected' : 'leads_all';
    exportToCSV(dataToExport, filename);
  };

  const handleExportJSON = () => {
    const filename = hasSelection ? 'leads_selected' : 'leads_all';
    exportToJSON(dataToExport, filename);
  };

  const handleExportReport = () => {
    const filename = hasSelection ? 'report_selected' : 'report_all';
    exportReport(dataToExport, filename);
  };

  const report = generateReport(dataToExport);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
          {hasSelection && (
            <Badge variant="secondary" className="ml-2">
              {selectedLeads!.length}
            </Badge>
          )}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {/* Export Data */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Exportar Dados</p>
          <p className="text-xs text-muted-foreground">
            {hasSelection ? `${selectedLeads!.length} leads selecionados` : `${leads.length} leads`}
          </p>
        </div>
        
        <DropdownMenuItem onClick={handleExportCSV}>
          <Table className="w-4 h-4 mr-2" />
          Planilha (CSV)
          <Badge variant="outline" className="ml-auto text-xs">
            Excel
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileText className="w-4 h-4 mr-2" />
          Dados (JSON)
          <Badge variant="outline" className="ml-auto text-xs">
            Backup
          </Badge>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Export Reports */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Relatórios</p>
        </div>

        <DropdownMenuItem onClick={handleExportReport}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Relatório Analítico
          <Badge variant="outline" className="ml-auto text-xs">
            JSON
          </Badge>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Quick Stats */}
        <div className="px-2 py-1.5 space-y-1">
          <p className="text-sm font-medium">Resumo Rápido</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-1 font-medium">{report.total_leads}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Conversão:</span>
              <span className="ml-1 font-medium">{report.conversion_rate}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Convertidos:</span>
              <span className="ml-1 font-medium text-green-600">
                {report.by_status.converted || 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Atrasados:</span>
              <span className="ml-1 font-medium text-red-600">
                {report.follow_ups_overdue}
              </span>
            </div>
          </div>
          
          {report.average_budget > 0 && (
            <div className="pt-1 border-t">
              <span className="text-muted-foreground">Ticket médio:</span>
              <span className="ml-1 font-medium">
                ${report.average_budget.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}