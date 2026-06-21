import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Handshake, HardHat, ExternalLink, Copy, MonitorPlay, Loader2, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DemoClient {
  id: string;
  full_name: string | null;
  portal_token: string;
  address?: string | null;
}

export default function DemoPortalsSettings() {
  const { toast } = useToast();
  const [clients, setClients] = useState<DemoClient[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Only show customers that still have at least one project (otherwise they're orphans from deleted test data)
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, portal_token, address, projects!inner(id)")
        .not("portal_token", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) {
        const seen = new Set<string>();
        const list = (data as any[])
          .filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          })
          .map(({ projects, ...c }) => c as DemoClient);
        setClients(list);
        if (list.length > 0) setSelectedToken(list[0].portal_token);
      }
      setLoading(false);
    })();
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const clientUrl = selectedToken ? `${origin}/portal/${selectedToken}` : "";
  const partnerUrl = `${origin}/partner/dashboard`;
  const collabUrl = `${origin}/collaborator`;
  const referralUrl = `${origin}/referral-program`;
  const samplePartnerUrl = `${origin}/sample/partner`;
  const sampleCollabUrl = `${origin}/sample/collaborator`;
  const sampleReferralUrl = `${origin}/sample/referral`;
  const sampleClientUrl = `${origin}/portal/demo`;

  const copy = (url: string, label: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: `${label} URL is on your clipboard.` });
  };

  const open = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-l-4 border-l-primary shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <MonitorPlay className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Demo Portals</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Quick access to the three client-facing portals. Use these to showcase the system live to
          flooring owners — every link opens in a new tab so your admin session stays intact.
        </p>
      </Card>

      {/* Client Portal */}
      <Card className="border-l-4 border-l-primary shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-base font-semibold text-foreground">Client Portal</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clients see: proposals, invoices, timeline, project status. No login required (token-based).
              </p>
            </div>
          </div>
          <code className="text-[10px] text-muted-foreground hidden md:block">/portal/:token</code>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading demo clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No clients with portal tokens yet. Create a client + project to generate one.
            </p>
            <Button variant="outline" onClick={() => open(`${origin}/portal/demo`)} className="gap-2">
              <ExternalLink className="w-4 h-4" /> View Sample Portal
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-w-md">
              <Label className="text-xs">Select a demo client</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.portal_token}>
                      {c.full_name || "(no name)"}{c.address ? ` — ${c.address}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => open(clientUrl)} className="gap-2">
                <ExternalLink className="w-4 h-4" /> Open Client Portal
              </Button>
              <Button variant="outline" onClick={() => open(sampleClientUrl)} className="gap-2">
                <MonitorPlay className="w-4 h-4" /> View Sample
              </Button>
              <Button variant="ghost" onClick={() => copy(clientUrl, "Client portal")} className="gap-2">
                <Copy className="w-4 h-4" /> Copy link
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Partner Portal */}
      <Card className="border-l-4 border-l-primary shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-base font-semibold text-foreground">Partner Portal</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                B2B partners track referrals, commissions and quotes. Requires a partner login — use a seeded demo account.
              </p>
            </div>
          </div>
          <code className="text-[10px] text-muted-foreground hidden md:block">/partner/dashboard</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => open(partnerUrl)} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Open Partner Portal
          </Button>
          <Button variant="outline" onClick={() => open(samplePartnerUrl)} className="gap-2">
            <MonitorPlay className="w-4 h-4" /> View Sample
          </Button>
          <Button variant="ghost" onClick={() => copy(partnerUrl, "Partner portal")} className="gap-2">
            <Copy className="w-4 h-4" /> Copy link
          </Button>
        </div>
      </Card>

      {/* Referral Portal */}
      <Card className="border-l-4 border-l-primary shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-base font-semibold text-foreground">Referral Portal</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Programa de indicações gamificado (Bronze→Diamond). Clientes/embaixadores acompanham referrals, comissões e tier.
              </p>
            </div>
          </div>
          <code className="text-[10px] text-muted-foreground hidden md:block">/referral-program</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => open(referralUrl)} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Open Referral Portal
          </Button>
          <Button variant="outline" onClick={() => open(sampleReferralUrl)} className="gap-2">
            <MonitorPlay className="w-4 h-4" /> View Sample
          </Button>
          <Button variant="ghost" onClick={() => copy(referralUrl, "Referral portal")} className="gap-2">
            <Copy className="w-4 h-4" /> Copy link
          </Button>
        </div>
      </Card>

      {/* Collaborator Portal */}
      <Card className="border-l-4 border-l-primary shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-base font-semibold text-foreground">Collaborator Portal</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Field team view: schedule, uploads, chat. Requires a collaborator login.
              </p>
            </div>
          </div>
          <code className="text-[10px] text-muted-foreground hidden md:block">/collaborator</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => open(collabUrl)} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Open Collaborator Portal
          </Button>
          <Button variant="ghost" onClick={() => copy(collabUrl, "Collaborator portal")} className="gap-2">
            <Copy className="w-4 h-4" /> Copy link
          </Button>
        </div>
      </Card>
    </div>
  );
}
