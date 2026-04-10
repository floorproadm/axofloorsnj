import { useState } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/admin/AddressAutocomplete";

const PROJECT_TYPES = [
  "Sanding & Finish",
  "Refinishing Only",
  "New Installation",
  "Repair",
  "Staircase",
  "Baseboards",
  "Vinyl Plank",
  "Other",
];

interface NewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewJobDialog({ open, onOpenChange }: NewJobDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const canSubmit = selectedTypes.length > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          project_type: selectedTypes.join(", "),
          address: address || null,
          city: city || null,
          zip_code: zip || null,
          organization_id: AXO_ORG_ID,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast({ title: "Job created!", description: "Fill in the details on the next page." });
      setAddress(""); setCity(""); setZip(""); setSelectedTypes([]);
      onOpenChange(false);
      navigate(`/admin/jobs/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error creating job", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">New Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Address <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={(result) => {
                setAddress(result.full);
                setCity(result.city);
                setZip(result.zip);
              }}
              placeholder="Start typing an address…"
            />
          </div>

          {/* Services */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Services <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_TYPES.map((t) => {
                const selected = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTypes(prev => selected ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
                      selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                    }`}>
                      {selected && "✓"}
                    </span>
                    {t}
                  </button>
                );
              })}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">Select at least one service</p>
            )}
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || !canSubmit}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold h-12 text-base"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create & Edit Details →"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
