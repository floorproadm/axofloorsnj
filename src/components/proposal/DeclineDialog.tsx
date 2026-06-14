import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proposalId: string;
  shareToken: string;
  onDeclined?: () => void;
}

export function DeclineDialog({
  open,
  onOpenChange,
  proposalId,
  shareToken,
  onDeclined,
}: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("public_decline_proposal" as any, {
        p_token: shareToken,
        p_reason: reason.trim() || null,
      });
      if (error) throw error;
      setDone(true);
      onDeclined?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <XCircle className="w-14 h-14 text-slate-500" />
            <h3 className="text-xl font-bold">Proposal declined</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for letting us know. We'll be in touch if anything changes.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-3">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline Proposal</DialogTitle>
          <DialogDescription>
            Help us improve — let us know why this isn't the right fit (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="decline-reason">Reason (optional)</Label>
          <Textarea
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Price, timing, went with another contractor, etc."
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              "Decline Proposal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
