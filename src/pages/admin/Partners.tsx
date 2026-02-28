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
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Handshake, Plus, Search } from "lucide-react";
import {
  usePartnersData,
  Partner,
  PARTNER_TYPES,
  PARTNER_STATUSES,
} from "@/hooks/admin/usePartnersData";
import { NewPartnerDialog } from "@/components/admin/NewPartnerDialog";
import { PartnerListItem } from "@/components/admin/PartnerListItem";
import { PartnerDetailPanel } from "@/components/admin/PartnerDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Partners() {
  const { partners, isLoading } = usePartnersData();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // No auto-select: detail panel only opens on click

  // Clear selection if partner was deleted
  useEffect(() => {
    if (selectedId && !partners.find((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [partners, selectedId]);

  return (
    <AdminLayout title="Partners">
      <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Left Column - List */}
        <div className="flex flex-col w-full md:w-[340px] md:border-r border-border/50 flex-shrink-0">
          {/* Mini Stats */}
          <div className="px-3 pt-3 pb-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{miniStats.active}</strong> ativos</span>
            <span className="text-border">|</span>
            <span className={miniStats.atRisk > 0 ? "text-amber-600" : ""}>
              <strong className={miniStats.atRisk > 0 ? "text-amber-600" : "text-foreground"}>{miniStats.atRisk}</strong> em risco
            </span>
            <span className="text-border">|</span>
            <span><strong className="text-foreground">{miniStats.totalReferrals}</strong> indicações</span>
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
            <Button
              onClick={() => setNewOpen(true)}
              className="w-full h-9 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" /> Novo Partner
            </Button>
          </div>

          {/* Partner List */}
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
                    isSelected={selectedId === p.id}
                    onSelect={() => setSelectedId(p.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Count */}
          <div className="px-3 py-2 border-t border-border/50 text-xs text-muted-foreground">
            {filtered.length} de {partners.length} partners
          </div>
        </div>

        {/* Right Column - Detail (desktop) */}
        {!isMobile && (
          <div className="flex-1 min-w-0 hidden md:flex flex-col">
            {selectedPartner ? (
              <PartnerDetailPanel
                key={selectedPartner.id}
                partner={selectedPartner}
              />
            ) : null}
                  <Handshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Selecione um partner</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          open={!!selectedPartner}
          onOpenChange={(open) => !open && setSelectedId(null)}
        >
          <DrawerContent className="h-[90vh]">
            {selectedPartner && (
              <PartnerDetailPanel
                key={selectedPartner.id}
                partner={selectedPartner}
                onClose={() => setSelectedId(null)}
              />
            )}
          </DrawerContent>
        </Drawer>
      )}

      <NewPartnerDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
}
