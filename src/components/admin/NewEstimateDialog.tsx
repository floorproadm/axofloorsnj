import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewEstimateDialog({ open, onOpenChange }: NewEstimateDialogProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-for-estimate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, address, project_type, project_status")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const filtered = (projects ?? []).filter((p) => {
    const q = search.toLowerCase();
    return (
      p.customer_name.toLowerCase().includes(q) ||
      (p.address ?? "").toLowerCase().includes(q) ||
      p.project_type.toLowerCase().includes(q)
    );
  });

  const handleSelect = (projectId: string) => {
    onOpenChange(false);
    setSearch("");
    navigate(`/admin/jobs/${projectId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Novo Orçamento
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center -mt-1">
          Selecione o projeto para gerar a proposta
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum projeto encontrado
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((p) => (
                <Button
                  key={p.id}
                  variant="ghost"
                  className="w-full justify-between h-auto py-3 px-3"
                  onClick={() => handleSelect(p.id)}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{p.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.project_type}
                      {p.address ? ` · ${p.address}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
