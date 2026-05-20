import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AXO_ORG_ID } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Clock, Phone, Mail, MapPin, StickyNote, CheckCircle2, XCircle, Loader2, Send } from "lucide-react";
import { sendGmailEmail } from "@/hooks/useEmailLogs";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColor = (s: string) => {
  if (s === "confirmed") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s === "cancelled") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
};

export function AppointmentRequestsBody() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["appointment_requests"],
    queryFn: async () => {
      const [reqRes, leadRes] = await Promise.all([
        supabase
          .from("appointment_requests")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("leads")
          .select("id, name, email, phone, address, city, services, status, created_at, next_action_date")
          .in("status", ["estimate_requested", "estimate_scheduled"])
          .order("created_at", { ascending: false }),
      ]);
      if (reqRes.error) throw reqRes.error;

      const reqs = reqRes.data || [];
      const customerIds = [...new Set(reqs.map((r: any) => r.customer_id).filter(Boolean))];
      let cMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, full_name, email, phone, address")
          .in("id", customerIds);
        cMap = Object.fromEntries((customers || []).map((c: any) => [c.id, c]));
      }
      const realRequests = reqs.map((r: any) => ({ ...r, customer: cMap[r.customer_id] || null, _kind: "request" }));

      const leadRequests = (leadRes.data || []).map((l: any) => {
        const svc = Array.isArray(l.services) && l.services.length > 0 ? String(l.services[0]) : null;
        const addr = [l.address, l.city].filter(Boolean).join(", ");
        return {
          id: `lead-${l.id}`,
          _kind: "lead",
          _lead_id: l.id,
          _lead_status: l.status,
          status: l.status === "estimate_scheduled" ? "confirmed" : "pending",
          preferred_date: l.next_action_date || l.created_at,
          preferred_time: "—",
          service_type: svc,
          notes: null,
          admin_notes: null,
          created_at: l.created_at,
          customer: { full_name: l.name, email: l.email, phone: l.phone, address: addr },
        };
      });

      return [...realRequests, ...leadRequests];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes: string }) => {
      const req = requests.find((r: any) => r.id === id);

      // Lead-derived rows: transition lead status + (optionally) create appointment
      if (req?._kind === "lead") {
        const leadId = req._lead_id as string;
        if (status === "confirmed") {
          // Transition lead to estimate_scheduled if not already
          if (req._lead_status !== "estimate_scheduled") {
            const { error: txErr } = await supabase.rpc("transition_lead_status", {
              p_lead_id: leadId, p_new_status: "estimate_scheduled",
            });
            if (txErr) throw txErr;
          }
          // Create matching appointment so it shows up on Schedule
          await supabase.from("appointments").insert({
            organization_id: AXO_ORG_ID,
            appointment_type: "measurement",
            appointment_date: req.preferred_date && req.preferred_date !== "—"
              ? format(new Date(req.preferred_date), "yyyy-MM-dd")
              : format(new Date(), "yyyy-MM-dd"),
            appointment_time: "09:00:00",
            duration_hours: 1,
            customer_name: req.customer?.full_name || "Lead",
            customer_phone: req.customer?.phone || "",
            location: req.customer?.address || "",
            notes: admin_notes || req.service_type || "Visita de medição",
            status: "scheduled",
          } as any);
        } else if (status === "cancelled") {
          await supabase.from("leads").update({ status: "lost" }).eq("id", leadId);
        }
      } else {
        const { error } = await supabase
          .from("appointment_requests")
          .update({ status, admin_notes })
          .eq("id", id);
        if (error) throw error;
      }

      // Send email on confirm/cancel
      if (status === "confirmed" || status === "cancelled") {
        const email = req?.requester_email || req?.customer?.email;
        if (email && status === "confirmed") {
          try {
            await sendGmailEmail("appointment_confirmed", {
              recipient_email: email,
              name: req?.customer?.full_name || "Valued Customer",
              date: format(new Date(req.preferred_date), "MMMM d, yyyy"),
              time: req.preferred_time,
              address: req?.customer?.address || "",
              related_id: id,
              related_type: "appointment",
            });
            toast.success("Confirmation email sent!");
          } catch (e: any) {
            console.warn("Email failed:", e);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment_requests"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Request updated");
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = filterStatus === "all" ? requests : requests.filter((r: any) => r.status === filterStatus);

  const openDetail = (req: any) => {
    setSelected(req);
    setAdminNotes(req.admin_notes || "");
    setNewStatus(req.status);
  };

  return (
    <>
      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Appointment Requests</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} requests</p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No requests found.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((req: any) => {
              const c = req.customer;
              const isPending = req.status === "pending" || req._kind === "lead" && req._lead_status === "estimate_requested";
              return (
                <Card
                  key={req.id}
                  className="cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => openDetail(req)}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium truncate">{c?.full_name || "Unknown"}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(req.preferred_date), "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{req.preferred_time}</span>
                        {req.service_type && <span>{req.service_type}</span>}
                        {c?.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address}</span>}
                        {req._kind === "lead" && <Badge variant="outline" className="text-[10px] h-4">Lead</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {isPending && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => updateMutation.mutate({ id: req.id, status: "confirmed", admin_notes: req.admin_notes || "" })}>
                            <CheckCircle2 className="w-3 h-3" /> Confirmar visita
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => updateMutation.mutate({ id: req.id, status: "cancelled", admin_notes: req.admin_notes || "" })}>
                            <XCircle className="w-3 h-3" /> Recusar
                          </Button>
                        </>
                      )}
                      {req.status === "confirmed" && req._kind !== "lead" && <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 text-[10px]"><Send className="w-2.5 h-2.5" />Email Sent</Badge>}
                      <Badge variant="outline" className={statusColor(req.status)}>{req.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Edit Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-base">{selected.customer?.full_name}</p>
                {selected.customer?.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{selected.customer.phone}</p>
                )}
                {selected.customer?.email && (
                  <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" />{selected.customer.email}</p>
                )}
                {(selected.address || selected.customer?.address) && (
                  <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{selected.address || selected.customer?.address}</p>
                )}
                <div className="flex gap-4 pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(selected.preferred_date), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selected.preferred_time}</span>
                </div>
                {selected.service_type && <p>Service: {selected.service_type}</p>}
                {selected.notes && <p className="text-muted-foreground italic whitespace-pre-line">"{selected.notes}"</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" />Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: selected.id, status: newStatus, admin_notes: adminNotes })}
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AppointmentRequests() {
  return (
    <AdminLayout title="Appointment Requests">
      <AppointmentRequestsBody />
    </AdminLayout>
  );
}
