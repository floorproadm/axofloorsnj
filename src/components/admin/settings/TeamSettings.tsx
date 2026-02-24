import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Users, Shield, User, UserPlus } from "lucide-react";
import InviteTeamMemberDialog from "./InviteTeamMemberDialog";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  if (name) {
    return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url, created_at");
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const { data: memberCounts, error: membersError } = await supabase
        .from("project_members")
        .select("user_id");
      if (membersError) throw membersError;

      const countMap = new Map<string, number>();
      memberCounts?.forEach((m) => {
        countMap.set(m.user_id, (countMap.get(m.user_id) || 0) + 1);
      });

      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
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
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default" className="gap-1"><Shield className="w-3 h-3" />Admin</Badge>;
      case "moderator":
        return <Badge variant="secondary" className="gap-1">Moderador</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><User className="w-3 h-3" />Usuário</Badge>;
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
          <p className="font-medium text-sm truncate">{member.full_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground truncate">{member.email || "—"}</p>
        </div>

        {/* Roles */}
        <div className="flex gap-1 flex-shrink-0">
          {member.roles.length > 0
            ? member.roles.map((r) => <span key={r}>{getRoleBadge(r)}</span>)
            : <Badge variant="outline">Sem role</Badge>
          }
        </div>

        {/* Projects */}
        <div className="text-right flex-shrink-0 w-20">
          <p className="text-sm font-medium">{member.project_count}</p>
          <p className="text-xs text-muted-foreground">projetos</p>
        </div>

        {/* Date */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-right flex-shrink-0 w-28 hidden sm:block">
                <p className="text-xs text-muted-foreground">{relativeDate}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{absoluteDate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
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
          Visão institucional dos usuários do sistema. Gerenciamento de roles é feito via backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhum usuário encontrado.</p>
        ) : (
          <div>
            {/* Admins */}
            {admins.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Administradores</span>
                  <Separator className="flex-1" />
                </div>
                <div className="divide-y">
                  {admins.map(renderMember)}
                </div>
              </>
            )}

            {/* Others */}
            {others.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-1 mt-4">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Demais Membros</span>
                  <Separator className="flex-1" />
                </div>
                <div className="divide-y">
                  {others.map(renderMember)}
                </div>
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
  );
}
