import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { ASSIGNABLE_ROLES, ROLE_META, type AppRole } from "./roleConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function InviteTeamMemberDialog({ open, onOpenChange, onSuccess }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole | "none">("installer");
  const [loading, setLoading] = useState(false);

  const selectedMeta = role !== "none" ? ROLE_META[role as AppRole] : null;

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-team-member", {
        body: {
          email: email.trim(),
          full_name: fullName.trim(),
          role: role === "none" ? null : role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Convite enviado!",
        description: `${fullName} receberá um email para criar a senha.`,
      });

      setFullName("");
      setEmail("");
      setRole("installer");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Erro ao convidar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Membro
          </DialogTitle>
          <DialogDescription>
            O membro receberá um email para definir a senha e acessar o sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome completo *</Label>
            <Input
              id="invite-name"
              placeholder="Ex: João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="joao@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole | "none")} disabled={loading}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => {
                  const m = ROLE_META[r];
                  return (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${m.dotClass}`} />
                        <span>{m.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
                <SelectItem value="none">Sem perfil especial</SelectItem>
              </SelectContent>
            </Select>
            {selectedMeta && (
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                <p>{selectedMeta.description}</p>
                <p className="text-[11px] opacity-80">{selectedMeta.access}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar Convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
