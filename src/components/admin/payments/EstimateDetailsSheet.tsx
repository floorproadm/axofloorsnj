import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { EstimateListItem } from "@/hooks/useEstimatesList";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "default" },
  accepted: { label: "Accepted", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
};

interface Props {
  estimate: EstimateListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstimateDetailsSheet({ estimate, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  if (!estimate) return null;

  const sc = statusConfig[estimate.status] || statusConfig.draft;
  const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const isExpired = new Date(estimate.valid_until) < new Date() && estimate.status !== "accepted";

  const tiers = [
    { id: "good", label: "Good", price: estimate.good_price, margin: estimate.margin_good },
    { id: "better", label: "Better", price: estimate.better_price, margin: estimate.margin_better },
    { id: "best", label: "Best", price: estimate.best_price, margin: estimate.margin_best },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {estimate.proposal_number}
            <Badge variant={isExpired && estimate.status !== "accepted" ? "destructive" : sc.variant}>
              {isExpired && estimate.status !== "accepted" ? "Expired" : sc.label}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{estimate.customers?.full_name || estimate.projects?.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Projeto</p>
              <p className="font-medium">{estimate.projects?.project_type || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Endereço</p>
              <p className="font-medium">{estimate.projects?.address || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Válido até</p>
              <p className={`font-medium ${isExpired ? "text-destructive" : ""}`}>
                {format(new Date(estimate.valid_until), "MMM dd, yyyy")}
              </p>
            </div>
            {estimate.sent_at && (
              <div>
                <p className="text-muted-foreground">Enviado em</p>
                <p className="font-medium">{format(new Date(estimate.sent_at), "MMM dd, yyyy")}</p>
              </div>
            )}
            {estimate.accepted_at && (
              <div>
                <p className="text-muted-foreground">Aceito em</p>
                <p className="font-medium">{format(new Date(estimate.accepted_at), "MMM dd, yyyy")}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tiers */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Pricing Tiers</h4>
            <div className="space-y-2">
              {tiers.map((tier) => {
                const isSelected = estimate.selected_tier === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tier.label}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{fmt(tier.price)}</p>
                      <p className="text-xs text-muted-foreground">
                        Margin: {tier.margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate(`/admin/projects/${estimate.project_id}`);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Projeto
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
