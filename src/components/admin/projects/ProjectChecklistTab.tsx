import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ListChecks, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  useProjectChecklist, useAddChecklistItem, useUpdateChecklistItem,
  useDeleteChecklistItem, useAddChecklistTemplate, useReorderChecklist,
  CHECKLIST_TEMPLATES, type ChecklistItem,
} from "@/hooks/useProjectChecklist";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props { projectId: string; }

export function ProjectChecklistTab({ projectId }: Props) {
  const { data: items = [] } = useProjectChecklist(projectId);
  const add = useAddChecklistItem();
  const addTpl = useAddChecklistTemplate();
  const upd = useUpdateChecklistItem();
  const del = useDeleteChecklistItem();
  const reorder = useReorderChecklist();
  const [newTitle, setNewTitle] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  async function getUserName() {
    const { data } = await supabase.auth.getUser();
    return data.user?.email?.split("@")[0] || "Equipe";
  }

  async function toggle(item: ChecklistItem, checked: boolean) {
    const name = await getUserName();
    upd.mutate({
      id: item.id,
      patch: checked
        ? { completed: true, completed_at: new Date().toISOString(), completed_by: name }
        : { completed: false, completed_at: null, completed_by: null },
    });
  }

  function handleAdd() {
    const t = newTitle.trim();
    if (!t) return;
    add.mutate({ projectId, title: t, sort_order: items.length });
    setNewTitle("");
  }

  function handleTemplate(name: string) {
    addTpl.mutate({ projectId, items: CHECKLIST_TEMPLATES[name], startOrder: items.length });
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const list = [...items];
    const from = list.findIndex((i) => i.id === dragId);
    const to = list.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    reorder.mutate(list.map((it, i) => ({ id: it.id, sort_order: i })));
    setDragId(null);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="text-muted-foreground">{done} de {total} tarefas completas</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        )}

        {/* Add controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nova tarefa..."
              className="h-9"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo item
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">Usar template</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(CHECKLIST_TEMPLATES).map((name) => (
                <DropdownMenuItem key={name} onClick={() => handleTemplate(name)}>
                  {name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({CHECKLIST_TEMPLATES[name].length})
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* List */}
        {total === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
            Nenhuma tarefa ainda. Adicione manualmente ou use um template.
          </div>
        ) : (
          <TooltipProvider>
            <ul className="space-y-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(item.id)}
                  className={cn(
                    "group flex items-center gap-2 rounded-md border bg-card px-2 py-2 transition",
                    dragId === item.id && "opacity-50"
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" />
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(c) => toggle(item, !!c)}
                  />
                  <EditableTitle item={item} onSave={(t) => upd.mutate({ id: item.id, patch: { title: t } })} />
                  {item.completed && item.completed_by && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <Check className="h-3 w-3" />
                          {item.completed_by}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Feito por {item.completed_by}
                        {item.completed_at && ` em ${format(new Date(item.completed_at), "dd/MM HH:mm")}`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => del.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}

function EditableTitle({ item, onSave }: { item: ChecklistItem; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.title);
  if (editing) {
    return (
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (value.trim() && value !== item.title) onSave(value.trim()); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { setValue(item.title); setEditing(false); }
        }}
        className="h-7 flex-1"
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "flex-1 text-left text-sm py-0.5",
        item.completed && "line-through text-muted-foreground"
      )}
    >
      {item.title}
    </button>
  );
}
