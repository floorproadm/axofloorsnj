import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export function NewReferralSheet({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zip_code: "",
    message: "",
  });

  const reset = () =>
    setForm({ name: "", phone: "", email: "", address: "", city: "", zip_code: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    // RLS + trigger preenche organization_id, referred_by_partner_id, lead_source automaticamente
    const { error } = await supabase.from("leads").insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      zip_code: form.zip_code.trim() || null,
      message: form.message.trim() || null,
      // Estes campos serão sobrescritos pelo trigger, mas precisam ser válidos:
      organization_id: "00000000-0000-0000-0000-000000000000",
      lead_source: "partner_referral",
    } as any);

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Lead sent!", description: "AXO Floors team will follow up soon." });
    reset();
    onOpenChange(false);
    onCreated();
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Send New Referral</SheetTitle>
          <SheetDescription>Provide your client's contact info — we'll handle the rest.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Client Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Notes / Service Needed</Label>
            <Textarea
              id="message"
              rows={3}
              placeholder="e.g. Refinish 800 sqft hardwood, prefers weekends"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Lead"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
