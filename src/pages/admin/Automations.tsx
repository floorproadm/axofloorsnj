import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageFlowList } from "@/components/admin/automations/StageFlowList";
import { useAutomationFlows } from "@/hooks/useAutomationFlows";
import { Zap, Loader2 } from "lucide-react";

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

  return (
    <AdminLayout title="Automations">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Automations</h1>
            <p className="text-xs text-muted-foreground">
              Fluxos automáticos de comunicação por pipeline
            </p>
          </div>
        </div>

        <Tabs value={pipeline} onValueChange={(v) => setPipeline(v as "sales" | "jobs")}>
          <TabsList className="w-full max-w-xs">
            <TabsTrigger value="sales" className="flex-1">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1">Jobs Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value={pipeline} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
