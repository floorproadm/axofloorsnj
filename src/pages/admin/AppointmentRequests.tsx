import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { Calendar, Clock, Phone, Mail, MapPin, StickyNote, CheckCircle2, XCircle, Loader2 } from "lucide-react";

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

export default function AppointmentRequests() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["appointment_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_requests")
        .select("*, customers(full_name, email, phone, address)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes: string }) => {
      const { error } = await supabase
        .from("appointment_requests")
        .update({ status, admin_notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment_requests"] });
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
    <AdminLayout>
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
              const c = req.customers;
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
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColor(req.status)}>{req.status}</Badge>
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
                <p className="font-medium text-base">{selected.customers?.full_name}</p>
                {selected.customers?.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{selected.customers.phone}</p>
                )}
                {selected.customers?.email && (
                  <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" />{selected.customers.email}</p>
                )}
                {selected.customers?.address && (
                  <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{selected.customers.address}</p>
                )}
                <div className="flex gap-4 pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(selected.preferred_date), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selected.preferred_time}</span>
                </div>
                {selected.service_type && <p>Service: {selected.service_type}</p>}
                {selected.notes && <p className="text-muted-foreground italic">"{selected.notes}"</p>}
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
    </AdminLayout>
  );
}
