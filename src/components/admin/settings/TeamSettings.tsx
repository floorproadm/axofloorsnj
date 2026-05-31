import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, MoreVertical, ShieldCheck, Trash2 } from "lucide-react";
import InviteTeamMemberDialog from "./InviteTeamMemberDialog";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ASSIGNABLE_ROLES, ROLE_META, getRoleMeta, type AppRole } from "./roleConfig";

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
  project_count: number;
}

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, { data: mc, error: mErr }] =
        await Promise.all([
          supabase.from("profiles").select("id, user_id, full_name, email, avatar_url, created_at"),
          supabase.from("user_roles").select("user_id, role"),
          supabase.from("project_members").select("user_id"),
        ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      if (mErr) throw mErr;

      const countMap = new Map<string, number>();
      mc?.forEach((m) => countMap.set(m.user_id, (countMap.get(m.user_id) || 0) + 1));

      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const list = rolesMap.get(r.user_id) || [];
        list.push(r.role);
        rolesMap.set(r.user_id, list);
      });

      const team: TeamMember[] = (profiles || [])
        .filter((p) => p.user_id)
        .map((p) => ({
          id: p.id,
          user_id: p.user_id!,
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          roles: rolesMap.get(p.user_id!) || [],
          project_count: countMap.get(p.user_id!) || 0,
        }));

      setMembers(team);
    } catch (err) {
      console.error("Failed to fetch team:", err);
      toast({ title: "Erro ao carregar equipe", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setSingleRole = async (member: TeamMember, newRole: AppRole | null) => {
    setBusyUserId(member.user_id);
    try {
      // Strategy: drop ALL current roles, then insert the new one (single-role per user UI).
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id);
      if (delErr) throw delErr;

      if (newRole) {
        const { error: insErr } = await supabase
          .from("user_roles")
          .insert({ user_id: member.user_id, role: newRole });
        if (insErr) throw insErr;
      }

      toast({
        title: newRole ? `Perfil atualizado: ${ROLE_META[newRole].label}` : "Perfil removido",
      });
      await fetchTeam();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar perfil", description: err.message, variant: "destructive" });
    } finally {
      setBusyUserId(null);
    }
  };

  const removeMember = async (member: TeamMember) => {
    setBusyUserId(member.user_id);
    try {
      // Revoke all role-based access. Auth account is preserved.
      const { error } = await supabase.from("user_roles").delete().eq("user_id", member.user_id);
      if (error) throw error;
      toast({ title: `Acesso revogado para ${member.full_name || member.email}` });
      setConfirmRemove(null);
      await fetchTeam();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const admins = members.filter((m) => m.roles.includes("admin"));
  const others = members.filter((m) => !m.roles.includes("admin"));

  const renderMember = (member: TeamMember) => {
    const initials = getInitials(member.full_name, member.email);
    const relativeDate = formatDistanceToNow(new Date(member.created_at), { addSuffix: true, locale: ptBR });
    const absoluteDate = format(new Date(member.created_at), "dd/MM/yyyy");
    const primaryRole = member.roles[0];
    const meta = primaryRole ? getRoleMeta(primaryRole) : null;
    const isSelf = currentUserId === member.user_id;
    const busy = busyUserId === member.user_id;

    return (
      <div key={member.id} className="flex items-center gap-4 py-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden flex-shrink-0 text-sm font-semibold">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {member.full_name || "Sem nome"}
            {isSelf && <span className="text-[10px] text-muted-foreground ml-2">(você)</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">{member.email || "—"}</p>
          {meta && (
            <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">{meta.access}</p>
          )}
        </div>

        {/* Role badge */}
        <div className="flex-shrink-0 min-w-[120px]">
          {meta ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`${meta.badgeClass} gap-1 cursor-help`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                    {meta.short}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium">{meta.label}</p>
                  <p className="text-xs opacity-80 mt-1">{meta.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Sem perfil</Badge>
          )}
        </div>

        {/* Projects */}
        <div className="text-right flex-shrink-0 w-16 hidden sm:block">
          <p className="text-sm font-medium tabular-nums">{member.project_count}</p>
          <p className="text-[10px] text-muted-foreground">projetos</p>
        </div>

        {/* Date */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-right flex-shrink-0 w-24 hidden md:block">
                <p className="text-[11px] text-muted-foreground">{relativeDate}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{absoluteDate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Alterar perfil
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ASSIGNABLE_ROLES.map((r) => {
              const m = ROLE_META[r];
              const active = primaryRole === r;
              return (
                <DropdownMenuItem
                  key={r}
                  onClick={() => !active && setSingleRole(member, r)}
                  className={active ? "opacity-50 cursor-default" : ""}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${m.dotClass}`} />
                  <span className="flex-1">{m.label}</span>
                  {active && <span className="text-[10px] text-muted-foreground">atual</span>}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSingleRole(member, null)}
              disabled={!primaryRole}
            >
              Remover perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setConfirmRemove(member)}
              disabled={isSelf}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Revogar acesso
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
              Equipe
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">{members.length} membros</Badge>
              <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)} className="gap-1">
                <UserPlus className="w-4 h-4" />
                Convidar
              </Button>
            </div>
          </div>
          <CardDescription>
            Gerencie perfis e acesso. Cada membro tem um perfil que define o que ele pode ver e editar.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhum usuário encontrado.</p>
          ) : (
            <div>
              {admins.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Administradores
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="divide-y">{admins.map(renderMember)}</div>
                </>
              )}

              {others.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-1 mt-4">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Demais Membros
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="divide-y">{others.map(renderMember)}</div>
                </>
              )}
            </div>
          )}
        </CardContent>

        <InviteTeamMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onSuccess={fetchTeam}
        />
      </Card>

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmRemove?.full_name || confirmRemove?.email}</strong> perderá todos os
              perfis e não conseguirá mais acessar áreas protegidas. A conta de login não é apagada —
              você pode reatribuir um perfil depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && removeMember(confirmRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revogar acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
