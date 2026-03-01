import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, Briefcase, CheckCircle2, Camera, ChevronRight, Lock, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CollaboratorProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("collab_notifications") !== "false"
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  // Fetch profile (for created_at)
  const { data: profile } = useQuery({
    queryKey: ["collab-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, full_name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch role
  const { data: userRole } = useQuery({
    queryKey: ["collab-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .single();
      return data?.role ?? "collaborator";
    },
    enabled: !!user?.id,
  });

  // Fetch assigned projects
  const { data: projects = [] } = useQuery({
    queryKey: ["collab-projects-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_members")
        .select(`project_id, role, projects!inner (customer_name, project_status)`)
        .eq("user_id", user!.id);
      return (data || []).map((r: any) => ({
        id: r.project_id,
        customer_name: r.projects.customer_name,
        status: r.projects.project_status,
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch completed tasks count
  const { data: completedTasks = 0 } = useQuery({
    queryKey: ["collab-completed-tasks", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("tasks" as any)
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", user!.id)
        .eq("status", "done");
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch uploads count
  const { data: uploadsCount = 0 } = useQuery({
    queryKey: ["collab-uploads-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("operation_type", "COLLABORATOR_UPLOAD");
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const activeProjects = projects.filter((p) => p.status !== "completed").length;

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error("Erro ao alterar senha");
    } else {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    }
  };

  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem("collab_notifications", checked ? "true" : "false");
    toast.success(checked ? "Notificações ativadas" : "Notificações desativadas");
  };

  const roleLabel = userRole === "admin" ? "Administrador" : "Colaborador";
  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "'Membro desde' MMM yyyy", { locale: ptBR })
    : null;

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    in_progress: "Em andamento",
    completed: "Concluído",
    on_hold: "Pausado",
  };

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-xl font-heading font-bold text-foreground">Perfil</h1>

      {/* Enhanced Header */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-3">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">
              {profile?.full_name || user?.user_metadata?.full_name || "Colaborador"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
            {memberSince && (
              <span className="text-xs text-muted-foreground">{memberSince}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{activeProjects}</span>
            <span className="text-xs text-muted-foreground text-center">Projetos ativos</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-foreground">{completedTasks}</span>
            <span className="text-xs text-muted-foreground text-center">Tarefas feitas</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <Camera className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold text-foreground">{uploadsCount}</span>
            <span className="text-xs text-muted-foreground text-center">Fotos enviadas</span>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Projetos Atribuídos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/collaborator/project/${p.id}`)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{p.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {statusLabels[p.status] || p.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notifications toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Notificações</span>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {/* Change password */}
          <div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
              Alterar senha
            </button>

            {showPasswordForm && (
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-xs">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-xs">Confirmar senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="w-full"
                >
                  {changingPassword ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sair da Conta
      </Button>
    </div>
  );
}
