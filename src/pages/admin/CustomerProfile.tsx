import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Plus,
  Crown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  updated_at?: string | null;
}

interface Project {
  id: string;
  project_type: string | null;
  project_status: string | null;
  address: string | null;
  city: string | null;
  start_date: string | null;
  created_at: string;
  actual_cost: number | null;
  estimated_cost: number | null;
}

interface Proposal {
  id: string;
  proposal_number: string | null;
  status: string | null;
  created_at: string;
  good_price: number | null;
  better_price: number | null;
  best_price: number | null;
  flat_price: number | null;
  use_tiers: boolean | null;
  selected_tier: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  total_amount: number | null;
}

interface Payment {
  id: string;
  amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
  invoice_id: string | null;
  description: string | null;
  category: string | null;
  status: string | null;
}

interface JobCost {
  project_id: string;
  margin_percent: number | null;
}

const fmt = (n: number | null | undefined) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const initials = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
};

const avatarColor = (id: string) => {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

const statusBadge = (s: string | null) => {
  const k = (s || "").toLowerCase();
  if (k.includes("paid") || k.includes("complet") || k.includes("accept"))
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (k.includes("progress") || k.includes("sent") || k.includes("schedul"))
    return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (k.includes("draft") || k.includes("plan") || k.includes("await") || k.includes("pending"))
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (k.includes("cancel") || k.includes("decline") || k.includes("overdue") || k.includes("reject"))
    return "bg-red-500/15 text-red-700 dark:text-red-400";
  return "bg-muted text-muted-foreground";
};

const proposalAmount = (p: Proposal): number => {
  if (!p.use_tiers) return Number(p.flat_price || 0);
  if (p.selected_tier === "good") return Number(p.good_price || 0);
  if (p.selected_tier === "better") return Number(p.better_price || 0);
  if (p.selected_tier === "best") return Number(p.best_price || 0);
  return Number(p.better_price || p.good_price || p.best_price || p.flat_price || 0);
};

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [jobCosts, setJobCosts] = useState<JobCost[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cust = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
        if (cust.error) throw cust.error;
        if (!cust.data) {
          toast({ title: "Cliente não encontrado", variant: "destructive" });
          navigate("/admin/customers");
          return;
        }
        const projRes = await supabase
          .from("projects")
          .select("id, project_type, project_status, address, city, start_date, created_at, actual_cost, estimated_cost")
          .eq("customer_id", id)
          .order("created_at", { ascending: false });
        const projIds = (projRes.data || []).map((p: any) => p.id);

        const [propRes, invRes, costRes] = await Promise.all([
          supabase
            .from("proposals")
            .select("id, proposal_number, status, created_at, good_price, better_price, best_price, flat_price, use_tiers, selected_tier")
            .eq("customer_id", id)
            .order("created_at", { ascending: false }),
          projIds.length
            ? supabase.from("invoices").select("id, invoice_number, total_amount").in("project_id", projIds)
            : Promise.resolve({ data: [], error: null } as any),
          projIds.length
            ? supabase.from("job_costs").select("project_id, margin_percent").in("project_id", projIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        const invIds = (invRes.data || []).map((i: any) => i.id);
        const payRes = invIds.length
          ? await supabase
              .from("payments")
              .select("id, amount, payment_date, payment_method, invoice_id, description, category, status")
              .in("invoice_id", invIds)
              .eq("category", "Income")
              .order("payment_date", { ascending: false })
          : ({ data: [], error: null } as any);

        if (cancelled) return;
        setCustomer(cust.data as Customer);
        setProjects((projRes.data || []) as Project[]);
        setProposals((propRes.data || []) as Proposal[]);
        setInvoices((invRes.data || []) as Invoice[]);
        setJobCosts((costRes.data || []) as JobCost[]);
        setPayments((payRes.data || []) as Payment[]);
      } catch (err: any) {
        toast({ title: "Erro ao carregar cliente", description: err.message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, toast]);

  const totalSpent = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount || 0), 0),
    [payments]
  );

  const completedCount = useMemo(
    () =>
      projects.filter((p) =>
        ["completed", "paid", "complete"].includes((p.project_status || "").toLowerCase())
      ).length,
    [projects]
  );

  const lastActivity = useMemo(() => {
    const dates: number[] = [];
    for (const p of projects) dates.push(new Date(p.created_at).getTime());
    for (const p of proposals) dates.push(new Date(p.created_at).getTime());
    for (const p of payments) if (p.payment_date) dates.push(new Date(p.payment_date).getTime());
    if (!dates.length && customer) dates.push(new Date(customer.created_at).getTime());
    if (!dates.length) return null;
    return new Date(Math.max(...dates));
  }, [projects, proposals, payments, customer]);

  const statusBadgeText = useMemo(() => {
    if (completedCount >= 2) return { label: "VIP", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: <Crown className="w-3 h-3 mr-1" /> };
    if (projects.length === 0)
      return { label: "Sem projeto", className: "bg-muted text-muted-foreground", icon: null };
    return { label: "Cliente ativo", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: null };
  }, [completedCount, projects.length]);

  const marginByProject = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of jobCosts) if (c.margin_percent != null) m.set(c.project_id, Number(c.margin_percent));
    return m;
  }, [jobCosts]);

  const invoiceTotalByProject = useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of invoices) {
      // we don't carry project_id here; rebuild from a fresh query? keep simple: 0
    }
    return m;
  }, [invoices]);

  const invoiceById = useMemo(() => {
    const m = new Map<string, Invoice>();
    for (const inv of invoices) m.set(inv.id, inv);
    return m;
  }, [invoices]);

  // Parse historical notes from customers.notes (stored as appended timestamped entries)
  const noteHistory = useMemo(() => {
    if (!customer?.notes) return [];
    const blocks = customer.notes.split(/\n---\n/).map((b) => b.trim()).filter(Boolean);
    return blocks.map((b) => {
      const m = b.match(/^\[(.+?)\]\s*([\s\S]*)$/);
      if (m) return { date: m[1], body: m[2] };
      return { date: "", body: b };
    });
  }, [customer]);

  const saveNote = async () => {
    if (!newNote.trim() || !customer) return;
    setSavingNote(true);
    try {
      const stamp = format(new Date(), "dd/MM/yyyy HH:mm");
      const entry = `[${stamp}] ${newNote.trim()}`;
      const merged = customer.notes ? `${entry}\n---\n${customer.notes}` : entry;
      const { error } = await supabase.from("customers").update({ notes: merged }).eq("id", customer.id);
      if (error) throw error;
      setCustomer({ ...customer, notes: merged });
      setNewNote("");
      toast({ title: "Nota salva" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Cliente">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!customer) return null;

  const cityState = [customer.city, customer.zip_code].filter(Boolean).join(", ");

  return (
    <AdminLayout title={customer.full_name || "Cliente"}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/customers")} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Clientes
        </Button>

        {/* Header */}
        <Card className="p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl shrink-0 ${avatarColor(
                  customer.id
                )}`}
              >
                {initials(customer.full_name).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{customer.full_name || "Sem nome"}</h1>
                  <Badge className={statusBadgeText.className} variant="secondary">
                    {statusBadgeText.icon}
                    {statusBadgeText.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                  {cityState && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {cityState}
                    </span>
                  )}
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-foreground">
                      <Phone className="w-3.5 h-3.5" /> {customer.phone}
                    </a>
                  )}
                  {customer.email && (
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-foreground">
                      <Mail className="w-3.5 h-3.5" /> {customer.email}
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0">
                <Button size="sm" className="col-span-2 sm:col-span-1" onClick={() => navigate(`/admin/proposals?customerId=${customer.id}`)}>
                  <FileText className="w-4 h-4 mr-1" /> Nova Proposta
                </Button>
                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/admin/schedule?customerId=${customer.id}`)}>
                  <Calendar className="w-4 h-4 mr-1" />
                  <span className="sm:hidden">Visita</span>
                  <span className="hidden sm:inline">Agendar Visita</span>
                </Button>
                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/admin/chat?customerId=${customer.id}`)}>
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="sm:hidden">Mensagem</span>
                  <span className="hidden sm:inline">Enviar mensagem</span>
                </Button>
              </div>
            </div>

            </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="projetos">
          <TabsList className="w-full overflow-x-auto no-scrollbar justify-start">
            <TabsTrigger value="projetos">Projetos ({projects.length})</TabsTrigger>
            <TabsTrigger value="propostas">Propostas ({proposals.length})</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos ({payments.length})</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
          </TabsList>

          {/* Projetos */}
          <TabsContent value="projetos">
            <Card className="shadow-sm">
              <div className="p-4 flex items-center justify-between border-b">
                <h2 className="font-semibold">Projetos</h2>
                <Button
                  size="sm"
                  onClick={() => navigate(`/admin/projects?newCustomerId=${customer.id}`)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Novo projeto
                </Button>
              </div>
              {projects.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum projeto ainda.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-2">Projeto</th>
                        <th className="text-left px-4 py-2">Serviço</th>
                        <th className="text-left px-4 py-2">Data</th>
                        <th className="text-left px-4 py-2">Status</th>
                        <th className="text-right px-4 py-2">Faturado</th>
                        <th className="text-right px-4 py-2">Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p, idx) => {
                        const margin = marginByProject.get(p.id);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => navigate(`/admin/projects/${p.id}`)}
                            className={`cursor-pointer hover:bg-muted/40 ${idx % 2 ? "bg-muted/10" : ""}`}
                          >
                            <td className="px-4 py-2 font-medium">
                              {p.address || "Sem endereço"}
                              {p.city && <span className="text-muted-foreground"> · {p.city}</span>}
                            </td>
                            <td className="px-4 py-2">{p.project_type || "—"}</td>
                            <td className="px-4 py-2">
                              {p.start_date
                                ? format(new Date(p.start_date), "dd/MM/yyyy")
                                : format(new Date(p.created_at), "dd/MM/yyyy")}
                            </td>
                            <td className="px-4 py-2">
                              <Badge className={statusBadge(p.project_status)} variant="secondary">
                                {p.project_status || "—"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right">{fmt(p.actual_cost || p.estimated_cost)}</td>
                            <td className="px-4 py-2 text-right">
                              {margin != null ? (
                                <span className={margin >= 0 ? "text-emerald-600" : "text-red-600"}>
                                  {margin.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Propostas */}
          <TabsContent value="propostas">
            <Card className="shadow-sm">
              <div className="p-4 flex items-center justify-between border-b">
                <h2 className="font-semibold">Propostas</h2>
                <Button
                  size="sm"
                  onClick={() => navigate(`/admin/proposals?customerId=${customer.id}`)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Nova proposta
                </Button>
              </div>
              {proposals.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma proposta enviada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-2">PROP-ID</th>
                        <th className="text-left px-4 py-2">Data</th>
                        <th className="text-right px-4 py-2">Valor</th>
                        <th className="text-left px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((p, idx) => (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/admin/proposals?proposalId=${p.id}`)}
                          className={`cursor-pointer hover:bg-muted/40 ${idx % 2 ? "bg-muted/10" : ""}`}
                        >
                          <td className="px-4 py-2 font-medium">{p.proposal_number || p.id.slice(0, 8)}</td>
                          <td className="px-4 py-2">{format(new Date(p.created_at), "dd/MM/yyyy")}</td>
                          <td className="px-4 py-2 text-right">{fmt(proposalAmount(p))}</td>
                          <td className="px-4 py-2">
                            <Badge className={statusBadge(p.status)} variant="secondary">
                              {p.status || "draft"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos">
            <Card className="shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Pagamentos recebidos</h2>
              </div>
              {payments.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum pagamento recebido.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-2">Data</th>
                        <th className="text-left px-4 py-2">Invoice</th>
                        <th className="text-left px-4 py-2">Método</th>
                        <th className="text-right px-4 py-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, idx) => {
                        const inv = p.invoice_id ? invoiceById.get(p.invoice_id) : undefined;
                        return (
                          <tr key={p.id} className={idx % 2 ? "bg-muted/10" : ""}>
                            <td className="px-4 py-2">
                              {p.payment_date ? format(new Date(p.payment_date), "dd/MM/yyyy") : "—"}
                            </td>
                            <td className="px-4 py-2">{inv?.invoice_number || "—"}</td>
                            <td className="px-4 py-2">{p.payment_method || "—"}</td>
                            <td className="px-4 py-2 text-right text-emerald-600 font-medium">
                              {fmt(p.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-semibold">
                        <td colSpan={3} className="px-4 py-3 text-right">Total recebido</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{fmt(totalSpent)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Notas */}
          <TabsContent value="notas">
            <Card className="shadow-sm p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Nova nota interna</label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escreva uma nota sobre este cliente..."
                  rows={4}
                  className="mt-2"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={saveNote} disabled={!newNote.trim() || savingNote}>
                    {savingNote && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    Salvar nota
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">Histórico</h3>
                {noteHistory.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sem notas registradas.</div>
                ) : (
                  <div className="space-y-3">
                    {noteHistory.map((n, i) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-3 py-1">
                        {n.date && (
                          <div className="text-xs text-muted-foreground mb-1">{n.date}</div>
                        )}
                        <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
