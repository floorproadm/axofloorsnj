import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ruler, Calendar, ChevronRight, ExternalLink, SquareStack } from "lucide-react";
import { format } from "date-fns";
import { useMeasurements, type ProjectMeasurement } from "@/hooks/useMeasurements";
import { FullMeasurementDialog } from "@/components/admin/projects/FullMeasurementDialog";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700 border-blue-200" },
  active: { label: "In Progress", color: "bg-amber-100 text-amber-700 border-amber-200" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

interface Props {
  projectId: string;
}

export function ProjectMeasurementsTab({ projectId }: Props) {
  const { data: measurements = [], isLoading } = useMeasurements(projectId);
  const [showCreate, setShowCreate] = useState(false);

  const totals = measurements.reduce(
    (acc, m) => {
      acc.sqft += Number(m.total_sqft || 0);
      acc.linear += Number(m.total_linear_ft || 0);
      return acc;
    },
    { sqft: 0, linear: 0 }
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Medidas</CardTitle>
          {measurements.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              · {measurements.length} {measurements.length === 1 ? "registro" : "registros"}
              {totals.sqft > 0 && ` · ${totals.sqft.toLocaleString()} sqft`}
              {totals.linear > 0 && ` · ${totals.linear.toLocaleString()} ln ft`}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova medida
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
        ) : measurements.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-lg">
            <Ruler className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Sem medidas registradas para este projeto.
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Criar primeira medida
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {measurements.map((m) => (
              <MeasurementRow key={m.id} m={m} />
            ))}
          </div>
        )}
      </CardContent>

      <FullMeasurementDialog open={showCreate} onOpenChange={setShowCreate} projectId={projectId} />
    </Card>
  );
}

function MeasurementRow({ m }: { m: ProjectMeasurement }) {
  const status = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled;

  return (
    <Link
      to={`/admin/measurements?id=${m.id}`}
      className="group flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border rounded-lg transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`${status.color} text-[10px] py-0`}>
            {status.label}
          </Badge>
          {m.measurement_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
              <Calendar className="h-3 w-3" />
              {format(new Date(m.measurement_date), "dd/MM/yyyy")}
            </span>
          )}
          {m.service_type && (
            <span className="text-xs text-muted-foreground">· {m.service_type}</span>
          )}
        </div>
        <div className="flex gap-3 mt-1.5 text-sm tabular-nums">
          {m.total_sqft > 0 && (
            <span className="font-semibold text-foreground">
              {m.total_sqft.toLocaleString()}
              <span className="text-muted-foreground font-normal text-xs ml-0.5">sqft</span>
            </span>
          )}
          {m.total_linear_ft > 0 && (
            <span className="font-semibold text-foreground">
              {m.total_linear_ft.toLocaleString()}
              <span className="text-muted-foreground font-normal text-xs ml-0.5">ln ft</span>
            </span>
          )}
          {m.areas && (() => {
            const steps = m.areas
              .filter((a) => a.area_type === "staircase")
              .reduce((s, a) => s + Number(a.area_sqft || 0), 0);
            return steps > 0 ? (
              <span className="font-semibold text-foreground flex items-center gap-1">
                <SquareStack className="h-3 w-3" />
                {steps}
                <span className="text-muted-foreground font-normal text-xs">degraus</span>
              </span>
            ) : null;
          })()}
          {m.total_sqft === 0 && m.total_linear_ft === 0 && (
            <span className="text-xs text-muted-foreground italic">Sem áreas</span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}

/** Compact reference card for use inside Proposal tab. */
export function ProjectMeasurementsReference({ projectId }: { projectId: string }) {
  const { data: measurements = [] } = useMeasurements(projectId);

  if (measurements.length === 0) return null;

  const totals = measurements.reduce(
    (acc, m) => {
      acc.sqft += Number(m.total_sqft || 0);
      acc.linear += Number(m.total_linear_ft || 0);
      return acc;
    },
    { sqft: 0, linear: 0 }
  );

  return (
    <div className="mb-4 p-3 border border-border rounded-lg bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Ruler className="h-4 w-4 text-primary" />
          Medidas vinculadas
        </div>
        <div className="flex gap-3 text-sm tabular-nums">
          <span className="text-muted-foreground">
            {measurements.length} {measurements.length === 1 ? "registro" : "registros"}
          </span>
          {totals.sqft > 0 && (
            <span className="font-semibold">
              {totals.sqft.toLocaleString()}
              <span className="text-muted-foreground font-normal text-xs ml-0.5">sqft</span>
            </span>
          )}
          {totals.linear > 0 && (
            <span className="font-semibold">
              {totals.linear.toLocaleString()}
              <span className="text-muted-foreground font-normal text-xs ml-0.5">ln ft</span>
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="gap-1.5 h-7 text-xs"
      >
        <Link to={`/admin/projects/${projectId}?tab=measurements`}>
          Ver medidas
          <ExternalLink className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
