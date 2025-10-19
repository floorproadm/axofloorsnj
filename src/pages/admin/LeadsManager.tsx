import { useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { useLeadsExport } from "@/hooks/admin/useLeadsExport";
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
  MapPin
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
};

const statusColors = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-purple-100 text-purple-800 border-purple-200",
  converted: "bg-green-100 text-green-800 border-green-200",
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
  const { leads, stats, isLoading } = useAdminData();
  const { exportToCSV, exportToJSON } = useLeadsExport();

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
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant="outline" 
            className={statusColors[status as keyof typeof statusColors]}
          >
            {status}
          </Badge>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="admin-stat-card admin-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">{stats.totalLeads}</p>
                  <p className="text-white/80 text-sm font-medium">Total de Leads</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="admin-stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">
                    {leads.filter(l => l.status === 'new').length}
                  </p>
                  <p className="text-white/80 text-sm font-medium">Novos</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stat-card bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">
                    {leads.filter(l => l.status === 'contacted').length}
                  </p>
                  <p className="text-white/80 text-sm font-medium">Contatados</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stat-card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">
                    {leads.filter(l => l.status === 'converted').length}
                  </p>
                  <p className="text-white/80 text-sm font-medium">Convertidos</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
