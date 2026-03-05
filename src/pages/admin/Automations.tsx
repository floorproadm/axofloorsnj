import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageFlowList } from "@/components/admin/automations/StageFlowList";
import { useAutomationFlows } from "@/hooks/useAutomationFlows";
import { Zap, Loader2, TrendingUp, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Automations() {
  const [pipeline, setPipeline] = useState<"sales" | "jobs">("sales");
  const {
    stageData,
    drips,
    isLoading,
    createSequence,
    updateSequence,
    deleteSequence,
    createDrip,
    updateDrip,
    deleteDrip,
  } = useAutomationFlows(pipeline);

  const totalSequences = stageData.reduce((s, st) => s + st.sequenceCount, 0);
  const totalDrips = stageData.reduce((s, st) => s + st.dripCount, 0);
  const activeStages = stageData.filter((s) => s.sequenceCount > 0).length;

  return (
    <AdminLayout title="Automations">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Automations</h1>
              <p className="text-xs text-muted-foreground">
                Fluxos automáticos de comunicação por pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{activeStages}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Active Stages</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalSequences}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Sequences</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalDrips}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Total Drips</p>
          </div>
        </div>

        {/* Pipeline Tabs */}
        <Tabs value={pipeline} onValueChange={(v) => setPipeline(v as "sales" | "jobs")}>
          <TabsList className="w-full max-w-sm h-10 bg-muted/50 p-1">
            <TabsTrigger value="sales" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              Sales Pipeline
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
              Jobs Pipeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value={pipeline} className="mt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                <p className="text-xs text-muted-foreground">Carregando fluxos...</p>
              </div>
            ) : (
              <StageFlowList
                stages={stageData}
                drips={drips}
                onCreateSequence={(input) => createSequence.mutate(input)}
                onUpdateSequence={(updates) => updateSequence.mutate(updates)}
                onDeleteSequence={(id) => deleteSequence.mutate(id)}
                onCreateDrip={(input) => createDrip.mutate(input)}
                onUpdateDrip={(updates) => updateDrip.mutate(updates)}
                onDeleteDrip={(id) => deleteDrip.mutate(id)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
