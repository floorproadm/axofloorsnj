import { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Eraser, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proposalId: string;
  organizationId: string;
  defaultName?: string;
  selectedTier: "good" | "better" | "best" | "flat" | null;
  onSigned?: () => void;
}

type PaymentMethod = "check" | "zelle" | "other";

export function SignatureDialog({
  open,
  onOpenChange,
  proposalId,
  organizationId,
  defaultName = "",
  selectedTier,
  onSigned,
}: Props) {
  const padRef = useRef<SignaturePad | null>(null);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleClear = () => padRef.current?.clear();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please type your full name.");
      return;
    }
    if (!padRef.current || padRef.current.isEmpty()) {
      toast.error("Please sign in the box above.");
      return;
    }

    setSubmitting(true);
    try {
      // Convert signature to PNG blob
      const canvas = padRef.current.getTrimmedCanvas();
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/png")
      );
      const fileName = `${proposalId}/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("proposal-signatures")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from("proposal-signatures")
        .getPublicUrl(fileName);
      const signature_url = pub.publicUrl;

      // Insert signature row
      const { error: sigErr } = await supabase
        .from("proposal_signatures")
        .insert({
          proposal_id: proposalId,
          organization_id: organizationId,
          signer_name: name.trim(),
          signer_email: email.trim() || null,
          signature_url,
          selected_tier: selectedTier,
          payment_method: paymentMethod,
          user_agent: navigator.userAgent,
        } as any);
      if (sigErr) throw sigErr;

      // Update proposal
      const updates: any = {
        status: "accepted",
        accepted_at: new Date().toISOString(),
      };
      if (selectedTier && selectedTier !== "flat") {
        updates.selected_tier = selectedTier;
      }
      const { error: propErr } = await supabase
        .from("proposals")
        .update(updates)
        .eq("id", proposalId);
      if (propErr) throw propErr;

      setDone(true);
      onSigned?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Could not save signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
            <h3 className="text-xl font-bold">Project confirmed</h3>
            <p className="text-sm text-muted-foreground">
              Thank you, <strong>{name}</strong>. We'll text you within 24h to
              schedule kickoff.
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve & Sign</DialogTitle>
          <DialogDescription>
            Lock in your project. This is your written authorization to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="signer-name">Full name</Label>
            <Input
              id="signer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signer-email">Email (optional)</Label>
            <Input
              id="signer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sign here</Label>
            <div className="border-2 border-dashed rounded-md bg-slate-50 relative">
              <SignaturePad
                ref={padRef}
                canvasProps={{
                  className: "w-full h-40 rounded-md",
                }}
                penColor="#0f1b3d"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2 py-1"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Drawing with finger or mouse counts as a legal signature.
            </p>
          </div>

          <div className="space-y-2">
            <Label>How will you pay the deposit?</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="space-y-1.5"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="check" /> Check
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="zelle" /> Zelle
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="other" /> Other (we'll coordinate)
              </label>
            </RadioGroup>
            <p className="text-[11px] text-muted-foreground">
              We'll send payment instructions after you sign.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Approve & Sign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
