import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Handshake,
  Plus,
  Search,
  Building,
  Phone,
  MapPin,
  ArrowUpRight,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import {
  usePartnersData,
  Partner,
  PARTNER_TYPES,
  PARTNER_STATUSES,
  SERVICE_ZONES,
} from "@/hooks/admin/usePartnersData";
import { NewPartnerDialog } from "@/components/admin/NewPartnerDialog";
import { PartnerDetailModal } from "@/components/admin/PartnerDetailModal";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  prospect: "bg-blue-500/10 text-blue-700 border-blue-200",
  inactive: "bg-amber-500/10 text-amber-700 border-amber-200",
  churned: "bg-red-500/10 text-red-700 border-red-200",
};

export default function Partners() {
  const { partners, isLoading } = usePartnersData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(null);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (search && !`${p.company_name} ${p.contact_name}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && p.partner_type !== typeFilter) return false;
      if (zoneFilter !== "all" && p.service_zone !== zoneFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [partners, search, typeFilter, zoneFilter, statusFilter]);

  // Stats
  const totalPartners = partners.length;
  const activePartners = partners.filter((p) => p.status === "active").length;
  const totalReferrals = partners.reduce((s, p) => s + p.total_referrals, 0);
  const totalConverted = partners.reduce((s, p) => s + p.total_converted, 0);
  const atRisk = partners.filter((p) => {
    if (p.status !== "active") return false;
    if (!p.last_contacted_at) return true;
    return !isAfter(new Date(p.last_contacted_at), subDays(new Date(), 30));
  }).length;

  return (
    <AdminLayout title="Partners">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Handshake className="w-5 h-5 text-primary" />} label="Total" value={totalPartners} sub={`${activePartners} ativos`} />
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Indicações" value={totalReferrals} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} label="Conversão" value={totalReferrals > 0 ? `${Math.round((totalConverted / totalReferrals) * 100)}%` : "—"} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} label="Em Risco" value={atRisk} sub="sem contato 30d+" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            {Object.entries(PARTNER_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Zona" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Zonas</SelectItem>
            {Object.entries(SERVICE_ZONES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(PARTNER_STATUSES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setNewOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Partner
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Handshake className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum partner encontrado</p>
          <p className="text-sm mt-1">Crie o primeiro parceiro para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full text-left bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground truncate">{p.company_name}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[p.status] || ""}`}>
                      {PARTNER_STATUSES[p.status] || p.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{p.contact_name}</span>
                    {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{SERVICE_ZONES[p.service_zone] || p.service_zone}</span>
                    <Badge variant="secondary" className="text-[10px]">{PARTNER_TYPES[p.partner_type] || p.partner_type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-foreground">{p.total_referrals}</p>
                    <p className="text-[10px] text-muted-foreground">Refs</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <NewPartnerDialog open={newOpen} onOpenChange={setNewOpen} />
      <PartnerDetailModal partner={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
