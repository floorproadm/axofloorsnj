import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { KanbanBoard } from "./components/KanbanBoard";
import { AdvancedFilters, FilterOptions } from "./components/AdvancedFilters";
import { FollowUpSystem } from "./components/FollowUpSystem";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { 
  LayoutGrid, 
  Table, 
  Calendar,
  Download,
  Plus,
  Phone,
  Mail
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ExportManager } from "./components/ExportManager";

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
  notes?: string;
}

export default function LeadsManager() {
  const { shouldShowLoading, canAccessAdmin } = useAdminAuth();
  const { leads, isLoading, refreshData } = useAdminData();
  const [currentView, setCurrentView] = useState<'kanban' | 'table' | 'followup'>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: [],
    priority: [],
    source: [],
    services: [],
    city: [],
    budgetMin: undefined,
    budgetMax: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    followUpOverdue: false,
    notContacted: false
  });

  // Filter leads based on current filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          lead.name.toLowerCase().includes(searchTerm) ||
          lead.phone.includes(searchTerm) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(lead.priority)) {
        return false;
      }

      // Source filter
      if (filters.source.length > 0 && !filters.source.includes(lead.lead_source)) {
        return false;
      }

      // City filter
      if (filters.city.length > 0 && lead.city && !filters.city.includes(lead.city)) {
        return false;
      }

      // Budget filter
      if (filters.budgetMin && lead.budget && lead.budget < filters.budgetMin) {
        return false;
      }
      if (filters.budgetMax && lead.budget && lead.budget > filters.budgetMax) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const leadDate = new Date(lead.created_at);
        if (leadDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const leadDate = new Date(lead.created_at);
        if (leadDate > filters.dateTo) return false;
      }

      // Quick filters
      if (filters.notContacted && lead.last_contacted_at) {
        return false;
      }
      if (filters.followUpOverdue) {
        if (!lead.follow_up_date) return false;
        const followUpDate = new Date(lead.follow_up_date);
        const now = new Date();
        if (followUpDate >= now) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Get available filter options from data
  const availableOptions = useMemo(() => {
    const cities = [...new Set(leads.map(lead => lead.city).filter(Boolean))];
    const services = [...new Set(leads.flatMap(lead => lead.services || []))];
    const sources = [...new Set(leads.map(lead => lead.lead_source))];

    return { cities, services, sources };
  }, [leads]);

  // Handle lead updates
  const handleLeadUpdate = (updatedLead: Lead) => {
    refreshData(); // Refresh the data to get updated state
  };

  // Table columns for DataTable view
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">{row.original.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors = {
          'new': 'bg-blue-100 text-blue-800',
          'contacted': 'bg-yellow-100 text-yellow-800',
          'qualified': 'bg-purple-100 text-purple-800',
          'proposal': 'bg-orange-100 text-orange-800',
          'converted': 'bg-green-100 text-green-800',
          'lost': 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lead_source",
      header: "Fonte",
      cell: ({ row }) => (
        <Badge variant="outline">
          {(row.getValue("lead_source") as string).replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        const priorityColors = {
          'high': 'bg-red-100 text-red-800',
          'medium': 'bg-yellow-100 text-yellow-800',
          'low': 'bg-green-100 text-green-800'
        };
        return (
          <Badge className={priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "budget",
      header: "Orçamento",
      cell: ({ row }) => {
        const budget = row.getValue("budget") as number;
        return budget ? `$${budget.toLocaleString()}` : '-';
      },
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString('pt-BR');
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Phone className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null; // useAdminAuth já redirecionou
  }

  return (
    <AdminLayout 
      title="CRM Avançado" 
      breadcrumbs={[{ label: "CRM Avançado" }]}
    >
      <div className="space-y-6">
        {/* Header with View Toggle and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as typeof currentView)}>
              <TabsList>
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Tabela
                </TabsTrigger>
                <TabsTrigger value="followup" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Follow-up
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <ExportManager leads={filteredLeads} />
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableOptions={availableOptions}
          totalResults={filteredLeads.length}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* Content based on current view */}
        <Tabs value={currentView} className="space-y-6">
          <TabsContent value="kanban" className="space-y-0">
            <KanbanBoard 
              leads={filteredLeads}
              onLeadUpdate={handleLeadUpdate}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="table" className="space-y-0">
            <DataTable
              columns={columns}
              data={filteredLeads}
              title="Gestão de Leads"
              description="Visualização completa de todos os leads em formato de tabela"
              searchable={false} // Search is handled by AdvancedFilters
              isLoading={isLoading}
              exportable={true}
            />
          </TabsContent>

          <TabsContent value="followup" className="space-y-0">
            <FollowUpSystem 
              leads={filteredLeads}
              onLeadUpdate={handleLeadUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}