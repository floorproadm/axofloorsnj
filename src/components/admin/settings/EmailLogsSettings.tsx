import { useState } from "react";
import { useEmailLogs } from "@/hooks/useEmailLogs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "lead_followup", label: "Lead Follow-up" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "appointment_confirmed", label: "Appointment Confirmed" },
  { value: "project_started", label: "Project Started" },
  { value: "project_completed", label: "Project Completed" },
  { value: "invoice_sent", label: "Invoice Sent" },
  { value: "reply_detected", label: "Reply Detected" },
];

const statusBadge = (s: string) => {
  if (s === "sent") return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Sent</Badge>;
  if (s === "failed") return <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
  return <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
};

const typeBadge = (t: string) => {
  const label = TYPE_OPTIONS.find((o) => o.value === t)?.label || t;
  return <Badge variant="secondary" className="text-xs">{label}</Badge>;
};

export default function EmailLogsSettings() {
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: logs = [], isLoading } = useEmailLogs(typeFilter);

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed").length,
  };

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-primary shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Email Logs</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          All emails sent via Gmail from the admin panel.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{stats.sent}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sent</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-400">{stats.failed}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No email logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Recipient</th>
                  <th className="py-2 pr-3 font-medium hidden md:table-cell">Subject</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2.5 pr-3">{typeBadge(log.type)}</td>
                    <td className="py-2.5 pr-3 truncate max-w-[180px]">{log.recipient}</td>
                    <td className="py-2.5 pr-3 truncate max-w-[250px] hidden md:table-cell text-muted-foreground">{log.subject}</td>
                    <td className="py-2.5 pr-3">{statusBadge(log.status)}</td>
                    <td className="py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                      {log.sent_at ? format(new Date(log.sent_at), "MMM d, HH:mm") : format(new Date(log.created_at), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length > 0 && logs.some((l) => l.status === "failed" && l.error_message) && (
          <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
            <p className="text-xs font-medium text-red-400 mb-1">Recent Errors:</p>
            {logs
              .filter((l) => l.status === "failed" && l.error_message)
              .slice(0, 3)
              .map((l) => (
                <p key={l.id} className="text-xs text-red-300 truncate">{l.error_message}</p>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
