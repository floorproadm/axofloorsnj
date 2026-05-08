import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AXO_ORG_ID } from "@/lib/constants";
import { toast } from "sonner";
import { FlaskConical, Loader2 } from "lucide-react";

export function TestAutomationDialog() {
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [sequenceId, setSequenceId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads_for_test"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, email, status")
        .not("email", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: open,
  });

  const { data: sequences = [] } = useQuery({
    queryKey: ["sequences_for_test"],
    queryFn: async () => {
      const STAGE_ORDER: Record<string, number> = {
        cold_lead: 1,
        warm_lead: 2,
        estimate_requested: 3,
        estimate_scheduled: 4,
        in_draft: 5,
        proposal_sent: 6,
        proposal_rejected: 7,
      };
      const { data } = await supabase
        .from("automation_sequences")
        .select("id, name, stage_key, is_active")
        .eq("is_active", true)
        .order("display_order");
      return (data || []).sort(
        (a: any, b: any) => (STAGE_ORDER[a.stage_key] ?? 99) - (STAGE_ORDER[b.stage_key] ?? 99)
      );
    },
    enabled: open,
  });

  const handleTest = async () => {
    if (!leadId || !sequenceId) {
      toast.error("Select a lead and a sequence");
      return;
    }

    setLoading(true);
    try {
      // Get drips for sequence
      const { data: drips } = await supabase
        .from("automation_drips")
        .select("*")
        .eq("sequence_id", sequenceId)
        .eq("is_active", true)
        .order("display_order");

      if (!drips || drips.length === 0) {
        toast.error("No active drips in this sequence");
        setLoading(false);
        return;
      }

      // Create enrollment
      const { data: enrollment, error: enrollErr } = await supabase
        .from("automation_enrollments")
        .insert({
          lead_id: leadId,
          sequence_id: sequenceId,
          organization_id: AXO_ORG_ID,
        })
        .select()
        .single();

      if (enrollErr) throw enrollErr;

      // Schedule all drips immediately (now)
      const logs = drips.map((d: any) => ({
        enrollment_id: enrollment.id,
        drip_id: d.id,
        organization_id: AXO_ORG_ID,
        scheduled_at: new Date().toISOString(),
      }));

      const { error: logErr } = await supabase.from("automation_drip_logs").insert(logs);
      if (logErr) throw logErr;

      toast.success(`Test enrollment created with ${drips.length} drip(s) scheduled now. Engine will process within 5 min.`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          <FlaskConical className="w-3.5 h-3.5" />
          Test Automation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Test Automation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lead</label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select a lead..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l: any) => (
                  <SelectItem key={l.id} value={l.id} className="text-xs">
                    {l.name} ({l.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sequence</label>
            <Select value={sequenceId} onValueChange={setSequenceId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select a sequence..." />
              </SelectTrigger>
              <SelectContent>
                {sequences.map((s: any) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} ({s.stage_key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleTest} disabled={loading} className="w-full h-9 text-xs" size="sm">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Enroll & Schedule Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
