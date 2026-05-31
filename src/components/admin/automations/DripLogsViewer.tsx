import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function DripLogsViewer() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["automation_drip_logs_full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_drip_logs")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["automation_enrollments_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_enrollments")
        .select("id, lead_id, sequence_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads_names_for_drip"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email")
        .is('deleted_at', null);
      if (error) throw error;
      return data;
    },
  });

  const { data: sequences = [] } = useQuery({
    queryKey: ["sequences_names_for_drip"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_sequences")
        .select("id, name, stage_key");
      if (error) throw error;
      return data;
    },
  });

  // Build lookup maps
  const enrollMap = new Map(enrollments.map((e) => [e.id, e]));
  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const seqMap = new Map(sequences.map((s) => [s.id, s]));

  const enriched = logs.map((log) => {
    const enrollment = enrollMap.get(log.enrollment_id);
    const lead = enrollment ? leadMap.get(enrollment.lead_id) : null;
    const seq = enrollment ? seqMap.get(enrollment.sequence_id) : null;
    return { ...log, leadName: lead?.name || "—", leadEmail: lead?.email || "", seqName: seq?.name || "—", stageKey: seq?.stage_key || "" };
  });

  const filtered = enriched.filter((log) => {
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return log.leadName.toLowerCase().includes(q) || log.seqName.toLowerCase().includes(q) || log.leadEmail.toLowerCase().includes(q);
    }
    return true;
  });

  const statusBadge = (s: string) => {
    switch (s) {
      case "sent": return <Badge variant="default" className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px]">Sent</Badge>;
      case "pending": return <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">Pending</Badge>;
      case "failed": return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
      case "cancelled": return <Badge variant="secondary" className="text-[10px]">Cancelled</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search lead or sequence..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground ml-auto">{filtered.length} logs</p>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[11px] font-semibold">Lead</TableHead>
              <TableHead className="text-[11px] font-semibold">Sequence</TableHead>
              <TableHead className="text-[11px] font-semibold">Scheduled</TableHead>
              <TableHead className="text-[11px] font-semibold">Sent</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-10">
                  No drip logs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id} className="text-xs">
                  <TableCell className="font-medium">{log.leadName}</TableCell>
                  <TableCell className="text-muted-foreground">{log.seqName}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {format(new Date(log.scheduled_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {log.sent_at ? format(new Date(log.sent_at), "MMM d, HH:mm") : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="max-w-[200px]">
                    {log.error_message ? (
                      <span className="flex items-center gap-1 text-destructive text-[11px] truncate" title={log.error_message}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {log.error_message}
                      </span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
