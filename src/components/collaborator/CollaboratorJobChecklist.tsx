import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, ListChecks, Plus } from "lucide-react";
import { AXO_ORG_ID } from "@/lib/constants";
import {
  CHECKLIST_TEMPLATES,
  CHECKLIST_TEMPLATE_LABELS,
} from "@/lib/checklistTemplates";

interface Props {
  projectId: string;
}

interface ChecklistRow {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}

export function CollaboratorJobChecklist({ projectId }: Props) {
  const qc = useQueryClient();
  const [loadingTpl, setLoadingTpl] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["collab_checklist", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_checklists" as any)
        .select("id, title, completed, sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChecklistRow[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase
        .from("project_checklists" as any)
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? uid : null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["collab_checklist", projectId] }),
  });

  const loadTemplate = async (key: string) => {
    setLoadingTpl(true);
    try {
      const titles = CHECKLIST_TEMPLATES[key] ?? [];
      const rows = titles.map((title, i) => ({
        project_id: projectId,
        organization_id: AXO_ORG_ID,
        title,
        sort_order: items.length + i,
      }));
      const { error } = await supabase
        .from("project_checklists" as any)
        .insert(rows as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["collab_checklist", projectId] });
    } finally {
      setLoadingTpl(false);
    }
  };

  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Checklist da Obra
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loadingTpl}>
                {loadingTpl ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(CHECKLIST_TEMPLATES).map((k) => (
                <DropdownMenuItem key={k} onClick={() => loadTemplate(k)}>
                  {CHECKLIST_TEMPLATE_LABELS[k] ?? k}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhum item ainda. Use "Template" para carregar uma lista padrão.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {done}/{total} itens
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="space-y-1 pt-1">
              {items.map((it) => (
                <label
                  key={it.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={it.completed}
                    onCheckedChange={(c) =>
                      toggle.mutate({ id: it.id, completed: !!c })
                    }
                  />
                  <span
                    className={`text-sm flex-1 ${
                      it.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {it.title}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
