import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, Building2, Phone, Mail, Award } from "lucide-react";

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  total_referrals: number;
  total_converted: number;
  partner_type: string;
  service_zone: string;
}

interface Props {
  partner: Partner;
  email: string;
  onUpdated: () => void;
  onLogout: () => void;
}

export function PartnerProfileTab({ partner, email, onUpdated, onLogout }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contact_name: partner.contact_name,
    company_name: partner.company_name,
    phone: partner.phone || "",
  });

  const handleSave = async () => {
    if (!form.contact_name.trim() || !form.company_name.trim()) {
      toast({ title: "Name and company are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("partners")
      .update({
        contact_name: form.contact_name.trim(),
        company_name: form.company_name.trim(),
        phone: form.phone.trim() || null,
      } as any)
      .eq("id", partner.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile updated" });
    setEditing(false);
    onUpdated();
  };

  const conversionRate =
    partner.total_referrals > 0
      ? ((partner.total_converted / partner.total_referrals) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-4">
      {/* Identity card */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{partner.contact_name}</p>
            <p className="text-xs text-muted-foreground truncate">{partner.company_name}</p>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-2.5 text-sm">
            <Row icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={partner.company_name} />
            <Row icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={email} />
            <Row icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={partner.phone || "—"} />
            <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact_name" className="text-xs">Contact name</Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-xs">Company</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lifetime stats */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold">Lifetime stats</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Referrals" value={partner.total_referrals} />
          <Stat label="Converted" value={partner.total_converted} />
          <Stat label="Rate" value={`${conversionRate}%`} />
        </div>
      </Card>

      {/* Logout */}
      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="w-4 h-4 mr-2" />
        Sign out
      </Button>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium truncate text-right">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
