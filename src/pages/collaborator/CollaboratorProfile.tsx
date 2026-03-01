import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  LogOut, Briefcase, CheckCircle2, Camera, ChevronRight, Lock, Bell,
  Pencil, Save, X, Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CollaboratorProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("collab_notifications") !== "false"
  );

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["collab-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, full_name, avatar_url, birthdate" as any)
        .eq("user_id", user!.id)
        .single();
      return data as any;
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

  // Start editing
  const startEditing = () => {
    setEditName(profile?.full_name || "");
    setEditBirthdate(profile?.birthdate || "");
    setEditing(true);
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName.trim(),
        birthdate: editBirthdate || null,
      } as any)
      .eq("user_id", user!.id);
    setSavingProfile(false);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado!");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["collab-profile"] });
    }
  };

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user!.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto");
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", user!.id);

    setUploadingAvatar(false);
    if (updateError) {
      toast.error("Erro ao atualizar foto");
    } else {
      toast.success("Foto atualizada!");
      queryClient.invalidateQueries({ queryKey: ["collab-profile"] });
    }
  };

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

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-bold text-foreground">Perfil</h1>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1.5">
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {/* Enhanced Header */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Avatar" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploadingAvatar ? (
                <span className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {editing ? (
            <div className="w-full space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome completo</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de nascimento</Label>
                <Input
                  type="date"
                  value={editBirthdate}
                  onChange={(e) => setEditBirthdate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {savingProfile ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">
                {profile?.full_name || user?.user_metadata?.full_name || "Colaborador"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.birthdate && (
                <p className="text-sm text-muted-foreground">
                  {calculateAge(profile.birthdate)} anos
                </p>
              )}
            </div>
          )}

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
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{completedTasks}</span>
            <span className="text-xs text-muted-foreground text-center">Tarefas feitas</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <Camera className="h-5 w-5 text-primary" />
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
