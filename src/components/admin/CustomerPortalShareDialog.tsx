import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendGmailEmail } from "@/hooks/useEmailLogs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Copy, Check, MessageCircle, Mail as MailIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null | undefined;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  /** Optional id of the related entity for the email log. */
  relatedId?: string | null;
  relatedType?: "proposal" | "project" | "customer" | null;
}

/** Shared "Portal do Cliente" dialog. Generates/retrieves a portal_token and
 *  shares the link via Copy / WhatsApp / Email. */
export function CustomerPortalShareDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  relatedId,
  relatedType,
}: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setToken(null);
      if (!customerId) {
        setLoading(false);
        return;
      }
      // 1) Try to read existing token
      const { data } = await supabase
        .from("customers")
        .select("portal_token")
        .eq("id", customerId)
        .maybeSingle();
      let t = (data as any)?.portal_token as string | null;

      // 2) Generate if missing
      if (!t) {
        const newToken =
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2) + Date.now().toString(36)
          ).replace(/-/g, "");
        const { error } = await supabase
          .from("customers")
          .update({ portal_token: newToken } as any)
          .eq("id", customerId);
        if (!error) t = newToken;
      }
      if (!cancelled) {
        setToken(t);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const portalUrl = token ? `${window.location.origin}/portal/${token}` : "";

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  };

  const handleWhatsApp = () => {
    if (!portalUrl) return;
    const msg = `Olá${customerName ? ` ${customerName}` : ""}! Acesse o portal: ${portalUrl}`;
    const phoneDigits = (customerPhone || "").replace(/\D/g, "");
    const base = phoneDigits ? `https://wa.me/${phoneDigits}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleEmail = async () => {
    if (!customerEmail) {
      toast.error("Cliente não tem email cadastrado");
      return;
    }
    if (!portalUrl) {
      toast.error("Token não disponível");
      return;
    }
    setSending(true);
    try {
      await sendGmailEmail("portal_access", {
        recipient_email: customerEmail,
        customer_name: customerName || "Valued Client",
        portal_link: portalUrl,
        related_id: relatedId || customerId || "",
        related_type: relatedType || "customer",
      });
      toast.success("Email enviado");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Portal do Cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !customerId ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum cliente vinculado.
            </p>
          ) : !token ? (
            <p className="text-sm text-destructive text-center py-4">
              Falha ao gerar token do portal.
            </p>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Link do Portal
                </p>
                <p className="text-xs font-mono break-all text-foreground">{portalUrl}</p>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copiado!" : "Copiar Link"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2 text-sm" onClick={handleWhatsApp}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-sm"
                  onClick={handleEmail}
                  disabled={sending || !customerEmail}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MailIcon className="w-4 h-4" />
                  )}
                  {sending ? "Enviando..." : "Email"}
                </Button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                O cliente acessa proposta, faturas e atualizações pelo link.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
