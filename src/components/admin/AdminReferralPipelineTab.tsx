import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, XCircle, Search, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { PARTNER_LEAD_STAGES } from "@/components/partner/PartnerStageBar";

interface ReferralLead {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  budget: number | null;
  status: string;
  created_at: string;
  referred_by_partner_id: string;
  partner_company: string | null;
  partner_contact: string | null;
}

const ACTIVE_STAGES = PARTNER_LEAD_STAGES.filter((s) => s.key !== "completed" && s.key !== "lost");
const formatValue = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`);

export function AdminReferralPipelineTab() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ReferralLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, name, city, phone, budget, status, created_at, referred_by_partner_id, partners:referred_by_partner_id(company_name, contact_name)"
        )
        .not("referred_by_partner_id", "is", null)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) {
        setLeads(
          data.map((l: any) => ({
            id: l.id,
            name: l.name,
            city: l.city,
            phone: l.phone,
            budget: l.budget,
            status: l.status,
            created_at: l.created_at,
            referred_by_partner_id: l.referred_by_partner_id,
            partner_company: l.partners?.company_name ?? null,
            partner_contact: l.partners?.contact_name ?? null,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const partners = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of leads) {
      if (l.referred_by_partner_id && l.partner_company) {
        map.set(l.referred_by_partner_id, l.partner_company);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (partnerFilter !== "all" && l.referred_by_partner_id !== partnerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !`${l.name} ${l.city ?? ""} ${l.partner_company ?? ""}`
            .toLowerCase()
            .includes(q)
        )
          return false;
      }
      return true;
    });
  }, [leads, search, partnerFilter]);

  const grouped = useMemo(() => {
    const m: Record<string, ReferralLead[]> = {};
    for (const l of filtered) (m[l.status] ||= []).push(l);
    return m;
  }, [filtered]);

  const wonLeads = grouped["completed"] || [];
  const lostLeads = grouped["lost"] || [];
  const totalPipelineValue = filtered
    .filter((l) => l.status !== "lost" && l.status !== "completed")
    .reduce((s, l) => s + (l.budget || 0), 0);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header / filters */}
      <div className="px-3 pt-3 pb-2 border-b border-border/50 space-y-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>
            <strong className="text-foreground tabular-nums">{filtered.length}</strong> leads
          </span>
          <span className="text-border">|</span>
          <span>
            <strong className="text-foreground tabular-nums">{formatValue(totalPipelineValue)}</strong> em pipeline
          </span>
          <span className="text-border">|</span>
          <span className="text-emerald-600">
            <strong className="tabular-nums">{wonLeads.length}</strong> won
          </span>
          <span className="text-border">|</span>
          <span>
            <strong className="tabular-nums text-foreground">{partners.length}</strong> parceiros ativos
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead, cidade ou parceiro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger className="h-9 w-[200px] text-xs">
              <SelectValue placeholder="Parceiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos parceiros</SelectItem>
              {partners.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Board */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <Handshake className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhum lead de parceiros</p>
              <p className="text-xs text-muted-foreground mt-1">
                Indicações enviadas pelos parceiros aparecerão aqui.
              </p>
            </Card>
          ) : (
            <>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  {ACTIVE_STAGES.map((stage) => {
                    const items = grouped[stage.key] || [];
                    const stageValue = items.reduce((s, l) => s + (l.budget || 0), 0);
                    return (
                      <div key={stage.key} className="flex-shrink-0 w-[260px]">
                        <div className="mb-2 px-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", stage.dot)} />
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground truncate">
                                {stage.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {items.length}
                            </span>
                          </div>
                          {stageValue > 0 && (
                            <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                              {formatValue(stageValue)} pipeline
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <Card className="p-3 border-dashed bg-muted/20">
                              <p className="text-[11px] text-muted-foreground text-center">Empty</p>
                            </Card>
                          ) : (
                            items.map((lead) => (
                              <Card
                                key={lead.id}
                                onClick={() => navigate(`/admin/leads/${lead.id}`)}
                                className="p-2.5 hover:border-primary/40 transition-colors cursor-pointer"
                              >
                                <p className="text-sm font-semibold truncate leading-tight">
                                  {lead.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {lead.city || lead.phone || "—"}
                                </p>
                                <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium max-w-full">
                                  <Handshake className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate">{lead.partner_company || lead.partner_contact || "Partner"}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {new Date(lead.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  {(lead.budget || 0) > 0 && (
                                    <span className="text-[11px] font-semibold tabular-nums text-foreground">
                                      {formatValue(lead.budget || 0)}
                                    </span>
                                  )}
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(wonLeads.length > 0 || lostLeads.length > 0) && (
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-3 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Won
                      </span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{wonLeads.length}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Convertidos em projetos
                    </p>
                  </Card>
                  <Card className="p-3 bg-muted/40 border-border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Lost
                      </span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-muted-foreground">{lostLeads.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Não convertidos</p>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
