import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Building2,
  Users,
  FolderKanban,
  ListChecks,
  TrendingUp,
  Shield,
  Activity,
  Database,
  Server,
  Copy,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const BG = "#0B1120";
const BLUE = "#0066FF";

type Overview = {
  total_orgs: number;
  active_orgs: number;
  trial_orgs: number;
  starter_orgs: number;
  pro_orgs: number;
  enterprise_orgs: number;
  total_users: number;
  total_projects: number;
  total_leads: number;
  waitlist_leads: number;
  new_orgs_30d: number;
  new_orgs_7d: number;
};

type OrgRow = {
  org_id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  trial_ends_at: string | null;
  onboarded_at: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  project_count: number;
  lead_count: number;
  user_count: number;
};

type WaitlistRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  status: string;
  created_at: string;
};

export default function SPUPanel() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ background: BG }} className="min-h-screen text-white">
      <header
        className="sticky top-0 z-50 backdrop-blur"
        style={{ background: `${BG}cc`, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <Shield className="w-4 h-4" style={{ color: BLUE }} />
            Floor<span style={{ color: BLUE }}>PRO</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70 text-sm font-medium">Platform Admin</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate("/admin/auth");
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orgs">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="diag">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="orgs"><OrgsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="waitlist"><WaitlistTab /></TabsContent>
          <TabsContent value="diag"><DiagnosticsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Overview ---------- */

function OverviewTab() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    supabase.rpc("spu_platform_overview" as any).then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setData(data as Overview);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;
  if (!data) return <div className="text-white/50">No data.</div>;

  const newOrgsByPeriod =
    period === "7d" ? data.new_orgs_7d : period === "30d" ? data.new_orgs_30d : data.total_orgs;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={<Building2 className="w-4 h-4" />} label="Total Organizations" value={data.total_orgs} />
        <Kpi icon={<Activity className="w-4 h-4" />} label="Active Trials" value={data.trial_orgs} />
        <Kpi icon={<Users className="w-4 h-4" />} label="Total Users" value={data.total_users} />
        <Kpi icon={<ListChecks className="w-4 h-4" />} label="Waitlist Leads" value={data.waitlist_leads} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Starter Plan" value={data.starter_orgs} />
        <Kpi label="Pro Plan" value={data.pro_orgs} />
        <Kpi label="Enterprise Plan" value={data.enterprise_orgs} />
        <Kpi label="New Orgs (30d)" value={data.new_orgs_30d} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Platform Totals" icon={<TrendingUp className="w-4 h-4" />}>
          <Row label="Total Projects" value={data.total_projects} />
          <Row label="Total Leads" value={data.total_leads} />
          <Row label="Total Users" value={data.total_users} />
        </Card>
        <Card
          title="Growth"
          icon={<TrendingUp className="w-4 h-4" />}
          right={
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="all">All-time</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <Row label="New Orgs (7d)" value={data.new_orgs_7d} />
          <Row label="New Orgs (30d)" value={data.new_orgs_30d} />
          <Row label="All Time" value={data.total_orgs} />
          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
            Showing <span className="text-white">{newOrgsByPeriod}</span> for selected period.
          </div>
        </Card>
      </div>

    </div>
  );
}

/* ---------- Users ---------- */

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  organization_id: string | null;
  organization_name: string | null;
  org_role: string | null;
  roles: string[];
};

function UsersTab() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    supabase.rpc("spu_users_list" as any).then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setRows((data as UserRow[]) || []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.organization_id && r.organization_name) map.set(r.organization_id, r.organization_name);
    });
    return Array.from(map.entries());
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (orgFilter === "none" && r.organization_id) return false;
      if (orgFilter !== "all" && orgFilter !== "none" && r.organization_id !== orgFilter) return false;
      if (q && !`${r.full_name ?? ""} ${r.email ?? ""} ${r.organization_name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, orgFilter]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search name, email or org…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-white/5 border-white/10 text-white"
        />
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-56 bg-white/5 border-white/10"><SelectValue placeholder="Organization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organizations</SelectItem>
            <SelectItem value="none">No organization</SelectItem>
            {orgOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-white/50 tabular-nums">{filtered.length} / {rows.length}</div>
      </div>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] uppercase tracking-wider text-white/50 bg-white/[0.03] border-b border-white/10">
          <div className="col-span-3">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-3">Organization</div>
          <div className="col-span-2">Roles</div>
          <div className="col-span-1 text-right">Joined</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50">No users match.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((u) => (
              <div
                key={u.user_id}
                onClick={() => setViewUserId(u.user_id)}
                className="grid grid-cols-12 gap-3 px-4 py-3 text-sm items-center cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                <div className="col-span-3 min-w-0">
                  <div className="font-medium truncate">{u.full_name ?? "—"}</div>
                  {u.phone && <div className="text-xs text-white/50 truncate">{u.phone}</div>}
                </div>
                <div className="col-span-3 text-white/80 text-xs truncate">{u.email ?? "—"}</div>
                <div className="col-span-3 min-w-0">
                  {u.organization_name ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{u.organization_name}</span>
                      {u.org_role && (
                        <Badge variant="outline" className="border-white/20 text-white/70 text-[10px] capitalize shrink-0">
                          {u.org_role}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-300/90 text-[10px]">no organization</Badge>
                  )}
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {u.roles.length === 0 ? (
                    <span className="text-[11px] text-white/40">—</span>
                  ) : (
                    u.roles.map((r) => (
                      <Badge key={r} variant="outline" className="border-white/20 text-white/70 text-[10px]">{r}</Badge>
                    ))
                  )}
                </div>
                <div className="col-span-1 text-right text-xs text-white/50 tabular-nums">{fmtDate(u.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserDetailModal
        userId={viewUserId}
        onClose={() => setViewUserId(null)}
        onMutated={load}
        orgs={orgOptions}
      />
    </div>
  );
}

/* ---------- Organizations ---------- */

function OrgsTab() {
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewOrgId, setViewOrgId] = useState<string | null>(null);


  const load = () => {
    setLoading(true);
    supabase.rpc("spu_organizations_list" as any).then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setRows((data || []) as OrgRow[]);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (planFilter !== "all" && r.plan !== planFilter) return false;
      const status = computeStatus(r);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (q && !`${r.name} ${r.owner_email ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, planFilter, statusFilter]);

  const updatePlan = async (org_id: string, plan: string) => {
    const { error } = await supabase.from("organizations").update({ plan: plan as any }).eq("id", org_id);
    if (error) return toast.error(error.message);
    toast.success(`Plan updated to ${plan}`);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-white/5 border-white/10 text-white"
        />
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-white/50 self-center">{filtered.length} / {rows.length}</div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/60 text-xs uppercase tracking-wider">
              <tr>
                <Th>Company</Th>
                <Th>Owner</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th className="text-right">Users</Th>
                <Th className="text-right">Projects</Th>
                <Th className="text-right">Leads</Th>
                <Th>Trial ends</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = computeStatus(r);
                return (
                  <tr key={r.org_id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <Td>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-white/40">{r.slug}</div>
                    </Td>
                    <Td className="text-white/80">{r.owner_email ?? "—"}</Td>
                    <Td><PlanBadge plan={r.plan} /></Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td className="text-right tabular-nums">{r.user_count}</Td>
                    <Td className="text-right tabular-nums">{r.project_count}</Td>
                    <Td className="text-right tabular-nums">{r.lead_count}</Td>
                    <Td className="text-white/70">{fmtDate(r.trial_ends_at)}</Td>
                    <Td className="text-white/70">{fmtDate(r.created_at)}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewOrgId(r.org_id)}
                          className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/10"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Select value={r.plan} onValueChange={(v) => updatePlan(r.org_id, v)}>
                          <SelectTrigger className="h-8 w-28 bg-white/5 border-white/10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-white/40">No organizations match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrgDetailModal orgId={viewOrgId} onClose={() => setViewOrgId(null)} />
    </div>
  );
}

function computeStatus(r: OrgRow): "active" | "trial" | "inactive" {
  if (!r.is_active) return "inactive";
  if (r.trial_ends_at && new Date(r.trial_ends_at) > new Date()) return "trial";
  return "active";
}

/* ---------- Waitlist ---------- */

function WaitlistTab() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    supabase.rpc("spu_waitlist_list" as any).then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setRows((data || []) as WaitlistRow[]);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const markContacted = async (id: string) => {
    const { error } = await supabase.from("leads").update({ status: "warm_lead" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as contacted");
    load();
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied");
  };

  const exportCsv = () => {
    const headers = ["name", "email", "phone", "state", "company_team", "status", "created_at"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [r.name, r.email, r.phone, r.city, r.notes, r.status, r.created_at]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `floorpro-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-12 text-center">
        <ListChecks className="w-10 h-10 mx-auto text-white/30 mb-3" />
        <p className="text-white/70">No waitlist leads yet.</p>
        <p className="text-sm text-white/40 mt-1">Share getfloorpro.com to start collecting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-white/60">{rows.length} waitlist {rows.length === 1 ? "lead" : "leads"}</div>
        <Button size="sm" variant="outline" onClick={exportCsv} className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/60 text-xs uppercase tracking-wider">
              <tr>
                <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>State</Th>
                <Th>Company / Team</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <Td className="font-medium">{r.name}</Td>
                  <Td className="text-white/80">{r.email}</Td>
                  <Td className="text-white/70">{r.phone}</Td>
                  <Td className="text-white/70">{r.city}</Td>
                  <Td className="text-white/70 max-w-xs truncate">{r.notes}</Td>
                  <Td><Badge variant="outline" className="border-white/20 text-white/80">{r.status}</Badge></Td>
                  <Td className="text-white/70">{fmtDate(r.created_at)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copyEmail(r.email)} className="h-7 px-2 text-white/70 hover:text-white hover:bg-white/10">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      {r.status === "cold_lead" && (
                        <Button size="sm" variant="ghost" onClick={() => markContacted(r.id)} className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10">
                          Mark contacted
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Diagnostics ---------- */

function DiagnosticsTab() {
  return (
    <Tabs defaultValue="rpc" className="space-y-4">
      <TabsList className="bg-white/5 border border-white/10">
        <TabsTrigger value="rpc">RPC Tests</TabsTrigger>
        <TabsTrigger value="db">DB Health</TabsTrigger>
        <TabsTrigger value="edge">Edge Functions</TabsTrigger>
      </TabsList>
      <TabsContent value="rpc"><RpcTests /></TabsContent>
      <TabsContent value="db"><DbHealth /></TabsContent>
      <TabsContent value="edge"><EdgeList /></TabsContent>
    </Tabs>
  );
}

function RpcTests() {
  const [results, setResults] = useState<Array<{ name: string; ok: boolean; ms: number; rows: number; preview: string }>>([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const rpcs = ["spu_platform_overview", "spu_organizations_list", "spu_waitlist_list"];
    const out: typeof results = [];
    for (const name of rpcs) {
      const t0 = performance.now();
      const { data, error } = await supabase.rpc(name as any);
      const ms = Math.round(performance.now() - t0);
      const rows = Array.isArray(data) ? data.length : data ? 1 : 0;
      out.push({
        name,
        ok: !error,
        ms,
        rows,
        preview: error ? error.message : JSON.stringify(data).slice(0, 120),
      });
    }
    setResults(out);
    setRunning(false);
  };

  useEffect(() => { run(); }, []);

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={run} disabled={running} style={{ background: BLUE }} className="text-white">
        {running ? "Running…" : "Run RPC tests"}
      </Button>
      <div className="rounded-xl border border-white/10 divide-y divide-white/5">
        {results.map((r) => (
          <div key={r.name} className="p-4 flex items-start gap-3">
            {r.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <code className="text-sm">{r.name}</code>
                <div className="text-xs text-white/50 tabular-nums">{r.ms}ms · {r.rows} {r.rows === 1 ? "row" : "rows"}</div>
              </div>
              <div className="text-xs text-white/50 mt-1 truncate font-mono">{r.preview}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DbHealth() {
  const [counts, setCounts] = useState<{ orgs: number; profiles: number; leads: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from("organizations").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ orgs: a.count ?? 0, profiles: b.count ?? 0, leads: c.count ?? 0 });
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Kpi icon={<Database className="w-4 h-4" />} label="Organizations" value={counts!.orgs} />
      <Kpi icon={<Users className="w-4 h-4" />} label="Profiles" value={counts!.profiles} />
      <Kpi icon={<FolderKanban className="w-4 h-4" />} label="Leads" value={counts!.leads} />
      <div className="md:col-span-3 rounded-xl border border-white/10 p-4 text-sm text-white/70">
        <div className="font-medium text-white mb-1 flex items-center gap-2"><Shield className="w-4 h-4" /> RLS Test</div>
        Non-platform-admin callers receive <code className="text-xs bg-white/10 px-1 rounded">unauthorized</code> from <code className="text-xs">spu_*</code> RPCs (enforced inside each SECURITY DEFINER function).
      </div>
    </div>
  );
}

function EdgeList() {
  // Static list (we can't enumerate deployed functions client-side without service role).
  const fns = [
    "notify-new-lead",
    "notify-partner-lead-progress",
    "reputation-request",
    "send-team-invite",
  ];
  return (
    <div className="rounded-xl border border-white/10 divide-y divide-white/5">
      {fns.map((name) => (
        <div key={name} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-4 h-4 text-white/50" />
            <code className="text-sm">{name}</code>
          </div>
          <Badge variant="outline" className="border-white/20 text-white/60 text-xs">deployed</Badge>
        </div>
      ))}
      <div className="p-3 text-xs text-white/40">
        Last-invocation tracking requires logs access — view in backend console.
      </div>
    </div>
  );
}

/* ---------- Org Detail Modal ---------- */

type OrgDetail = {
  org: any;
  owner: { user_id: string; full_name: string | null; email: string | null; phone: string | null; created_at: string } | null;
  members: Array<{ user_id: string; full_name: string | null; email: string | null; role: string }>;
  recent_projects: Array<{
    id: string;
    customer_name: string | null;
    address: string | null;
    project_status: string | null;
    project_type: string | null;
    start_date: string | null;
    completion_date: string | null;
    created_at: string;
  }>;
  lead_summary: Record<string, number>;
  totals: {
    total_projects: number;
    total_leads: number;
    total_members: number;
    total_customers: number;
    total_proposals: number;
    total_invoices: number;
  };
};

function OrgDetailModal({ orgId, onClose }: { orgId: string | null; onClose: () => void }) {
  const [data, setData] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setData(null);
      return;
    }
    setLoading(true);
    supabase.rpc("spu_org_detail" as any, { p_org_id: orgId }).then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setData(data as OrgDetail);
      setLoading(false);
    });
  }, [orgId]);

  const leadEntries = data ? Object.entries(data.lead_summary) : [];

  return (
    <Dialog open={!!orgId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl text-white border-white/10 max-h-[85vh] overflow-y-auto"
        style={{ background: BG }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: BLUE }} />
            {data?.org?.name ?? "Organization"}
          </DialogTitle>
          {data?.org?.slug && (
            <div className="text-xs text-white/50">{data.org.slug}</div>
          )}
        </DialogHeader>

        {loading || !data ? (
          <Loading />
        ) : (
          <div className="space-y-6 pt-2">
            {/* Org meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Meta label="Plan"><PlanBadge plan={data.org.plan} /></Meta>
              <Meta label="Status"><StatusBadge status={data.org.is_active ? (data.org.trial_ends_at && new Date(data.org.trial_ends_at) > new Date() ? "trial" : "active") : "inactive"} /></Meta>
              <Meta label="Trial ends">{fmtDate(data.org.trial_ends_at)}</Meta>
              <Meta label="Onboarded">{fmtDate(data.org.onboarded_at)}</Meta>
              <Meta label="Created">{fmtDate(data.org.created_at)}</Meta>
              <Meta label="Email">{data.org.email ?? "—"}</Meta>
              <Meta label="Phone">{data.org.phone ?? "—"}</Meta>
              <Meta label="State">{data.org.state ?? "—"}</Meta>
            </div>

            {/* Owner */}
            <Section title="Owner">
              {data.owner ? (
                <div className="rounded-lg border border-white/10 p-4 space-y-2 text-sm">
                  <div className="font-medium text-base">{data.owner.full_name ?? "—"}</div>
                  <div className="flex items-center gap-4 text-white/70 flex-wrap">
                    {data.owner.email && (
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {data.owner.email}</span>
                    )}
                    {data.owner.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {data.owner.phone}</span>
                    )}
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {fmtDate(data.owner.created_at)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/50">No owner registered.</div>
              )}
            </Section>

            {/* Members */}
            <Section title={`Members (${data.members?.length ?? 0})`}>
              {!data.members || data.members.length === 0 ? (
                <div className="text-sm text-white/50">No members.</div>
              ) : (
                <div className="rounded-lg border border-white/10 divide-y divide-white/5">
                  {data.members.map((m: any) => (
                    <div key={m.user_id ?? m.email} className="p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{m.full_name ?? "—"}</div>
                        <div className="text-xs text-white/50 truncate flex items-center gap-3 flex-wrap">
                          {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-white/70 text-xs capitalize">
                        {m.role ?? "member"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Totals */}
            <Section title="Totals">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <MiniStat label="Members" value={data.totals.total_members} />
                <MiniStat label="Customers" value={data.totals.total_customers} />
                <MiniStat label="Projects" value={data.totals.total_projects} />
                <MiniStat label="Leads" value={data.totals.total_leads} />
                <MiniStat label="Proposals" value={data.totals.total_proposals} />
                <MiniStat label="Invoices" value={data.totals.total_invoices} />
              </div>
            </Section>

            {/* Lead summary */}
            <Section title="Leads by status">
              {leadEntries.length === 0 ? (
                <div className="text-sm text-white/50">No leads yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {leadEntries
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div
                        key={status}
                        className="px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.03] text-xs flex items-center gap-2"
                      >
                        <span className="text-white/60">{status}</span>
                        <span className="font-semibold tabular-nums">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </Section>

            {/* Recent projects */}
            <Section title={`Recent projects (${data.recent_projects.length})`}>
              {data.recent_projects.length === 0 ? (
                <div className="text-sm text-white/50">No projects yet.</div>
              ) : (
                <div className="rounded-lg border border-white/10 divide-y divide-white/5">
                  {data.recent_projects.map((p) => (
                    <div key={p.id} className="p-3 flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{p.customer_name ?? "—"}</div>
                        <div className="text-xs text-white/50 truncate">
                          {p.address ?? "—"} {p.project_type ? `· ${p.project_type}` : ""}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                          {p.project_status ?? "—"}
                        </Badge>
                        <div className="text-[11px] text-white/40 mt-1">{fmtDate(p.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
    </div>
  );
}

/* ---------- UI primitives ---------- */

function Kpi({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
        {icon}<span>{label}</span>
      </div>
      <div className="text-3xl font-semibold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function Card({ title, icon, right, children }: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white/80">{icon}<span>{title}</span></div>
        {right}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-white/60">{label}</span>
      <span className="font-medium tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-3 py-2.5 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    starter: "bg-white/10 text-white/80 border-white/20",
    pro: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    enterprise: "bg-purple-500/15 text-purple-300 border-purple-400/30",
  };
  return <Badge variant="outline" className={`${map[plan] ?? map.starter} text-xs`}>{plan}</Badge>;
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    trial: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    inactive: "bg-white/5 text-white/50 border-white/15",
  };
  return <Badge variant="outline" className={`${map[status] ?? map.inactive} text-xs`}>{status}</Badge>;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function Loading() {
  return <div className="py-12 text-center text-white/50 text-sm">Loading…</div>;
}

/* ---------- User Detail Modal ---------- */

const ALL_PLATFORM_ROLES = [
  "admin","moderator","user","manager","salesperson","installer","accountant","sander","sander_installer","platform_admin",
] as const;

type UserDetail = {
  profile: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
    birthdate: string | null;
    region: string | null;
    employment_type: string | null;
    daily_rate: number | null;
    is_active_crew: boolean | null;
    created_at: string;
  };
  auth: {
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    banned_until: string | null;
    created_at: string | null;
    provider: string | null;
  } | null;
  membership: {
    organization_id: string;
    organization_name: string;
    role: string;
    joined_at: string;
  } | null;
  platform_roles: string[];
  activity: {
    projects_assigned: number;
    labor_entries: number;
    leads_owned: number;
    appointments: number;
  };
  is_self: boolean;
};

function UserDetailModal({
  userId,
  onClose,
  onMutated,
}: {
  userId: string | null;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assignOrg, setAssignOrg] = useState<string>("");
  const [assignRole, setAssignRole] = useState<string>("member");
  const [addRole, setAddRole] = useState<string>("");
  const [showDanger, setShowDanger] = useState(false);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("spu_user_detail" as any, { p_user_id: userId });
    if (error) toast.error(error.message);
    else setData(data as UserDetail);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) { setData(null); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const refresh = async () => { await fetchData(); onMutated(); };

  const run = async (fn: () => PromiseLike<{ error: any }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) { toast.error(error.message ?? String(error)); return false; }
    return true;
  };

  const assignToOrg = async () => {
    if (!assignOrg || !userId) return;
    const ok = await run(() =>
      supabase.rpc("spu_user_set_org" as any, { p_user_id: userId, p_org_id: assignOrg, p_role: assignRole })
    );
    if (ok) { toast.success("Assigned to organization"); refresh(); }
  };
  const removeFromOrg = async () => {
    if (!userId) return;
    if (!confirm("Remove this user from the organization?")) return;
    const ok = await run(() => supabase.rpc("spu_user_remove_org" as any, { p_user_id: userId }));
    if (ok) { toast.success("Removed from organization"); refresh(); }
  };
  const addPlatformRole = async () => {
    if (!addRole || !userId) return;
    const ok = await run(() => supabase.rpc("spu_user_add_role" as any, { p_user_id: userId, p_role: addRole as any }));
    if (ok) { toast.success(`Role ${addRole} added`); setAddRole(""); refresh(); }
  };
  const removePlatformRole = async (role: string) => {
    if (!userId) return;
    if (!confirm(`Remove role "${role}"?`)) return;
    const ok = await run(() => supabase.rpc("spu_user_remove_role" as any, { p_user_id: userId, p_role: role as any }));
    if (ok) { toast.success(`Role ${role} removed`); refresh(); }
  };

  const dangerAction = async (action: "reset_password" | "disable" | "enable" | "impersonate") => {
    if (!userId) return;
    const confirms: Record<string, string> = {
      reset_password: "Send password reset email?",
      disable: "Disable this user? They won't be able to sign in.",
      enable: "Re-enable this user?",
      impersonate: "Generate a magic link to sign in as this user?",
    };
    if (!confirm(confirms[action])) return;
    setBusy(true);
    const { data: res, error } = await supabase.functions.invoke("spu-user-action", {
      body: { user_id: userId, action },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if ((res as any)?.error) { toast.error((res as any).error); return; }
    if (action === "impersonate" && (res as any)?.action_link) {
      window.open((res as any).action_link, "_blank");
      toast.success("Magic link opened in new tab");
    } else if (action === "reset_password") {
      toast.success("Recovery link generated. Email will be sent if SMTP is configured.");
    } else {
      toast.success("Done");
    }
    refresh();
  };

  const disabled = !!data?.auth?.banned_until && new Date(data.auth.banned_until) > new Date();
  const availableRolesToAdd = ALL_PLATFORM_ROLES.filter((r) => !(data?.platform_roles ?? []).includes(r));

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl text-white border-white/10 max-h-[88vh] overflow-y-auto"
        style={{ background: BG }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4" style={{ color: "#3b82f6" }} />
            {data?.profile?.full_name ?? "User"}
            {disabled && <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px]">DISABLED</Badge>}
            {data?.platform_roles?.includes("platform_admin") && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px]">PLATFORM ADMIN</Badge>
            )}
          </DialogTitle>
          {data?.profile?.email && <div className="text-xs text-white/50">{data.profile.email}</div>}
        </DialogHeader>

        {loading || !data ? (
          <Loading />
        ) : (
          <div className="space-y-6 pt-2">
            <Section title="Identity">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Meta label="Phone">{data.profile.phone ?? "—"}</Meta>
                <Meta label="Region">{data.profile.region ?? "—"}</Meta>
                <Meta label="Birthdate">{fmtDate(data.profile.birthdate)}</Meta>
                <Meta label="Created">{fmtDate(data.profile.created_at)}</Meta>
                <Meta label="Last sign-in">{fmtDate(data.auth?.last_sign_in_at ?? null)}</Meta>
                <Meta label="Provider">{data.auth?.provider ?? "email"}</Meta>
              </div>
              {data.profile.bio && (
                <div className="mt-3 text-sm text-white/80 italic border-l-2 border-white/10 pl-3">{data.profile.bio}</div>
              )}
            </Section>

            <Section title="Employment">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Meta label="Type">{data.profile.employment_type ?? "—"}</Meta>
                <Meta label="Daily rate">{data.profile.daily_rate ? `$${Number(data.profile.daily_rate).toFixed(0)}` : "—"}</Meta>
                <Meta label="Active crew">{data.profile.is_active_crew ? "Yes" : "No"}</Meta>
              </div>
            </Section>

            <Section title="Activity">
              <div className="grid grid-cols-4 gap-3">
                <MiniStat label="Projects" value={data.activity.projects_assigned} />
                <MiniStat label="Labor entries" value={data.activity.labor_entries} />
                <MiniStat label="Leads owned" value={data.activity.leads_owned} />
                <MiniStat label="Appointments" value={data.activity.appointments} />
              </div>
            </Section>

            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowDanger((v) => !v)}
                className="text-xs uppercase tracking-wider font-semibold text-red-400/80 hover:text-red-300 flex items-center gap-2"
              >
                Danger zone {showDanger ? "▲" : "▼"}
              </button>
              {showDanger && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => dangerAction("reset_password")}
                    className="border-white/15 text-white/80 hover:bg-white/5">Send password reset</Button>
                  {disabled ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => dangerAction("enable")}
                      className="border-green-500/30 text-green-300 hover:bg-green-500/10">Enable user</Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busy || data.is_self} onClick={() => dangerAction("disable")}
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10">Disable user</Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busy || data.is_self} onClick={() => dangerAction("impersonate")}
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10">Impersonate</Button>
                  {data.is_self && <span className="text-[11px] text-white/40 w-full">Some actions disabled — this is you.</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

