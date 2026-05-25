import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AXO_ORG_ID } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, Truck, Users, Phone, Mail,
  Loader2, Trash2, CheckCircle2, Hammer, ExternalLink, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodSelector, getPeriodRange, type PeriodType } from "@/components/admin/payments/PeriodSelector";
import { useAllLaborEntries, useMarkLaborPaid, useAddLaborEntry } from "@/hooks/useLaborEntries";
import { useCrewEarnings, type CrewMember as CrewMemberType } from "@/hooks/useCrewMembers";

const REGIONS = ["North NJ", "Central NJ", "South NJ", "NYC/Tri-State", "All Regions"];
const EMPLOYMENT_TYPES = ["Head", "Full-Time Employee", "Daily Rate", "Subcontractor"];
const ROLES = [
  "Sanding & Refinishing", "Hardwood Installation", "Vinyl/LVP",
  "Laminate", "Tile", "Demolition", "Trim & Molding", "Supervisor"
];
const VAN_STATUSES = ["Available", "In Use", "Maintenance", "Out of Service"];

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CrewsVans() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"crew" | "vans" | "payroll">(
    (searchParams.get("tab") as any) || "crew"
  );
  const [showNewCrew, setShowNewCrew] = useState(false);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [showNewVan, setShowNewVan] = useState(false);
  const [payrollPeriodType, setPayrollPeriodType] = useState<PeriodType>("month");
  const [payrollAnchor, setPayrollAnchor] = useState(() => new Date());
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">("all");
  const [filterCrew, setFilterCrew] = useState<string>("all");
  const [showNewLabor, setShowNewLabor] = useState(false);
  const [laborForm, setLaborForm] = useState({
    project_id: "", crew_member_id: "", worker_name: "",
    daily_rate: "", days_worked: "1", work_date: new Date().toISOString().split("T")[0],
    is_paid: false, notes: "",
  });

  useEffect(() => {
    if (searchParams.get("new") === "labor") {
      setTab("payroll");
      setShowNewLabor(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [crewForm, setCrewForm] = useState({
    full_name: "", phone: "", email: "", role: "", bio: "",
    employment_type: "", region: "", daily_rate: ""
  });

  const [vanForm, setVanForm] = useState({
    name: "", plate: "", year: "", make: "", model: "",
    region: "", status: "Available", notes: ""
  });

  // ─── Crew queries (with new columns) ───
  const { data: crew = [], isLoading: loadingCrew } = useQuery({
    queryKey: ["crew-members", "full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, bio, avatar_url, daily_rate, employment_type, region, is_active_crew, created_at")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as (CrewMemberType & { created_at: string })[];
    },
  });

  // ─── Van queries ───
  const { data: vanRecords = [], isLoading: loadingVans } = useQuery({
    queryKey: ["van-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, description, notes, amount, payment_date, category, status")
        .eq("category", "fleet")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Payroll: real labor entries + earnings ───
  const payrollRange = getPeriodRange(payrollAnchor, payrollPeriodType);
  const { data: earnings = [] } = useCrewEarnings();
  const { data: laborEntries = [], isLoading: loadingPayroll } = useAllLaborEntries({
    crewMemberId: filterCrew === "all" ? undefined : filterCrew,
    paid: filterPaid === "all" ? null : filterPaid === "paid",
    from: format(payrollRange.start, "yyyy-MM-dd"),
    to: format(payrollRange.end, "yyyy-MM-dd"),
  });
  const { mutateAsync: markPaid } = useMarkLaborPaid();

  const totalLabor = laborEntries.reduce((s: number, e: any) => s + (Number(e.daily_rate) * Number(e.days_worked)), 0);
  const totalPaid = laborEntries.filter((e: any) => e.is_paid).reduce((s: number, e: any) => s + (Number(e.daily_rate) * Number(e.days_worked)), 0);
  const totalUnpaid = totalLabor - totalPaid;

  // Projects list for manual labor entry
  const { data: projectsList = [] } = useQuery({
    queryKey: ["projects-min-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, address, project_status")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { mutateAsync: addLaborEntry, isPending: addingLabor } = useAddLaborEntry();

  // ─── Mutations ───
  const addCrewMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: crewForm.full_name,
        phone: crewForm.phone || null,
        email: crewForm.email || null,
        role: crewForm.role || null,
        daily_rate: crewForm.daily_rate ? parseFloat(crewForm.daily_rate) : 0,
        employment_type: crewForm.employment_type || null,
        region: crewForm.region || null,
        bio: crewForm.bio || null,
      } as any;
      if (editingCrewId) {
        const { error } = await supabase.from("profiles").update(payload).eq("id", editingCrewId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert({ ...payload, is_active_crew: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCrewId ? "Crew member updated" : "Crew member added");
      qc.invalidateQueries({ queryKey: ["crew-members"] });
      qc.invalidateQueries({ queryKey: ["crew-earnings"] });
      setShowNewCrew(false);
      setEditingCrewId(null);
      setCrewForm({ full_name: "", phone: "", email: "", role: "", bio: "", employment_type: "", region: "", daily_rate: "" });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save crew member"),
  });

  const openEditCrew = (m: CrewMemberType) => {
    setEditingCrewId(m.id);
    setCrewForm({
      full_name: m.full_name || "",
      phone: (m as any).phone || "",
      email: (m as any).email || "",
      role: m.role || "",
      bio: (m as any).bio || "",
      employment_type: (m as any).employment_type || "",
      region: (m as any).region || "",
      daily_rate: m.daily_rate ? String(m.daily_rate) : "",
    });
    setShowNewCrew(true);
  };

  const addVanMutation = useMutation({
    mutationFn: async () => {
      const description = [
        vanForm.year, vanForm.make, vanForm.model,
        vanForm.plate && `(${vanForm.plate})`,
        `— ${vanForm.name || "Van"}`
      ].filter(Boolean).join(" ");
      const { error } = await supabase.from("payments").insert({
        amount: 0, category: "fleet", description,
        notes: [vanForm.region && `Region: ${vanForm.region}`, `Status: ${vanForm.status}`, vanForm.notes].filter(Boolean).join(" · ") || null,
        payment_date: new Date().toISOString().split("T")[0],
        status: vanForm.status === "Available" ? "confirmed" : "pending",
        organization_id: AXO_ORG_ID,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Van added to fleet");
      qc.invalidateQueries({ queryKey: ["van-records"] });
      setShowNewVan(false);
      setVanForm({ name: "", plate: "", year: "", make: "", model: "", region: "", status: "Available", notes: "" });
    },
    onError: (e: any) => toast.error(e.message || "Failed to add van"),
  });

  const deleteCrewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").update({ is_active_crew: false } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Marked inactive"); qc.invalidateQueries({ queryKey: ["crew-members"] }); },
  });

  const deleteVanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Van removed"); qc.invalidateQueries({ queryKey: ["van-records"] }); },
  });

  const toggleVanStatus = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: string }) => {
      const next = current === "confirmed" ? "pending" : "confirmed";
      const { error } = await supabase.from("payments").update({ status: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["van-records"] }),
  });

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const roleColors: Record<string, string> = {
    "Sanding & Refinishing": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "Hardwood Installation": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "Supervisor": "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "Tile": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  const handleAddClick = () => {
    if (tab === "crew") setShowNewCrew(true);
    else if (tab === "vans") setShowNewVan(true);
  };

  const addLabel = tab === "crew" ? "Add Worker" : tab === "vans" ? "Add Van" : "";
  const earningsById = new Map(earnings.map(e => [e.crew_member_id, e]));

  return (
    <AdminLayout title="Crews & Fleet">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
              <TabsTrigger value="crew" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1 gap-1.5 text-sm">
                <Users className="w-4 h-4" /> Crew
              </TabsTrigger>
              <TabsTrigger value="payroll" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1 gap-1.5 text-sm">
                <Hammer className="w-4 h-4" /> Payroll
              </TabsTrigger>
              <TabsTrigger value="vans" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1 gap-1.5 text-sm">
                <Truck className="w-4 h-4" /> Fleet
              </TabsTrigger>
            </TabsList>
            {tab !== "payroll" && (
              <Button size="sm" className="w-full sm:w-auto gap-1.5" onClick={handleAddClick}>
                <Plus className="w-4 h-4" /> {addLabel}
              </Button>
            )}
          </div>

          {/* ─── CREW TAB ─── */}
          <TabsContent value="crew" className="mt-4">
            {loadingCrew ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : crew.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <Users className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No crew members yet</p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewCrew(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Worker
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {crew.map((member) => {
                  const e = earningsById.get(member.id);
                  const inactive = member.is_active_crew === false;
                  return (
                    <Card key={member.id} onClick={() => openEditCrew(member)} className={cn("border-border/50 hover:border-primary/30 transition-colors group cursor-pointer", inactive && "opacity-50")}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-sm text-primary">
                            {initials(member.full_name || "?")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{member.full_name}</p>
                              {inactive && <span className="text-[9px] text-muted-foreground uppercase">inactive</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {member.role && (
                                <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", roleColors[member.role] || "")}>
                                  {member.role}
                                </Badge>
                              )}
                              {member.employment_type && (
                                <span className="text-[10px] text-muted-foreground">{member.employment_type}</span>
                              )}
                              {member.daily_rate ? (
                                <span className="text-[10px] tabular-nums text-muted-foreground">· {fmt(Number(member.daily_rate))}/d</span>
                              ) : null}
                            </div>
                            {/* Stats row */}
                            {e && e.jobs_count > 0 && (
                              <div className="mt-2 grid grid-cols-3 gap-1.5 pt-2 border-t border-border/40">
                                <div>
                                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Jobs</p>
                                  <p className="text-xs font-semibold tabular-nums flex items-center gap-1"><Briefcase className="w-2.5 h-2.5" />{e.jobs_count}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Earned</p>
                                  <p className="text-xs font-semibold tabular-nums">{fmt(Number(e.total_earned))}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Owed</p>
                                  <p className={cn("text-xs font-semibold tabular-nums", Number(e.unpaid_amount) > 0 ? "text-amber-500" : "text-muted-foreground")}>
                                    {fmt(Number(e.unpaid_amount))}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {member.phone && (
                                <a href={`tel:${member.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                  <Phone className="w-3 h-3" /> {member.phone}
                                </a>
                              )}
                              {member.email && (
                                <a href={`mailto:${member.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                  <Mail className="w-3 h-3" /> {member.email.split("@")[0]}
                                </a>
                              )}
                            </div>
                          </div>
                          {!inactive && (
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              onClick={(e) => { e.stopPropagation(); deleteCrewMutation.mutate(member.id); }}
                              title="Mark inactive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── VANS TAB ─── */}
          <TabsContent value="vans" className="mt-4">
            {loadingVans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : vanRecords.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <Truck className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No vehicles registered</p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewVan(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Van
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {vanRecords.map((van: any) => {
                  const isAvailable = van.status === "confirmed";
                  return (
                    <Card key={van.id} className="border-border/50 hover:border-primary/30 transition-colors group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          isAvailable ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                        )}>
                          <Truck className={cn("w-5 h-5", isAvailable ? "text-emerald-500" : "text-amber-500")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{van.description ?? "Vehicle"}</p>
                          {van.notes && <p className="text-xs text-muted-foreground truncate">{van.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleVanStatus.mutate({ id: van.id, current: van.status })}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
                              isAvailable
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
                            )}
                          >
                            {isAvailable ? "Available" : "In Use"}
                          </button>
                          <Button size="icon" variant="ghost"
                            className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteVanMutation.mutate(van.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── PAYROLL TAB ─── (reads labor_entries — source of truth) */}
          <TabsContent value="payroll" className="mt-4 space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-muted/30 border border-border/50 p-3">
              <Hammer className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground flex-1">Labor entries are usually created inside each job's <strong>Labor</strong> section. Use the button to log a manual payment.</span>
              <Button size="sm" className="gap-1.5 h-7" onClick={() => setShowNewLabor(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Payment
              </Button>
            </div>

            {/* Period selector */}
            <div className="flex flex-col items-center gap-2">
              <PeriodSelector
                periodType={payrollPeriodType}
                onPeriodTypeChange={setPayrollPeriodType}
                anchor={payrollAnchor}
                onAnchorChange={setPayrollAnchor}
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Total Labor", value: fmt(totalLabor), color: "text-foreground" },
                { label: "Paid", value: fmt(totalPaid), color: "text-emerald-500" },
                { label: "Unpaid", value: fmt(totalUnpaid), color: "text-amber-500" },
              ].map((c) => (
                <Card key={c.label} className="border-border/50">
                  <CardContent className="p-2.5 sm:p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{c.label}</p>
                    <p className={cn("text-base sm:text-2xl font-bold truncate tabular-nums", c.color)}>{c.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterCrew} onValueChange={setFilterCrew}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All crew</SelectItem>
                  {crew.filter(c => c.is_active_crew !== false).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPaid} onValueChange={(v) => setFilterPaid(v as any)}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="unpaid">Unpaid only</SelectItem>
                  <SelectItem value="paid">Paid only</SelectItem>
                </SelectContent>
              </Select>
              {totalUnpaid > 0 && filterPaid !== "paid" && (
                <Button size="sm" variant="outline" className="h-8 text-xs ml-auto gap-1"
                  onClick={async () => {
                    const ids = laborEntries.filter((e: any) => !e.is_paid).map((e: any) => e.id);
                    if (!ids.length) return;
                    await markPaid({ ids, paid: true });
                    toast.success(`Marked ${ids.length} entries paid`);
                  }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark all paid ({fmt(totalUnpaid)})
                </Button>
              )}
            </div>

            {/* Entries List */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Entries — {laborEntries.length} records
                </p>
                {loadingPayroll ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : laborEntries.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No labor entries in this period
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {laborEntries.map((entry: any) => {
                      const amount = Number(entry.daily_rate) * Number(entry.days_worked);
                      const project = entry.projects;
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              entry.is_paid ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{entry.worker_name}</p>
                                {entry.crew_member_id && <span className="text-[9px] text-muted-foreground uppercase">crew</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(entry.work_date), "MMM d")}</span>
                                <span className="text-xs text-muted-foreground">· {fmt(Number(entry.daily_rate))} × {entry.days_worked}d</span>
                                {project && (
                                  <Link to={`/admin/jobs/${project.id}`} className="text-xs text-primary hover:underline truncate flex items-center gap-0.5">
                                    {project.customer_name || project.address || 'Job'}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold tabular-nums">{fmt(amount)}</span>
                            {!entry.is_paid ? (
                              <Button size="icon" variant="ghost"
                                className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={async () => { await markPaid({ ids: [entry.id], paid: true }); toast.success('Marked paid'); }}
                                title="Mark paid"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={async () => { await markPaid({ ids: [entry.id], paid: false }); toast.success('Marked unpaid'); }}
                                title="Mark unpaid"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── ADD CREW DIALOG ─── */}
      <Dialog open={showNewCrew} onOpenChange={(o) => { setShowNewCrew(o); if (!o) { setEditingCrewId(null); setCrewForm({ full_name: "", phone: "", email: "", role: "", bio: "", employment_type: "", region: "", daily_rate: "" }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> {editingCrewId ? "Edit Crew Member" : "Add Crew Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input placeholder="e.g. Carlos Silva" value={crewForm.full_name} onChange={e => setCrewForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select value={crewForm.role} onValueChange={v => setCrewForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Employment Type</Label>
                <Select value={crewForm.employment_type} onValueChange={v => setCrewForm(f => ({ ...f, employment_type: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input placeholder="(732) 555-0000" value={crewForm.phone} onChange={e => setCrewForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Daily Rate ($)</Label>
                <Input type="number" placeholder="250" value={crewForm.daily_rate} onChange={e => setCrewForm(f => ({ ...f, daily_rate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={crewForm.region} onValueChange={v => setCrewForm(f => ({ ...f, region: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input placeholder="worker@email.com" value={crewForm.email} onChange={e => setCrewForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Optional notes..." value={crewForm.bio} onChange={e => setCrewForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewCrew(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!crewForm.full_name || addCrewMutation.isPending} onClick={() => addCrewMutation.mutate()}>
                {addCrewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCrewId ? "Save Changes" : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ADD VAN DIALOG ─── */}
      <Dialog open={showNewVan} onOpenChange={setShowNewVan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4" /> Add Vehicle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Van Name / ID *</Label>
                <Input placeholder='e.g. "Van 1"' value={vanForm.name} onChange={e => setVanForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Input placeholder="2022" value={vanForm.year} onChange={e => setVanForm(f => ({ ...f, year: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Make / Model</Label>
                <Input placeholder="Ford Transit" value={vanForm.make} onChange={e => setVanForm(f => ({ ...f, make: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">License Plate</Label>
                <Input placeholder="NJR 1234" value={vanForm.plate} onChange={e => setVanForm(f => ({ ...f, plate: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={vanForm.status} onValueChange={v => setVanForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{VAN_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Insurance, mileage..." value={vanForm.notes} onChange={e => setVanForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewVan(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!vanForm.name || addVanMutation.isPending} onClick={() => addVanMutation.mutate()}>
                {addVanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Van"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ─── ADD MANUAL LABOR PAYMENT DIALOG ─── */}
      <Dialog open={showNewLabor} onOpenChange={(o) => { setShowNewLabor(o); if (!o) setLaborForm({ project_id: "", crew_member_id: "", worker_name: "", daily_rate: "", days_worked: "1", work_date: new Date().toISOString().split("T")[0], is_paid: false, notes: "" }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hammer className="w-4 h-4" /> Add Labor Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Project *</Label>
              <Select value={laborForm.project_id} onValueChange={v => setLaborForm(f => ({ ...f, project_id: v }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projectsList.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.customer_name || p.address || p.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Crew Member</Label>
              <Select
                value={laborForm.crew_member_id || "__none"}
                onValueChange={v => {
                  if (v === "__none") {
                    setLaborForm(f => ({ ...f, crew_member_id: "" }));
                  } else {
                    const m = crew.find(c => c.id === v);
                    setLaborForm(f => ({
                      ...f,
                      crew_member_id: v,
                      worker_name: m?.full_name || f.worker_name,
                      daily_rate: m?.daily_rate ? String(m.daily_rate) : f.daily_rate,
                    }));
                  }
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue placeholder="Pick crew or type manually" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Manual entry —</SelectItem>
                  {crew.filter(c => c.is_active_crew !== false).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Worker Name *</Label>
                <Input placeholder="e.g. Carlos Silva" value={laborForm.worker_name}
                  onChange={e => setLaborForm(f => ({ ...f, worker_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Daily Rate ($) *</Label>
                <Input type="number" placeholder="250" value={laborForm.daily_rate}
                  onChange={e => setLaborForm(f => ({ ...f, daily_rate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Days Worked *</Label>
                <Input type="number" step="0.5" placeholder="1" value={laborForm.days_worked}
                  onChange={e => setLaborForm(f => ({ ...f, days_worked: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Work Date</Label>
                <Input type="date" value={laborForm.work_date}
                  onChange={e => setLaborForm(f => ({ ...f, work_date: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Optional notes..." value={laborForm.notes}
                  onChange={e => setLaborForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-xs cursor-pointer select-none">
                <input type="checkbox" className="rounded" checked={laborForm.is_paid}
                  onChange={e => setLaborForm(f => ({ ...f, is_paid: e.target.checked }))} />
                Already paid
              </label>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/30 p-2.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums">
                {fmt((parseFloat(laborForm.daily_rate) || 0) * (parseFloat(laborForm.days_worked) || 0))}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewLabor(false)}>Cancel</Button>
              <Button className="flex-1"
                disabled={!laborForm.project_id || !laborForm.worker_name || !laborForm.daily_rate || addingLabor}
                onClick={async () => {
                  try {
                    await addLaborEntry({
                      project_id: laborForm.project_id,
                      worker_name: laborForm.worker_name,
                      daily_rate: parseFloat(laborForm.daily_rate) || 0,
                      days_worked: parseFloat(laborForm.days_worked) || 1,
                      work_date: laborForm.work_date,
                      is_paid: laborForm.is_paid,
                      notes: laborForm.notes || undefined,
                      crew_member_id: laborForm.crew_member_id || null,
                    });
                    toast.success("Labor payment added");
                    setShowNewLabor(false);
                    setLaborForm({ project_id: "", crew_member_id: "", worker_name: "", daily_rate: "", days_worked: "1", work_date: new Date().toISOString().split("T")[0], is_paid: false, notes: "" });
                  } catch (e: any) {
                    toast.error(e.message || "Failed to add labor payment");
                  }
                }}>
                {addingLabor ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
