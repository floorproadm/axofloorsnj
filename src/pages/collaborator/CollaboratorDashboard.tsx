import { useCollaboratorSchedule } from "@/hooks/useCollaboratorSchedule";
import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, MapPin, Clock, Camera, MessageSquare, CheckCircle2,
  Package, Plus, X
} from "lucide-react";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { convertHeicToJpeg } from "@/utils/heicConverter";
import { useCollaboratorUpload } from "@/hooks/useCollaboratorUpload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: appointments = [], isLoading: loadingSchedule } = useCollaboratorSchedule(0);
  const { data: projects = [] } = useCollaboratorProjects();
  const { data: materialRequests = [], createRequest } = useMaterialRequests();
  const upload = useCollaboratorUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    item_name: "",
    quantity: "1",
    unit: "unit",
    notes: "",
  });

  // Week strip data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Today's appointments
  const todayAppointments = appointments.filter((a) =>
    isSameDay(new Date(a.appointment_date + "T00:00:00"), new Date())
  );

  const todayProject = todayAppointments[0];
  const todayProjectId = todayProject?.project_id;

  // Tasks for today's project + assigned to user
  const { data: tasks = [] } = useQuery({
    queryKey: ["collaborator-tasks", todayProjectId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get tasks assigned to user OR related to today's project
      let query = supabase
        .from("tasks")
        .select("id, title, status, due_date, priority")
        .eq("assigned_to", user.id)
        .in("status", ["pending", "in_progress", "done"])
        .order("created_at", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: done ? "done" : "pending",
          completed_at: done ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collaborator-tasks"] }),
  });

  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Count jobs per day for week strip
  const jobsPerDay = weekDays.map((day) => ({
    date: day,
    count: appointments.filter((a) => isSameDay(new Date(a.appointment_date + "T00:00:00"), day)).length,
  }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !uploadProjectId) return;
    for (const rawFile of Array.from(files)) {
      let file = rawFile;
      if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
        try { file = await convertHeicToJpeg(file); } catch {}
      }
      await upload.mutateAsync({ file, projectId: uploadProjectId, folderType: "job_progress" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTakePhoto = () => {
    if (todayProjectId) {
      setUploadProjectId(todayProjectId);
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  };

  const handleSubmitMaterial = () => {
    if (!materialForm.item_name.trim()) return;
    createRequest.mutate(
      {
        project_id: todayProjectId || null,
        item_name: materialForm.item_name.trim(),
        quantity: Number(materialForm.quantity) || 1,
        unit: materialForm.unit,
        notes: materialForm.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Material solicitado!");
          setMaterialForm({ item_name: "", quantity: "1", unit: "unit", notes: "" });
          setShowMaterialForm(false);
        },
      }
    );
  };

  // Recent material requests (last 5)
  const recentRequests = materialRequests.slice(0, 5);

  if (loadingSchedule) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
      <h1 className="text-xl font-heading font-bold text-foreground">
          {(() => {
            const nycHour = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
            if (nycHour < 12) return "Bom dia ☀️";
            if (nycHour < 18) return "Boa tarde 👋";
            return "Boa noite 🌙";
          })()}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      {/* Week Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {jobsPerDay.map(({ date, count }) => (
          <button
            key={date.toISOString()}
            className={cn(
              "flex flex-col items-center min-w-[52px] rounded-xl py-2 px-2 border transition-colors",
              isToday(date)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            )}
          >
            <span className="text-[10px] font-medium uppercase">
              {format(date, "EEE")}
            </span>
            <span className="text-lg font-bold">{format(date, "d")}</span>
            {count > 0 && (
              <span className={cn(
                "text-[10px] mt-0.5",
                isToday(date) ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {count} job{count > 1 ? "s" : ""}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Today's Job Card */}
      {todayProject ? (
        <Card className="border-primary/30 bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-foreground">
                {todayProject.customer_name}
              </h2>
              <Badge variant="default" className="text-xs">
                {todayProject.appointment_type}
              </Badge>
            </div>

            {todayProject.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{todayProject.location}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {todayProject.appointment_time?.slice(0, 5)}
                {todayProject.duration_hours && ` · ${todayProject.duration_hours}h`}
              </span>
            </div>

            {/* Progress */}
            {tasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{completedTasks}/{tasks.length} tarefas</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Nenhum job agendado para hoje</p>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Minhas Tarefas
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {completedTasks}/{tasks.length} concluídas
              </span>
            </div>
            <div className="space-y-2">
              {/* Pending first, then done */}
              {[...pendingTasks, ...tasks.filter((t) => t.status === "done")].map((task) => {
                const isDone = task.status === "done";
                return (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 py-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) =>
                        toggleTask.mutate({ id: task.id, done: !!checked })
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-sm block",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {task.due_date && !isDone && (
                        <span className="text-[10px] text-muted-foreground">
                          Vence: {format(new Date(task.due_date + "T00:00:00"), "MMM d")}
                        </span>
                      )}
                    </div>
                    {task.priority === "urgent" && !isDone && (
                      <Badge variant="destructive" className="text-[9px] px-1.5">!</Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Requests */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Materiais
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowMaterialForm(!showMaterialForm)}
            >
              {showMaterialForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {showMaterialForm ? "Cancelar" : "Solicitar"}
            </Button>
          </div>

          {/* Form */}
          {showMaterialForm && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Input
                placeholder="Nome do material (ex: Stain Dark Walnut)"
                value={materialForm.item_name}
                onChange={(e) => setMaterialForm((f) => ({ ...f, item_name: e.target.value }))}
                className="h-9 text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="h-9 text-sm w-20"
                />
                <Select
                  value={materialForm.unit}
                  onValueChange={(v) => setMaterialForm((f) => ({ ...f, unit: v }))}
                >
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unidade</SelectItem>
                    <SelectItem value="gallon">Galão</SelectItem>
                    <SelectItem value="box">Caixa</SelectItem>
                    <SelectItem value="sqft">Sq Ft</SelectItem>
                    <SelectItem value="roll">Rolo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Notas (opcional)"
                value={materialForm.notes}
                onChange={(e) => setMaterialForm((f) => ({ ...f, notes: e.target.value }))}
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={handleSubmitMaterial}
                disabled={!materialForm.item_name.trim() || createRequest.isPending}
              >
                {createRequest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enviar Solicitação"
                )}
              </Button>
            </div>
          )}

          {/* Recent requests */}
          {recentRequests.length > 0 ? (
            <div className="space-y-1.5">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-foreground truncate">
                      {req.quantity} {req.unit} — {req.item_name}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 shrink-0",
                      req.status === "approved" && "text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]",
                      req.status === "pending" && "text-[hsl(var(--state-risk))] border-[hsl(var(--state-risk)/0.3)]",
                      req.status === "rejected" && "text-destructive border-destructive/30"
                    )}
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : !showMaterialForm && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma solicitação recente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {todayProjectId && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-14 gap-2"
            onClick={handleTakePhoto}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            Tirar Foto
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 gap-2"
            onClick={() => navigate(`/collaborator/project/${todayProjectId}`)}
          >
            <MessageSquare className="h-5 w-5" />
            Ver Detalhes
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
