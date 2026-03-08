import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";
import {
  FileText, Plus, Search, Send, CheckCircle2, XCircle,
  Clock, Eye, Loader2, Copy, Check, Share2, Printer,
  ChevronRight, DollarSign, TrendingUp, Star, Zap,
  MapPin, Phone, Mail, Calendar, Hash, Building2,
  Link2, Mail as MailIcon, MessageCircle,
  LayoutGrid, List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProposalGeneration } from "@/hooks/useProposalGeneration";
import { ProposalData } from "@/types/proposal";
import { ProposalPipelineBoard } from "@/components/admin/proposals/ProposalPipelineBoard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProposalWithRelations {
  id: string;
  proposal_number: string;
  status: string;
  good_price: number;
  better_price: number;
  best_price: number;
  margin_good: number;
  margin_better: number;
  margin_best: number;
  selected_tier: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  valid_until: string;
  created_at: string;
  project_id: string;
  projects: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    project_type: string;
    address: string | null;
    city: string | null;
    zip_code: string | null;
    square_footage: number | null;
  } | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const fmt = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  draft:    { label: "Draft",    color: "text-muted-foreground", bg: "bg-muted/60",        border: "border-border/50",      dot: "bg-muted-foreground" },
  sent:     { label: "Pending",  color: "text-blue-600",         bg: "bg-blue-500/10",     border: "border-blue-500/20",    dot: "bg-blue-500" },
  viewed:   { label: "Viewed",   color: "text-violet-600",       bg: "bg-violet-500/10",   border: "border-violet-500/20",  dot: "bg-violet-500" },
  accepted: { label: "Accepted", color: "text-emerald-600",      bg: "bg-emerald-500/10",  border: "border-emerald-500/20", dot: "bg-emerald-500" },
  rejected: { label: "Declined", color: "text-red-500",          bg: "bg-red-500/10",      border: "border-red-500/20",     dot: "bg-red-500" },
  expired:  { label: "Expired",  color: "text-orange-500",       bg: "bg-orange-500/10",   border: "border-orange-500/20",  dot: "bg-orange-500" },
};

const TIER_CONFIG = {
  good:   { label: "Good",   icon: Star,   color: "text-muted-foreground", bg: "bg-muted/40",       border: "border-border/50" },
  better: { label: "Better", icon: Zap,    color: "text-blue-600",         bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  best:   { label: "Best",   icon: TrendingUp, color: "text-primary",      bg: "bg-primary/10",     border: "border-primary/30" },
};

// ─── New Proposal Dialog ──────────────────────────────────────────────────────
function NewProposalDialog({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (proposal: ProposalData) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const { fetchProjectData, isLoading, error } = useProposalGeneration();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-proposal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, project_type, city")
        .in("project_status", ["pending", "in_production"])
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const handleGenerate = async () => {
    if (!projectId) return;
    const data = await fetchProjectData(projectId);
    if (data) {
      onCreated(data);
      onClose();
      setProjectId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> New Proposal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Select Job *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.customer_name} — {p.project_type}
                    {p.city && ` · ${p.city}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
              {error}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Generates Good / Better / Best tiers automatically from job costs.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" disabled={!projectId || isLoading} onClick={handleGenerate}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ proposal, open, onClose }: {
  proposal: ProposalWithRelations;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareToken = btoa(`prop-${proposal.id}`).replace(/=/g, "").slice(0, 18);
  const publicUrl = `${window.location.origin}/proposal/${shareToken}`;
  const client = proposal.projects;
  const selectedPrice = proposal.selected_tier
    ? proposal[`${proposal.selected_tier}_price` as keyof ProposalWithRelations] as number
    : proposal.better_price;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleWhatsApp = () => {
    const name = client?.customer_name.split(" ")[0] || "there";
    const text = `Hi ${name}! Your proposal from AXO Floors NJ is ready to review:\n${publicUrl}\n\nValid until ${format(parseISO(proposal.valid_until), "MMM d, yyyy")}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const name = client?.customer_name || "Valued Client";
    const subject = `Your Proposal ${proposal.proposal_number} — AXO Floors NJ`;
    const body = `Hi ${name.split(" ")[0]},\n\nYour proposal is ready for review:\n${publicUrl}\n\nProposal: ${proposal.proposal_number}\nValid until: ${format(parseISO(proposal.valid_until), "MMMM d, yyyy")}\n\nFeel free to reach out with any questions!\n\nBest,\nAXO Floors NJ\n(732) 351-8653`;
    const to = client?.customer_email || "";
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Send Proposal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Client Link</p>
            <p className="text-xs font-mono break-all text-foreground">{publicUrl}</p>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2 text-sm" onClick={handleWhatsApp}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button variant="outline" className="gap-2 text-sm" onClick={handleEmail}>
              <MailIcon className="w-4 h-4" /> Email
            </Button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            Client can view, compare tiers and accept online
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Print Proposal ───────────────────────────────────────────────────────────
function printProposal(proposal: ProposalWithRelations) {
  const c = proposal.projects;
  const address = [c?.address, c?.city, c?.zip_code].filter(Boolean).join(", ");
  const tiers = [
    { id: "good",   label: "Good",   price: proposal.good_price,   margin: proposal.margin_good,   desc: "Essential refinishing with standard finish",  badge: "" },
    { id: "better", label: "Better", price: proposal.better_price, margin: proposal.margin_better, desc: "Enhanced refinishing with premium finish",      badge: "RECOMMENDED" },
    { id: "best",   label: "Best",   price: proposal.best_price,   margin: proposal.margin_best,   desc: "Complete refinishing with top-tier materials", badge: "" },
  ];

  const features: Record<string, string[]> = {
    good:   ["Sanding & preparation", "Standard polyurethane finish", "1 coat stain", "2 coats finish", "Basic cleanup"],
    better: ["Everything in Good", "Premium polyurethane finish", "2 coats stain", "3 coats finish", "Edge detail work", "Thorough cleanup"],
    best:   ["Everything in Better", "Commercial-grade finish", "Custom stain matching", "4 coats finish", "Baseboard touch-up", "Furniture assistance", "Premium cleanup"],
  };

  const html = `<!DOCTYPE html><html><head><title>${proposal.proposal_number}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;padding:40px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #111}
    .brand{font-size:24px;font-weight:800;letter-spacing:-1px}.brand span{color:#2563eb}
    .brand-sub{font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;margin-top:3px}
    .prop-num{font-size:13px;font-weight:600;color:#6b7280;text-align:right}.prop-num span{display:block;font-size:20px;font-weight:800;color:#111;margin-bottom:4px}
    .client-box{background:#f9fafb;border-radius:12px;padding:20px 24px;margin-bottom:32px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .ci label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af}.ci p{font-size:14px;font-weight:600;margin-top:2px}
    .tiers{display:flex;gap:16px;margin-bottom:32px}
    .tier{flex:1;border:2px solid #e5e7eb;border-radius:14px;padding:20px;position:relative}
    .tier.rec{border-color:#2563eb;background:#eff6ff}
    .rec-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:20px}
    .tier-name{font-size:16px;font-weight:700;margin-bottom:2px}.tier-price{font-size:28px;font-weight:800;color:#2563eb;margin-bottom:4px}
    .tier-desc{font-size:12px;color:#6b7280;margin-bottom:16px}
    .feat{list-style:none}.feat li{font-size:12px;padding:4px 0;border-bottom:1px solid #f3f4f6}.feat li:before{content:"✓ ";color:#22c55e;font-weight:700}
    .sqft{font-size:11px;color:#9ca3af;margin-top:12px}
    .terms{background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px}
    .terms h4{font-size:12px;font-weight:700;margin-bottom:8px;color:#92400e}.terms p{font-size:12px;color:#78350f;line-height:1.6}
    .footer{text-align:center;padding-top:20px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}
    .valid{text-align:center;margin-bottom:24px;font-size:12px;color:#6b7280;background:#f3f4f6;padding:8px;border-radius:8px}
    @media print{body{padding:20px}.tiers{page-break-inside:avoid}}
  </style></head><body>
  <div class="header">
    <div><div class="brand">AXO <span>Floors</span> NJ</div><div class="brand-sub">Hardwood · Refinishing · Installation</div></div>
    <div class="prop-num"><span>${proposal.proposal_number}</span>Date: ${format(parseISO(proposal.created_at), "MMM d, yyyy")}</div>
  </div>
  <div class="client-box">
    <div class="ci"><label>Client</label><p>${c?.customer_name || "—"}</p></div>
    <div class="ci"><label>Service</label><p>${c?.project_type || "—"}</p></div>
    <div class="ci"><label>Address</label><p>${address || "—"}</p></div>
    ${c?.square_footage ? `<div class="ci"><label>Area</label><p>${c.square_footage.toLocaleString()} sqft</p></div>` : ""}
    ${c?.customer_phone ? `<div class="ci"><label>Phone</label><p>${c.customer_phone}</p></div>` : ""}
    ${c?.customer_email ? `<div class="ci"><label>Email</label><p>${c.customer_email}</p></div>` : ""}
  </div>
  <div class="valid">⏱ This proposal is valid until <strong>${format(parseISO(proposal.valid_until), "MMMM d, yyyy")}</strong></div>
  <div class="tiers">
    ${tiers.map(t => `
      <div class="tier${t.badge ? " rec" : ""}">
        ${t.badge ? `<div class="rec-badge">${t.badge}</div>` : ""}
        <div class="tier-name">${t.label}</div>
        <div class="tier-price">${fmt(t.price)}</div>
        <div class="tier-desc">${t.desc}</div>
        <ul class="feat">${features[t.id].map(f => `<li>${f}</li>`).join("")}</ul>
        ${c?.square_footage ? `<div class="sqft">${fmt(Math.round(t.price / c.square_footage))}/sqft</div>` : ""}
      </div>
    `).join("")}
  </div>
  <div class="terms">
    <h4>Terms & Payment</h4>
    <p>50% deposit required to schedule. Remaining balance due upon completion.<br>
    Pricing valid for 30 days from proposal date. NJ Licensed & Insured.<br>
    2-year warranty on all workmanship.</p>
  </div>
  <div class="footer">AXO Floors NJ · (732) 351-8653 · axofloorsnj.com · NJ Lic. #13VH12345678</div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
}

// ─── Proposal Detail Sheet ────────────────────────────────────────────────────
function ProposalDetailSheet({ proposal, open, onClose }: {
  proposal: ProposalWithRelations | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [showShare, setShowShare] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, selected_tier }: { id: string; status: string; selected_tier?: string }) => {
      const update: any = { status };
      if (status === "sent") update.sent_at = new Date().toISOString();
      if (status === "accepted" && selected_tier) { update.selected_tier = selected_tier; update.accepted_at = new Date().toISOString(); }
      const { error } = await supabase.from("proposals").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposals-list"] }); toast.success("Updated"); },
    onError: () => toast.error("Failed to update"),
  });

  if (!proposal) return null;
  const c = proposal.projects;
  const address = [c?.address, c?.city, c?.zip_code].filter(Boolean).join(", ");
  const sc = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
  const isExpired = isPast(parseISO(proposal.valid_until)) && proposal.status !== "accepted";

  const tiers = [
    { id: "good",   price: proposal.good_price,   margin: proposal.margin_good,   ...TIER_CONFIG.good },
    { id: "better", price: proposal.better_price, margin: proposal.margin_better, ...TIER_CONFIG.better },
    { id: "best",   price: proposal.best_price,   margin: proposal.margin_best,   ...TIER_CONFIG.best },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Hash className="w-4 h-4 text-muted-foreground" />
              {proposal.proposal_number}
              <Badge className={cn("text-[10px] h-5 px-2 rounded-full border", sc.bg, sc.color, sc.border)}>
                {isExpired && proposal.status === "sent" ? "Expired" : sc.label}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-10 space-y-5 mt-5">
            {/* Quick actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => printProposal(proposal)}>
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => setShowShare(true)}>
                <Share2 className="w-3.5 h-3.5" /> Send to Client
              </Button>
            </div>

            {/* Client info */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{c?.customer_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{c?.project_type}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{c?.project_type}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {address && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3 h-3 flex-shrink-0" />{address}</div>}
                {c?.customer_phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3 h-3 flex-shrink-0" />{c.customer_phone}</div>}
                {c?.customer_email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="w-3 h-3 flex-shrink-0" />{c.customer_email}</div>}
                {c?.square_footage && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="w-3 h-3 flex-shrink-0" />{c.square_footage.toLocaleString()} sqft</div>}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Created", value: format(parseISO(proposal.created_at), "MMM d, yyyy") },
                { label: "Valid Until", value: format(parseISO(proposal.valid_until), "MMM d, yyyy"), warn: isExpired },
                proposal.sent_at ? { label: "Sent", value: format(parseISO(proposal.sent_at), "MMM d, yyyy") } : null,
                proposal.accepted_at ? { label: "Accepted", value: format(parseISO(proposal.accepted_at), "MMM d, yyyy"), good: true } : null,
              ].filter(Boolean).map((d: any) => (
                <div key={d.label} className="p-2.5 rounded-lg bg-muted/20 border border-border/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</p>
                  <p className={cn("text-sm font-semibold mt-0.5", d.warn ? "text-orange-500" : d.good ? "text-emerald-600" : "text-foreground")}>{d.value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Tier Cards */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pricing Tiers</p>
              <div className="space-y-2">
                {tiers.map((tier) => {
                  const isSelected = proposal.selected_tier === tier.id;
                  const TierIcon = tier.icon;
                  return (
                    <div key={tier.id} className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      isSelected ? "border-emerald-500 bg-emerald-500/5" : cn(tier.bg, tier.border)
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TierIcon className={cn("w-4 h-4", tier.color)} />
                          <span className={cn("text-sm font-bold", tier.color)}>{tier.label}</span>
                          {isSelected && <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500 text-white border-0">ACCEPTED</Badge>}
                          {tier.id === "better" && !isSelected && <Badge variant="outline" className="text-[9px] h-4 px-1.5">Recommended</Badge>}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{fmt(tier.price)}</p>
                          <p className="text-[11px] text-muted-foreground">{tier.margin.toFixed(0)}% margin</p>
                        </div>
                      </div>
                      {c?.square_footage && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {fmt(Math.round(tier.price / c.square_footage))}/sqft
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Status Actions */}
            {proposal.status !== "accepted" && proposal.status !== "rejected" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
                {proposal.status === "draft" && (
                  <Button className="w-full gap-2" onClick={() => updateStatus.mutate({ id: proposal.id, status: "sent" })}>
                    <Send className="w-4 h-4" /> Mark as Sent
                  </Button>
                )}
                {(proposal.status === "sent" || proposal.status === "viewed") && (
                  <div className="grid grid-cols-3 gap-2">
                    {tiers.map(t => (
                      <Button
                        key={t.id}
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={() => updateStatus.mutate({ id: proposal.id, status: "accepted", selected_tier: t.id })}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.label}
                      </Button>
                    ))}
                  </div>
                )}
                {(proposal.status === "sent" || proposal.status === "viewed") && (
                  <Button variant="outline" className="w-full gap-2 text-red-500 border-red-500/20 hover:bg-red-500/10"
                    onClick={() => updateStatus.mutate({ id: proposal.id, status: "rejected" })}>
                    <XCircle className="w-4 h-4" /> Mark as Declined
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {showShare && (
        <ShareModal proposal={proposal} open={showShare} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Proposals() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProposalWithRelations | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const handleViewMode = (mode: "list" | "board") => {
    setViewMode(mode);
    if (mode === "board") setTab("all");
  };
  const qc = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, projects(customer_name, customer_email, customer_phone, project_type, address, city, zip_code, square_footage)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProposalWithRelations[];
    },
  });

  // Stats
  const stats = useMemo(() => {
    const total = proposals.reduce((s, p) => s + p.better_price, 0);
    const accepted = proposals.filter(p => p.status === "accepted");
    const acceptedTotal = accepted.reduce((s, p) => {
      const tier = p.selected_tier || "better";
      return s + (p[`${tier}_price` as keyof ProposalWithRelations] as number || p.better_price);
    }, 0);
    const sent = proposals.filter(p => ["sent", "viewed", "accepted", "rejected"].includes(p.status)).length;
    const closeRate = sent > 0 ? Math.round((accepted.length / sent) * 100) : 0;
    const pending = proposals.filter(p => ["sent", "viewed"].includes(p.status)).length;
    return { total, acceptedTotal, closeRate, total_count: proposals.length, accepted_count: accepted.length, pending };
  }, [proposals]);

  // Filter
  const filtered = useMemo(() => {
    return proposals.filter(p => {
      const matchSearch = !search ||
        p.projects?.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        p.proposal_number.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (tab === "all") return true;
      if (tab === "pending") return ["sent", "viewed"].includes(p.status);
      if (tab === "accepted") return p.status === "accepted";
      if (tab === "declined") return p.status === "rejected";
      if (tab === "draft") return p.status === "draft";
      return true;
    });
  }, [proposals, tab, search]);

  const TABS = [
    { id: "all",      label: "All",      count: proposals.length },
    { id: "draft",    label: "Draft",    count: proposals.filter(p => p.status === "draft").length },
    { id: "pending",  label: "Pending",  count: proposals.filter(p => ["sent","viewed"].includes(p.status)).length },
    { id: "accepted", label: "Accepted", count: proposals.filter(p => p.status === "accepted").length },
    { id: "declined", label: "Declined", count: proposals.filter(p => p.status === "rejected").length },
  ];

  return (
    <AdminLayout title="Proposals">
      <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border/50 bg-card">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{proposals.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{fmt(stats.total)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{stats.pending}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Close Rate</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{stats.closeRate}%</p>
          </div>
        </div>

        {/* Mini Stats + View Toggle */}
        <div className="px-3 pb-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{stats.accepted_count}</strong> accepted</span>
          <span className="text-border">|</span>
          <span><strong className="text-foreground">{fmt(stats.acceptedTotal)}</strong> won</span>
          <div className="ml-auto flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => handleViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleViewMode("board")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "board" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3 space-y-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or proposal #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button onClick={() => setShowNew(true)} className="w-full h-9 gap-2" size="sm">
            <Plus className="w-4 h-4" /> New Proposal
          </Button>
        </div>

        {/* Content: List or Board */}
        {viewMode === "board" ? (
          <ProposalPipelineBoard proposals={filtered} onSelect={setSelected} />
        ) : (
          <>
            {/* Filter Tabs — underline style */}
            <div className="flex gap-1 px-3 py-1.5 border-b border-border/50 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                    tab === t.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {t.label} {t.count > 0 && <span className="ml-0.5 opacity-60">{t.count}</span>}
                </button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">
                      {search ? "No proposals match your search" : "No proposals yet"}
                    </p>
                    {!search && (
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowNew(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Create First Proposal
                      </Button>
                    )}
                  </div>
                ) : (
                  filtered.map(p => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                    const c = p.projects;
                    const isExpired = isPast(parseISO(p.valid_until)) && !["accepted", "rejected"].includes(p.status);
                    const displayStatus = isExpired ? STATUS_CONFIG.expired : sc;
                    const selectedTier = p.selected_tier;
                    const displayPrice = selectedTier
                      ? p[`${selectedTier}_price` as keyof ProposalWithRelations] as number
                      : p.better_price;

                    return (
                      <button key={p.id} onClick={() => setSelected(p)} className="w-full text-left group">
                        <div className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          "hover:shadow-sm hover:border-primary/20 hover:bg-muted/30",
                          "border-border/50 bg-card"
                        )}>
                          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", displayStatus.dot)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{c?.customer_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{c?.project_type}{c?.city ? ` · ${c.city}` : ""}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">{p.proposal_number}</span>
                          <Badge className={cn("text-[10px] h-5 px-2 rounded-full border flex-shrink-0", displayStatus.bg, displayStatus.color, displayStatus.border)}>
                            {isExpired ? "Expired" : displayStatus.label}
                          </Badge>
                          <span className="text-sm font-bold tabular-nums w-20 text-right flex-shrink-0">{fmt(displayPrice)}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-foreground transition-colors" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <div className="px-3 py-2 border-t border-border/50 text-xs text-muted-foreground">
              {filtered.length} de {proposals.length} proposals
            </div>
          </>
        )}
      </div>

      <ProposalDetailSheet proposal={selected} open={!!selected} onClose={() => setSelected(null)} />
      <NewProposalDialog open={showNew} onClose={() => setShowNew(false)} onCreated={() => { qc.invalidateQueries({ queryKey: ["proposals-list"] }); }} />
    </AdminLayout>
  );
}
