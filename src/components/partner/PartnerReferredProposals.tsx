import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  partnerId: string;
  commissionPercent: number;
}

interface ReferredProposal {
  id: string;
  proposal_number: string;
  status: string;
  use_tiers: boolean | null;
  selected_tier: string | null;
  good_price: number | null;
  better_price: number | null;
  best_price: number | null;
  flat_price: number | null;
  created_at: string;
  project_id: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  viewed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  expired: "bg-muted text-muted-foreground",
};

function getPrice(p: ReferredProposal): number {
  if (!p.use_tiers && p.flat_price) return Number(p.flat_price);
  const tier = (p.selected_tier as "good" | "better" | "best" | null) || "better";
  const key = `${tier}_price` as const;
  const raw = (p as any)[key];
  return raw ? Number(raw) : 0;
}

export function PartnerReferredProposals({ partnerId, commissionPercent }: Props) {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<ReferredProposal[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("proposals" as any)
        .select(
          "id, proposal_number, status, use_tiers, selected_tier, good_price, better_price, best_price, flat_price, created_at, project_id",
        )
        .eq("referring_partner_id" as any, partnerId)
        .order("created_at", { ascending: false });
      if (!active) return;
      setProposals((data as any) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [partnerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No proposals linked to your referrals yet.
        </p>
      </Card>
    );
  }

  const accepted = proposals.filter((p) => p.status === "accepted");
  const pendingValue = proposals
    .filter((p) => p.status === "sent" || p.status === "viewed")
    .reduce((s, p) => s + getPrice(p), 0);
  const acceptedCommission = accepted.reduce(
    (s, p) => s + (getPrice(p) * commissionPercent) / 100,
    0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Pending Value
          </p>
          <p className="text-lg font-bold tabular-nums mt-0.5">
            ${pendingValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Accepted Commission
          </p>
          <p className="text-lg font-bold tabular-nums mt-0.5 text-primary">
            ${acceptedCommission.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      <div className="space-y-2">
        {proposals.map((p) => {
          const price = getPrice(p);
          const commission = (price * commissionPercent) / 100;
          const statusClass = STATUS_STYLES[p.status] || "bg-muted text-muted-foreground";
          return (
            <Card key={p.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.proposal_number}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(parseISO(p.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${statusClass}`}
                >
                  {p.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground tabular-nums">
                  ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
                {p.status === "accepted" && commission > 0 && (
                  <span className="text-primary font-bold tabular-nums">
                    +${commission.toFixed(0)} commission
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
