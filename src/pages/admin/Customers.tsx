import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2, CalendarIcon, X, Search, SlidersHorizontal, Plus } from "lucide-react";
import { CustomerDetailSheet } from "@/components/admin/CustomerDetailSheet";
import { CreateCustomerSheet } from "@/components/admin/CreateCustomerSheet";
import { CustomerPortalShareDialog } from "@/components/admin/CustomerPortalShareDialog";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  notes: string | null;
  created_at: string;
}

interface Project {
  id: string;
  customer_id: string | null;
  project_type: string;
  project_status: string;
  created_at: string;
}

interface CustomerWithMeta extends Customer {
  projects: Project[];
  latestProjectStatus: string | null;
}

const statusColor = (s: string) => {
  const k = s.toLowerCase();
  if (k.includes("paid") || k.includes("complet")) return "bg-emerald-500/15 text-emerald-600";
  if (k.includes("progress") || k.includes("schedul") || k.includes("in progress")) return "bg-blue-500/15 text-blue-600";
  if (k.includes("await") || k.includes("pending") || k.includes("draft") || k.includes("planning"))
    return "bg-amber-500/15 text-amber-600";
  if (k.includes("cancel") || k.includes("overdue")) return "bg-red-500/15 text-red-600";
  return "bg-muted text-muted-foreground";
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Applied filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Mobile draft filters
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<string>("all");
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(undefined);

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, projRes] = await Promise.all([
          supabase
            .from("customers")
            .select("id, full_name, email, phone, address, city, zip_code, notes, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("projects")
            .select("id, customer_id, project_type, project_status, created_at")
            .order("created_at", { ascending: false }),
        ]);

        if (custRes.error) throw custRes.error;
        if (projRes.error) throw projRes.error;

        setCustomers((custRes.data as unknown as Customer[]) || []);
        setProjects((projRes.data as unknown as Project[]) || []);
      } catch (err: any) {
        toast({
          title: "Erro ao carregar dados",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const customersWithMeta: CustomerWithMeta[] = useMemo(() => {
    const projByCust = new Map<string, Project[]>();
    for (const p of projects) {
      if (!p.customer_id) continue;
      const list = projByCust.get(p.customer_id) || [];
      list.push(p);
      projByCust.set(p.customer_id, list);
    }

    return customers.map((c) => {
      const cp = projByCust.get(c.id) || [];
      return {
        ...c,
        projects: cp,
        latestProjectStatus: cp.length > 0 ? cp[0].project_status : null,
      };
    });
  }, [customers, projects]);

  const filteredData = useMemo(() => {
    let data = [...customersWithMeta];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q) ||
          (c.address || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter(
        (c) =>
          c.projects.some((p) =>
            p.project_status.toLowerCase() === statusFilter.toLowerCase()
          )
      );
    }

    if (dateRange?.from) {
      const from = new Date(dateRange.from).setHours(0, 0, 0, 0);
      data = data.filter((c) => new Date(c.created_at).getTime() >= from);
    }
    if (dateRange?.to) {
      const to = new Date(dateRange.to).setHours(23, 59, 59, 999);
      data = data.filter((c) => new Date(c.created_at).getTime() <= to);
    }

    return data;
  }, [customersWithMeta, search, statusFilter, dateRange]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set<string>();
    for (const p of projects) {
      if (p.project_status) s.add(p.project_status);
    }
    return Array.from(s).sort();
  }, [projects]);

  const handleDelete = async (customer: CustomerWithMeta) => {
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (error) {
      toast({ title: "Erro ao remover cliente", description: error.message, variant: "destructive" });
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    toast({ title: "Cliente removido com sucesso" });
  };

  const columns: ColumnDef<CustomerWithMeta>[] = [
    {
      accessorKey: "full_name",
      header: "Nome",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.full_name || "Sem nome"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "city",
      header: "Cidade",
      cell: ({ row }) =>
        [row.original.city, row.original.zip_code].filter(Boolean).join(" ") || "—",
    },
    {
      accessorKey: "latestProjectStatus",
      header: "Status do Projeto",
      cell: ({ row }) => {
        const status = row.original.latestProjectStatus;
        if (!status) return <span className="text-muted-foreground text-xs">Sem projeto</span>;
        return (
          <Badge className={statusColor(status)} variant="secondary">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Data de cadastro",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("pt-BR"),
    },
  ];

  const activeFilterCount =
    (search ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (dateRange?.from || dateRange?.to ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const applyMobileFilters = () => {
    setSearch(draftSearch);
    setStatusFilter(draftStatus);
    setDateRange(draftDateRange);
    setMobileOpen(false);
  };

  const clearMobileFilters = () => {
    setDraftSearch("");
    setDraftStatus("all");
    setDraftDateRange(undefined);
    setSearch("");
    setStatusFilter("all");
    setDateRange(undefined);
    setMobileOpen(false);
  };

  const openMobileFilters = () => {
    setDraftSearch(search);
    setDraftStatus(statusFilter);
    setDraftDateRange(dateRange);
    setMobileOpen(true);
  };

  return (
    <AdminLayout title="Clientes">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-[hsl(var(--gold-warm))]" />
              Clientes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Base de clientes ativos e histórico
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto self-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar cliente
          </Button>
        </div>

        {/* Desktop Filters Bar */}
        {!isMobile && (
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10">
                  <SelectValue placeholder="Status do projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {uniqueStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-10 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span className="text-muted-foreground">Faixa de data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setDateRange(undefined);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Mobile Expandable Filter Panel */}
        {isMobile && (
          <Collapsible open={mobileOpen} onOpenChange={setMobileOpen}>
            <Card className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {hasActiveFilters ? (
                    <div className="flex flex-wrap gap-1.5">
                      {search && (
                        <Badge variant="secondary" className="text-xs">
                          <Search className="w-3 h-3 mr-1" />
                          {search.length > 12 ? search.slice(0, 12) + "…" : search}
                        </Badge>
                      )}
                      {statusFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          {statusFilter}
                        </Badge>
                      )}
                      {dateRange?.from && (
                        <Badge variant="secondary" className="text-xs">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {format(dateRange.from, "dd/MM")}
                          {dateRange.to && ` - ${format(dateRange.to, "dd/MM")}`}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem filtros ativos</span>
                  )}
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => !mobileOpen && openMobileFilters()}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome, email, telefone..."
                        value={draftSearch}
                        onChange={(e) => setDraftSearch(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Status do projeto</label>
                    <Select value={draftStatus} onValueChange={setDraftStatus}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {uniqueStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Período de cadastro</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {draftDateRange?.from ? (
                            draftDateRange.to ? (
                              <>
                                {format(draftDateRange.from, "dd/MM/yyyy")} -{" "}
                                {format(draftDateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(draftDateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span className="text-muted-foreground">Selecionar datas</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={draftDateRange?.from}
                          selected={draftDateRange}
                          onSelect={setDraftDateRange}
                          numberOfMonths={1}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 h-10" onClick={applyMobileFilters}>
                      Aplicar filtros
                    </Button>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" className="h-10 px-3" onClick={clearMobileFilters}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            title={`Clientes${filteredData.length !== customersWithMeta.length ? ` (${filteredData.length}/${customersWithMeta.length})` : ""}`}
            searchable={false}
            onRowClick={(row) => {
              navigate(`/admin/customers/${row.id}`);
            }}
            onRowDelete={handleDelete}
            pageSize={10}
          />
        )}

        <CustomerDetailSheet
          customer={selected}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDeleted={(id) => {
            setCustomers((prev) => prev.filter((c) => c.id !== id));
            setSelected(null);
          }}
        />

        <CreateCustomerSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(customer) => {
            setCustomers((prev) => [customer, ...prev]);
          }}
        />
      </div>
    </AdminLayout>
  );
}
