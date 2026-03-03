import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Handshake, Plus, Search, List, LayoutGrid } from "lucide-react";
import {
  usePartnersData,
  Partner,
  PARTNER_TYPES,
  PARTNER_STATUSES,
} from "@/hooks/admin/usePartnersData";
import { NewPartnerDialog } from "@/components/admin/NewPartnerDialog";
import { PartnerListItem } from "@/components/admin/PartnerListItem";
import { PartnerDetailPanel } from "@/components/admin/PartnerDetailPanel";
import { PartnerPipelineBoard } from "@/components/admin/PartnerPipelineBoard";
import { PartnerControlModal } from "@/components/admin/PartnerControlModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Partners() {
  const { partners, isLoading } = usePartnersData();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [controlModalId, setControlModalId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const handleViewMode = (mode: "list" | "board") => {
    setViewMode(mode);
    if (mode === "board") {
      setStatusFilter("all");
    } else {
      setStatusFilter("active");
    }
  };

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (
        search &&
        !`${p.company_name} ${p.contact_name}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (typeFilter !== "all" && p.partner_type !== typeFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [partners, search, typeFilter, statusFilter]);

  const miniStats = useMemo(() => {
    const active = partners.filter((p) => p.status === "active").length;
    const atRisk = partners.filter(
      (p) =>
        p.status === "active" &&
        (!p.last_contacted_at ||
          new Date(p.last_contacted_at) < new Date(Date.now() - 30 * 86400000))
    ).length;
    const totalReferrals = partners.reduce((s, p) => s + p.total_referrals, 0);
    return { active, atRisk, totalReferrals };
  }, [partners]);
  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === selectedId) || null,
    [partners, selectedId]
  );
  const controlModalPartner = useMemo(
    () => partners.find((p) => p.id === controlModalId) || null,
    [partners, controlModalId]
  );

  // No auto-select: detail panel only opens on click

  // Clear selection if partner was deleted
  useEffect(() => {
    if (selectedId && !partners.find((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [partners, selectedId]);

  // If a partner is selected, show full-screen detail
  if (selectedPartner) {
    return (
      <AdminLayout title="Partners">
        <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border/50 bg-card">
          <PartnerDetailPanel
            key={selectedPartner.id}
            partner={selectedPartner}
            onClose={() => setSelectedId(null)}
          />
        </div>
        <NewPartnerDialog open={newOpen} onOpenChange={setNewOpen} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Partners">
      <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Mini Stats + View Toggle */}
        <div className="px-3 pt-3 pb-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{miniStats.active}</strong> ativos</span>
          <span className="text-border">|</span>
          <span className={miniStats.atRisk > 0 ? "text-amber-600" : ""}>
            <strong className={miniStats.atRisk > 0 ? "text-amber-600" : "text-foreground"}>{miniStats.atRisk}</strong> em risco
          </span>
          <span className="text-border">|</span>
          <span><strong className="text-foreground">{miniStats.totalReferrals}</strong> indicações</span>
          <div className="ml-auto flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => handleViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleViewMode("board")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "board" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3 space-y-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(PARTNER_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(PARTNER_STATUSES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {viewMode === "list" && (
            <Button
              onClick={() => setNewOpen(true)}
              className="w-full h-9 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" /> Novo Partner
            </Button>
          )}
        </div>

        {/* Content: List or Board */}
        {viewMode === "board" ? (
          <PartnerPipelineBoard
            partners={filtered}
            onSelectPartner={(id) => setControlModalId(id)}
            onNewPartner={() => setNewOpen(true)}
          />
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Handshake className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Nenhum partner</p>
                  </div>
                ) : (
                  filtered.map((p) => (
                    <PartnerListItem
                      key={p.id}
                      partner={p}
                      isSelected={false}
                      onSelect={() => setSelectedId(p.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="px-3 py-2 border-t border-border/50 text-xs text-muted-foreground">
              {filtered.length} de {partners.length} partners
            </div>
          </>
        )}
      </div>

      <NewPartnerDialog open={newOpen} onOpenChange={setNewOpen} />
      <PartnerControlModal
        partner={controlModalPartner}
        open={!!controlModalId}
        onOpenChange={(open) => { if (!open) setControlModalId(null); }}
        onViewDetails={(id) => { setControlModalId(null); setSelectedId(id); }}
      />
    </AdminLayout>
  );
}
