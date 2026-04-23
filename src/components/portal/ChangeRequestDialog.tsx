import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquareText } from "lucide-react";

interface ChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proposalId: string;
  customerId: string;
  organizationId: string;
}

export function ChangeRequestDialog({
  open,
  onOpenChange,
  proposalId,
  customerId,
  organizationId,
}: ChangeRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      toast({
        title: "Please add more detail",
        description: "Tell us what you'd like changed (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("proposal_change_requests").insert({
      proposal_id: proposalId,
      customer_id: customerId,
      organization_id: organizationId,
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Couldn't send your request",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Request sent",
      description: "We received your request and will reply within 1 business day.",
    });
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4" /> Request Changes
          </DialogTitle>
          <DialogDescription>
            Tell us what you'd like adjusted on this proposal — pricing, scope, materials, timing — anything.
            We'll get back to you within 1 business day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="cr-message" className="text-xs uppercase tracking-wider text-slate-500">
            Your message
          </Label>
          <Textarea
            id="cr-message"
            placeholder="E.g. Could we use a darker stain on the stairs? And start two weeks later than proposed?"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-[#0f1b3d] hover:bg-[#0f1b3d]/90">
            {submitting ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Sending</> : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
