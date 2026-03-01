import { useCollaboratorSchedule } from "@/hooks/useCollaboratorSchedule";
import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, MapPin, Clock, Camera, MessageSquare, CheckCircle2 } from "lucide-react";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { convertHeicToJpeg } from "@/utils/heicConverter";
import { useCollaboratorUpload } from "@/hooks/useCollaboratorUpload";
import { cn } from "@/lib/utils";

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: appointments = [], isLoading: loadingSchedule } = useCollaboratorSchedule(0);
  const { data: projects = [] } = useCollaboratorProjects();
  const upload = useCollaboratorUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);

  // Week strip data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Today's appointments
  const todayAppointments = appointments.filter((a) =>
    isSameDay(new Date(a.appointment_date + "T00:00:00"), new Date())
  );

  const todayProject = todayAppointments[0];
  const todayProjectId = todayProject?.project_id;

  // Tasks for today's project
  const { data: tasks = [] } = useQuery({
    queryKey: ["collaborator-tasks", todayProjectId],
    queryFn: async () => {
      if (!todayProjectId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("related_project_id", todayProjectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!todayProjectId,
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
          Bom dia 👋
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
      {todayProjectId && tasks.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              Tarefas do Dia
            </h3>
            <div className="space-y-2">
              {tasks.map((task) => {
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
                    <span
                      className={cn(
                        "text-sm",
                        isDone && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
