import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin, Clock, Camera, MessageSquare, Package, Plus, Home, Calendar,
  User, CheckCircle2, Eye, HardHat,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const WEEK = [
  { day: "Mon", date: 16, jobs: 1 },
  { day: "Tue", date: 17, jobs: 2 },
  { day: "Wed", date: 18, jobs: 1, today: true },
  { day: "Thu", date: 19, jobs: 0 },
  { day: "Fri", date: 20, jobs: 2 },
  { day: "Sat", date: 21, jobs: 1 },
  { day: "Sun", date: 22, jobs: 0 },
];

interface Task { id: string; title: string; done: boolean; due?: string }
const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Move furniture from living room", done: true },
  { id: "2", title: "Cover HVAC vents with plastic", done: true },
  { id: "3", title: "Apply first coat of stain", done: false, due: "Today" },
  { id: "4", title: "Document before-photos in each room", done: false, due: "Today" },
  { id: "5", title: "Send progress update to office", done: false },
];

interface MatReq { name: string; qty: number; unit: string; status: string }
const INITIAL_MATS: MatReq[] = [
  { name: "DuraSeal Dark Walnut", qty: 2, unit: "gallon", status: "approved" },
  { name: "Bona Mega Finish", qty: 3, unit: "gallon", status: "pending" },
];

export default function SampleCollaboratorPortal() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [mats, setMats] = useState<MatReq[]>(INITIAL_MATS);
  const [matOpen, setMatOpen] = useState(false);
  const [matForm, setMatForm] = useState({ name: "", qty: "1", unit: "unit", notes: "" });
  const [checkedIn, setCheckedIn] = useState(false);
  const [activeNav, setActiveNav] = useState<"home" | "schedule" | "chat" | "profile">("home");

  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / tasks.length) * 100);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const submitMat = () => {
    if (!matForm.name.trim()) {
      toast.error("Nome do material obrigatório");
      return;
    }
    setMats((prev) => [{ name: matForm.name.trim(), qty: Number(matForm.qty) || 1, unit: matForm.unit, status: "pending" }, ...prev]);
    setMatForm({ name: "", qty: "1", unit: "unit", notes: "" });
    setMatOpen(false);
    toast.success("Material solicitado!");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SampleBanner />

      <header className="bg-card border-b sticky top-10 z-10 px-4 py-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <HardHat className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight truncate">Carlos R.</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
            Field Crew · FloorPRO
          </p>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        <div>
          <h1 className="text-xl font-bold">Bom dia ☀️</h1>
          <p className="text-sm text-muted-foreground">Wednesday, June 18</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {WEEK.map((d) => (
            <button
              key={d.day}
              onClick={() => toast.info(`${d.day} ${d.date}: ${d.jobs} job${d.jobs === 1 ? "" : "s"}`)}
              className={`flex flex-col items-center min-w-[52px] rounded-xl py-2 px-2 border transition-colors ${
                d.today ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              <span className="text-[10px] font-medium uppercase">{d.day}</span>
              <span className="text-lg font-bold">{d.date}</span>
              {d.jobs > 0 && (
                <span className={`text-[10px] mt-0.5 ${d.today ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {d.jobs} job{d.jobs > 1 ? "s" : ""}
                </span>
              )}
            </button>
          ))}
        </div>

        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Johnson — 12 Oak Avenue</h2>
              <Badge>Refinishing</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>12 Oak Avenue, Montclair, NJ 07042</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>8:00 AM · 6h</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{completed}/{tasks.length} tarefas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={() => toast.info("Camera opened (sample)")}>
                <Camera className="w-3.5 h-3.5" /> Photo
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={() => toast.info("Chat aberto (sample)")}>
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </Button>
              <Button
                variant={checkedIn ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs gap-1"
                onClick={() => {
                  setCheckedIn((v) => !v);
                  toast.success(checkedIn ? "Check-out registrado" : "Check-in registrado");
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {checkedIn ? "Check-out" : "Check-in"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Minhas Tarefas</h3>
              <span className="text-[10px] text-muted-foreground">{completed}/{tasks.length} concluídas</span>
            </div>
            <div className="space-y-2">
              {tasks.map((t) => (
                <label key={t.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm block ${t.done ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </span>
                    {t.due && !t.done && (
                      <span className="text-[10px] text-muted-foreground">Vence: {t.due}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Materiais
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setMatOpen(true)}>
                <Plus className="h-3 w-3" /> Solicitar
              </Button>
            </div>
            <div className="space-y-2">
              {mats.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.qty} {m.unit}</p>
                  </div>
                  <Badge variant={m.status === "approved" ? "default" : "outline"} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={matOpen} onOpenChange={setMatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Solicitar Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label className="text-xs">Material</Label>
              <Input autoFocus placeholder="Ex: Stain Dark Walnut" value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label className="text-xs">Quantidade</Label>
                <Input type="number" min="1" value={matForm.qty} onChange={(e) => setMatForm({ ...matForm, qty: e.target.value })} />
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Unidade</Label>
                <Input value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Notas</Label>
              <Textarea value={matForm.notes} onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })} className="min-h-[64px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatOpen(false)}>Cancelar</Button>
            <Button onClick={submitMat}>Enviar Solicitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex items-center justify-around py-2 max-w-xl mx-auto z-20">
        {[
          { key: "home", icon: Home, label: "Home" },
          { key: "schedule", icon: Calendar, label: "Schedule" },
          { key: "chat", icon: MessageSquare, label: "Chat" },
          { key: "profile", icon: User, label: "Profile" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => {
              setActiveNav(key as any);
              if (key !== "home") toast.info(`${label} (sample)`);
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${activeNav === key ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function SampleBanner() {
  return (
    <div className="bg-amber-500/95 text-white text-center text-[11px] font-semibold py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-30">
      <Eye className="w-3.5 h-3.5" />
      SAMPLE PREVIEW — Interactive demo with mock data
      <Link to="/admin/settings?section=demo_portals" className="underline ml-2">Back to settings</Link>
    </div>
  );
}
