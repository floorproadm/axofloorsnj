import { useMemo, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { useLeadsExport } from "@/hooks/admin/useLeadsExport";
import { LeadPipelineStatus } from "@/components/admin/LeadPipelineStatus";
import { STAGE_LABELS, type PipelineStage } from "@/hooks/useLeadPipeline";
import { LeadFollowUpAlert } from "@/components/admin/LeadFollowUpAlert";
import { JobProofUploader } from "@/components/admin/JobProofUploader";
import { Bell, Camera } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  Tag,
  Home
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  city?: string;
  created_at: string;
  notes?: string;
  follow_up_required?: boolean;
  next_action_date?: string;
  follow_up_actions?: { date: string; action: string; notes?: string }[];
  converted_to_project_id?: string;
};

const statusColors: Record<PipelineStage, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  quoted: "bg-purple-100 text-purple-800 border-purple-200",
  won: "bg-green-100 text-green-800 border-green-200",
  lost: "bg-red-100 text-red-800 border-red-200"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-orange-100 text-orange-800 border-orange-200",
  high: "bg-red-100 text-red-800 border-red-200"
};

const sourceLabels: Record<string, string> = {
  quiz: "Quiz",
  contact_form: "Formulário de Contato",
  contact_page: "Página de Contato",
  builders_page: "Página Builders",
  realtors_page: "Página Realtors",
  lead_magnet: "Lead Magnet"
};

export default function LeadsManager() {
  const { leads, stats, isLoading, refreshData } = useAdminData();
  const { exportToCSV, exportToJSON } = useLeadsExport();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const columns: ColumnDef<Lead>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string | undefined;
        return email ? (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <a href={`mailto:${email}`} className="text-primary hover:underline">
              {email}
            </a>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <a href={`tel:${row.getValue("phone")}`} className="text-primary hover:underline">
            {row.getValue("phone")}
          </a>
        </div>
      ),
    },
    {
      accessorKey: "lead_source",
      header: "Origem",
      cell: ({ row }) => {
        const source = row.getValue("lead_source") as string;
        return (
          <Badge variant="outline" className="text-xs">
            {sourceLabels[source] || source}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status (Pipeline)",
      cell: ({ row }) => {
        const leadId = row.original.id;
        const status = row.getValue("status") as string;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <LeadPipelineStatus 
              leadId={leadId}
              currentStatus={status}
              onStatusChange={handleStatusChange}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        return (
          <Badge 
            variant="outline" 
            className={priorityColors[priority as keyof typeof priorityColors]}
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      id: "follow_up",
      header: "Follow-Up",
      cell: ({ row }) => {
        const lead = row.original;
        if (lead.status !== 'quoted') return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <LeadFollowUpAlert lead={lead} compact onUpdate={handleStatusChange} />
          </div>
        );
      },
    },
    {
      accessorKey: "city",
      header: "Cidade",
      cell: ({ row }) => {
        const city = row.getValue("city") as string | undefined;
        return city ? (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            {city}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        );
      },
    },
    {
      accessorKey: "budget",
      header: "Orçamento",
      cell: ({ row }) => {
        const budget = row.getValue("budget") as number | undefined;
        return budget ? (
          <div className="text-sm font-medium">
            ${budget.toLocaleString()}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {format(new Date(row.getValue("created_at")), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
        );
      },
    },
  ], []);

  const handleExport = () => {
    const timestamp = format(new Date(), "yyyy-MM-dd-HHmm", { locale: ptBR });
    exportToCSV(leads as any, `leads-${timestamp}.csv`);
  };

  return (
    <AdminLayout 
      title="Gerenciamento de Leads" 
      breadcrumbs={[{ label: "Leads" }]}
    >
      <div className="space-y-6 animate-fade-in">

        {/* Data Table */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={leads}
              searchable
              filterable
              exportable
              isLoading={isLoading}
              title="Todos os Leads"
              description="Visualize e gerencie todos os leads capturados através dos formulários e quiz do site"
              onExport={handleExport}
              onRowClick={handleRowClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Lead Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas capturadas do lead
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 py-4">
              {/* Status Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={statusColors[selectedLead.status as PipelineStage] || 'bg-gray-100'}
                >
                  Status: {STAGE_LABELS[selectedLead.status as PipelineStage] || selectedLead.status}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={priorityColors[selectedLead.priority as keyof typeof priorityColors]}
                >
                  Prioridade: {selectedLead.priority}
                </Badge>
                <Badge variant="outline">
                  {sourceLabels[selectedLead.lead_source] || selectedLead.lead_source}
                </Badge>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedLead.name}</p>
                  </div>
                  
                  {selectedLead.email && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </p>
                      <a 
                        href={`mailto:${selectedLead.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedLead.email}
                      </a>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefone
                    </p>
                    <a 
                      href={`tel:${selectedLead.phone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {selectedLead.phone}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location Information */}
              {selectedLead.city && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Localização
                    </h3>
                    <div className="space-y-1">
                      <p className="font-medium">{selectedLead.city}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Project Details */}
              {(selectedLead.services.length > 0 || selectedLead.budget) && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      Detalhes do Projeto
                    </h3>
                    <div className="space-y-4">
                      {selectedLead.services.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Serviços de Interesse
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedLead.services.map((service, idx) => (
                              <Badge key={idx} variant="secondary">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedLead.budget && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Orçamento
                          </p>
                          <p className="font-medium text-lg">
                            ${selectedLead.budget.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Observações
                    </h3>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {selectedLead.notes}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Follow-Up Section - Show for quoted leads */}
              {selectedLead.status === 'quoted' && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Follow-Up Obrigatório
                    </h3>
                    <LeadFollowUpAlert 
                      lead={selectedLead} 
                      onUpdate={() => {
                        refreshData();
                        setIsDetailModalOpen(false);
                      }} 
                    />
                  </div>
                  <Separator />
                </>
              )}

              {/* Job Proof Section - Show for leads with project */}
              {selectedLead.converted_to_project_id && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      Prova de Trabalho (Job Proof)
                    </h3>
                    <JobProofUploader projectId={selectedLead.converted_to_project_id} />
                  </div>
                  <Separator />
                </>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Datas
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">
                      {format(new Date(selectedLead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
