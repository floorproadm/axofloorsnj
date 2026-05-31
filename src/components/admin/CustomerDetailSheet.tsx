import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Calendar,
  ExternalLink,
  DollarSign,
  Trash2,
} from "lucide-react";

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
  project_type: string;
  project_status: string;
  address: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  start_date: string | null;
  completion_date: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number | null;
  amount: number;
  due_date: string;
  paid_at: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
}

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const statusColor = (s: string) => {
  const k = s.toLowerCase();
  if (k.includes("paid") || k.includes("complet")) return "bg-emerald-500/15 text-emerald-600";
  if (k.includes("progress") || k.includes("schedul")) return "bg-blue-500/15 text-blue-600";
  if (k.includes("await") || k.includes("pending") || k.includes("draft"))
    return "bg-amber-500/15 text-amber-600";
  if (k.includes("cancel") || k.includes("overdue")) return "bg-red-500/15 text-red-600";
  return "bg-muted text-muted-foreground";
};

export function CustomerDetailSheet({ customer, open, onOpenChange }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer || !open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [pj, inv, appt] = await Promise.all([
          supabase
            .from("projects")
            .select(
              "id, project_type, project_status, address, estimated_cost, actual_cost, start_date, completion_date, created_at"
            )
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("invoices")
            .select("id, invoice_number, status, total_amount, amount, due_date, paid_at")
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("appointments")
            .select("id, appointment_date, appointment_time, appointment_type, status")
            .eq("customer_id", customer.id)
            .order("appointment_date", { ascending: false })
            .limit(10),
        ]);

        if (cancelled) return;
        setProjects((pj.data as any) || []);
        setInvoices((inv.data as any) || []);
        setAppointments((appt.data as any) || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, open]);

  if (!customer) return null;

  const totalRevenue = invoices
    .filter((i) => i.paid_at)
    .reduce((sum, i) => sum + Number(i.total_amount ?? i.amount ?? 0), 0);
  const outstanding = invoices
    .filter((i) => !i.paid_at && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.total_amount ?? i.amount ?? 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">
            {customer.full_name || "Sem nome"}
          </SheetTitle>
          <SheetDescription>
            Cliente desde {new Date(customer.created_at).toLocaleDateString("pt-BR")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact */}
          <Card className="p-4 space-y-2 text-sm">
            {customer.email && (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${customer.phone}`} className="hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.zip_code && ` ${customer.zip_code}`}
                </span>
              </div>
            )}
            {customer.notes && (
              <>
                <Separator className="my-2" />
                <p className="text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
              </>
            )}
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Projetos</div>
              <div className="text-lg font-semibold tabular-nums">{projects.length}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Receita</div>
              <div className="text-lg font-semibold tabular-nums text-emerald-600">
                {fmt(totalRevenue)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">A receber</div>
              <div className="text-lg font-semibold tabular-nums text-amber-600">
                {fmt(outstanding)}
              </div>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Projects */}
              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4" /> Projetos ({projects.length})
                </h3>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum projeto vinculado.</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map((p) => (
                      <Link
                        key={p.id}
                        to={`/admin/projects/${p.id}`}
                        className="block"
                      >
                        <Card className="p-3 hover:border-primary/40 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{p.project_type}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {p.address || "Sem endereço"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={statusColor(p.project_status)} variant="secondary">
                                {p.project_status}
                              </Badge>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-2 tabular-nums">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {fmt(p.actual_cost ?? p.estimated_cost)}
                            </span>
                            {p.start_date && (
                              <span>Início: {new Date(p.start_date).toLocaleDateString("pt-BR")}</span>
                            )}
                            {p.completion_date && (
                              <span>Fim: {new Date(p.completion_date).toLocaleDateString("pt-BR")}</span>
                            )}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Invoices */}
              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" /> Faturas ({invoices.length})
                </h3>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma fatura emitida.</p>
                ) : (
                  <div className="space-y-1.5">
                    {invoices.map((i) => (
                      <Card key={i.id} className="p-2.5 flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{i.invoice_number}</div>
                          <div className="text-xs text-muted-foreground">
                            Vence {new Date(i.due_date).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="tabular-nums font-medium">
                            {fmt(Number(i.total_amount ?? i.amount))}
                          </span>
                          <Badge className={statusColor(i.status)} variant="secondary">
                            {i.paid_at ? "paid" : i.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {/* Appointments */}
              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" /> Compromissos ({appointments.length})
                </h3>
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum compromisso.</p>
                ) : (
                  <div className="space-y-1.5">
                    {appointments.map((a) => (
                      <Card key={a.id} className="p-2.5 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{a.appointment_type}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {new Date(a.appointment_date).toLocaleDateString("pt-BR")} ·{" "}
                            {a.appointment_time?.slice(0, 5)}
                          </div>
                        </div>
                        <Badge className={statusColor(a.status)} variant="secondary">
                          {a.status}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link to={`/admin/projects?customer=${customer.id}`}>
                Abrir detalhes completos
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
