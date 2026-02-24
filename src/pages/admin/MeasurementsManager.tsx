import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Ruler, Plus, Search, MapPin, Calendar, User, ArrowLeft,
  Pencil, Trash2, X, ChevronRight, SquareStack, Move,
} from 'lucide-react';
import {
  useMeasurements, useMeasurementDetail, useCreateMeasurement,
  useUpdateMeasurement, useDeleteMeasurement, useUpsertArea, useDeleteArea,
  type ProjectMeasurement, type MeasurementArea,
} from '@/hooks/useMeasurements';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  active: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const AREA_TYPES = [
  { value: 'floor', label: 'Piso (sqft)' },
  { value: 'staircase', label: 'Escada (sqft)' },
  { value: 'baseboard', label: 'Rodapé (linear ft)' },
  { value: 'handrail', label: 'Corrimão (linear ft)' },
  { value: 'other', label: 'Outro' },
];

export default function MeasurementsManager() {
  const [searchParams] = useSearchParams();
  const projectFromUrl = searchParams.get('project');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: measurements = [], isLoading } = useMeasurements();
  const { data: detail } = useMeasurementDetail(selectedId ?? undefined);
  const createMutation = useCreateMeasurement();
  const updateMutation = useUpdateMeasurement();
  const deleteMutation = useDeleteMeasurement();
  const upsertArea = useUpsertArea();
  const deleteArea = useDeleteArea();

  // Projects for create dialog
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-measurements'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, customer_name, address, city, project_type').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = measurements.filter((m) => {
    const matchesSearch = !search ||
      m.project?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.project?.address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesProject = !projectFromUrl || m.project_id === projectFromUrl;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Auto-open create if navigated from job with no existing measurements
  useEffect(() => {
    if (projectFromUrl && !isLoading && filtered.length === 0) {
      setShowCreate(true);
    }
  }, [projectFromUrl, isLoading, filtered.length]);
  if (selectedId && detail) {
    return (
      <AdminLayout title="Medição">
        {editMode ? (
          <EditMeasurementView
            measurement={detail}
            onBack={() => setEditMode(false)}
            onSave={updateMutation}
            upsertArea={upsertArea}
            deleteArea={deleteArea}
          />
        ) : (
          <MeasurementDetailView
            measurement={detail}
            onBack={() => setSelectedId(null)}
            onEdit={() => setEditMode(true)}
            onDelete={() => setDeleteTarget(detail.id)}
          />
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar Medição?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todas as áreas e dados associados serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  deleteMutation.mutate(deleteTarget!, {
                    onSuccess: () => {
                      setDeleteTarget(null);
                      setSelectedId(null);
                      setEditMode(false);
                    },
                  });
                }}
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    );
  }

  // --- List View ---
  return (
    <AdminLayout title="Medições">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Medições
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro de medições por projeto — área (sqft) e linear (ft)
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Medição
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou endereço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'scheduled', 'active', 'completed'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
                className="text-xs"
              >
                {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma medição encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MeasurementCard key={m.id} measurement={m} onClick={() => setSelectedId(m.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateMeasurementDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projects={projects}
        onCreate={createMutation}
        defaultProjectId={projectFromUrl || undefined}
      />
    </AdminLayout>
  );
}

// --- Card Component ---
function MeasurementCard({ measurement: m, onClick }: { measurement: ProjectMeasurement; onClick: () => void }) {
  const status = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{m.project?.customer_name || 'Cliente'}</h3>
          {m.project?.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{m.project.address}{m.project.city ? `, ${m.project.city}` : ''}</span>
            </p>
          )}
          {m.measurement_date && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(m.measurement_date), 'dd/MM/yyyy · HH:mm')}
            </p>
          )}
        </div>
        <Badge variant="outline" className={`${status.color} text-xs flex-shrink-0`}>
          {status.label}
        </Badge>
      </div>

      <div className="border-t border-border pt-3 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          {m.total_sqft > 0 && (
            <span className="font-semibold text-foreground">
              {m.total_sqft.toLocaleString()} <span className="text-muted-foreground font-normal">sqft</span>
            </span>
          )}
          {m.total_linear_ft > 0 && (
            <span className="font-semibold text-foreground">
              {m.total_linear_ft.toLocaleString()} <span className="text-muted-foreground font-normal">linear ft</span>
            </span>
          )}
          {m.total_sqft === 0 && m.total_linear_ft === 0 && (
            <span className="text-muted-foreground italic">Sem medidas registradas</span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// --- Detail View ---
function MeasurementDetailView({
  measurement: m, onBack, onEdit, onDelete,
}: {
  measurement: ProjectMeasurement;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
            <Pencil className="w-4 h-4" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="gap-1 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" /> Deletar
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{m.project?.customer_name}</h2>
            {m.project?.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {m.project.address}{m.project.city ? `, ${m.project.city}` : ''}
              </p>
            )}
            {m.measurement_date && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(m.measurement_date), 'dd/MM/yyyy · HH:mm')}
              </p>
            )}
            {m.measured_by && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <User className="w-3.5 h-3.5" />
                {m.measured_by}
              </p>
            )}
          </div>
          <Badge variant="outline" className={`${status.color}`}>{status.label}</Badge>
        </div>
      </div>

      {/* Areas */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <SquareStack className="w-4 h-4" /> Áreas
        </h3>
        {m.areas && m.areas.length > 0 ? (
          <>
            <div className="space-y-2">
              {m.areas.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-lg">
                  <div>
                    <span className="font-medium text-foreground">{a.room_name}</span>
                    {a.dimensions && (
                      <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1 inline-flex">
                        <Move className="w-3 h-3" /> {a.dimensions}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-primary">
                    {a.area_type === 'baseboard' || a.area_type === 'handrail'
                      ? `${a.linear_ft} linear ft`
                      : `${a.area_sqft} sqft`}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <div className="flex gap-4">
                {m.total_sqft > 0 && <span>{m.total_sqft.toLocaleString()} sqft</span>}
                {m.total_linear_ft > 0 && <span>{m.total_linear_ft.toLocaleString()} linear ft</span>}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">Nenhuma área registrada</p>
        )}
      </div>

      {/* Service Details */}
      {(m.service_type || m.material || m.finish_type) && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Especificações Técnicas</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {m.service_type && (
              <>
                <span className="text-muted-foreground">Tipo de Serviço</span>
                <span className="font-medium text-right">{m.service_type}</span>
              </>
            )}
            {m.material && (
              <>
                <span className="text-muted-foreground">Material</span>
                <span className="font-medium text-right">{m.material}</span>
              </>
            )}
            {m.finish_type && (
              <>
                <span className="text-muted-foreground">Acabamento</span>
                <span className="font-medium text-right">{m.finish_type}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {m.notes && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-2">
          <h3 className="font-semibold text-foreground">Observações</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.notes}</p>
        </div>
      )}
    </div>
  );
}

// --- Edit View ---
function EditMeasurementView({
  measurement, onBack, onSave, upsertArea, deleteArea,
}: {
  measurement: ProjectMeasurement;
  onBack: () => void;
  onSave: any;
  upsertArea: any;
  deleteArea: any;
}) {
  const [serviceType, setServiceType] = useState(measurement.service_type || '');
  const [material, setMaterial] = useState(measurement.material || '');
  const [finishType, setFinishType] = useState(measurement.finish_type || '');
  const [notes, setNotes] = useState(measurement.notes || '');
  const [measuredBy, setMeasuredBy] = useState(measurement.measured_by || '');
  const [status, setStatus] = useState(measurement.status);
  const [areas, setAreas] = useState<(MeasurementArea & { _dirty?: boolean; _new?: boolean })[]>(
    measurement.areas || []
  );
  const [saving, setSaving] = useState(false);

  const addArea = () => {
    setAreas((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        measurement_id: measurement.id,
        room_name: '',
        area_sqft: 0,
        linear_ft: 0,
        dimensions: '',
        area_type: 'floor' as const,
        notes: null,
        display_order: prev.length,
        created_at: new Date().toISOString(),
        _new: true,
        _dirty: true,
      },
    ]);
  };

  const updateArea = (idx: number, field: string, value: any) => {
    setAreas((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value, _dirty: true } : a))
    );
  };

  const removeArea = (idx: number) => {
    const area = areas[idx];
    if (!area._new) {
      deleteArea.mutate({ id: area.id, measurement_id: measurement.id });
    }
    setAreas((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalSqft = areas
    .filter((a) => !['baseboard', 'handrail'].includes(a.area_type))
    .reduce((sum, a) => sum + Number(a.area_sqft || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave.mutateAsync({
        id: measurement.id,
        service_type: serviceType || null,
        material: material || null,
        finish_type: finishType || null,
        notes: notes || null,
        measured_by: measuredBy || null,
        status,
      });

      for (const area of areas) {
        if (area._dirty) {
          await upsertArea.mutateAsync({
            id: area._new ? undefined : area.id,
            measurement_id: measurement.id,
            room_name: area.room_name,
            area_sqft: Number(area.area_sqft) || 0,
            linear_ft: Number(area.linear_ft) || 0,
            dimensions: area.dimensions || undefined,
            area_type: area.area_type,
            display_order: area.display_order,
          });
        }
      }
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1">
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Status */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="active">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Medido por</label>
            <Input value={measuredBy} onChange={(e) => setMeasuredBy(e.target.value)} placeholder="Nome do técnico" />
          </div>
        </div>
      </div>

      {/* Areas */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Áreas</h3>
          <span className="text-sm text-muted-foreground">Total: {totalSqft.toLocaleString()} sqft</span>
        </div>

        <div className="space-y-3">
          {areas.map((area, idx) => (
            <div key={area.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Input
                  value={area.room_name}
                  onChange={(e) => updateArea(idx, 'room_name', e.target.value)}
                  placeholder="Nome do cômodo"
                  className="font-medium border-none shadow-none p-0 h-auto text-base focus-visible:ring-0"
                />
                <Button variant="ghost" size="icon" onClick={() => removeArea(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={area.area_type} onValueChange={(v: any) => updateArea(idx, 'area_type', v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={area.area_sqft || ''}
                  onChange={(e) => updateArea(idx, 'area_sqft', e.target.value)}
                  placeholder="0"
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">sqft</span>
                <Input
                  value={area.dimensions || ''}
                  onChange={(e) => updateArea(idx, 'dimensions', e.target.value)}
                  placeholder="20' x 20'"
                  className="flex-1 h-8 text-sm"
                />
              </div>
              {(area.area_type === 'baseboard' || area.area_type === 'handrail') && (
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={area.linear_ft || ''}
                    onChange={(e) => updateArea(idx, 'linear_ft', e.target.value)}
                    placeholder="0"
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">linear ft</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addArea} className="w-full gap-1 border-dashed">
          <Plus className="w-4 h-4" /> Adicionar Área
        </Button>
      </div>

      {/* Specs */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Especificações Técnicas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tipo de Serviço</label>
            <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Ex: Sanding & Refinish" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Material</label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ex: Oak Hardwood" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Acabamento</label>
            <Input value={finishType} onChange={(e) => setFinishType(e.target.value)} placeholder="Ex: Natural Gloss" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Observações</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre o local, condições do piso, etc."
          rows={3}
        />
      </div>
    </div>
  );
}

// --- Create Dialog ---
function CreateMeasurementDialog({
  open, onClose, projects, onCreate, defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  projects: any[];
  onCreate: any;
  defaultProjectId?: string;
}) {
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [date, setDate] = useState('');
  const [measuredBy, setMeasuredBy] = useState('');

  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  const handleCreate = () => {
    if (!projectId) return;
    onCreate.mutate(
      {
        project_id: projectId,
        measurement_date: date || undefined,
        measured_by: measuredBy || undefined,
        status: 'scheduled',
      },
      {
        onSuccess: () => {
          onClose();
          setProjectId('');
          setDate('');
          setMeasuredBy('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Medição</DialogTitle>
          <DialogDescription>Vincule a um projeto existente para iniciar o registro de medidas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Projeto *</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.customer_name} — {p.project_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Data da Medição</label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Medido por</label>
            <Input value={measuredBy} onChange={(e) => setMeasuredBy(e.target.value)} placeholder="Nome do técnico" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!projectId || onCreate.isPending}>
            {onCreate.isPending ? 'Criando...' : 'Criar Medição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
