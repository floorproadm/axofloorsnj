import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
import {
  Pencil, Save, X, Loader2, Users, CheckSquare, MessageSquare, ImageIcon, Receipt,
  Ruler, ChevronRight, Plus, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjectActivity, useProjectOpenTasks } from '@/hooks/useProjectActivity';
import { useMeasurements } from '@/hooks/useMeasurements';
import { FullMeasurementDialog } from './FullMeasurementDialog';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  project: any;
}

export function ProjectKernelOverview({ project }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    address: '', city: '', zip_code: '',
    project_type: '', square_footage: '' as string | number,
    labor_sqft_rate: '' as string | number, notes: '',
  });

  useEffect(() => {
    if (project) {
      setForm({
        customer_name: project.customer_name || '',
        customer_phone: project.customer_phone || '',
        customer_email: project.customer_email || '',
        address: project.address || '',
        city: project.city || '',
        zip_code: project.zip_code || '',
        project_type: project.project_type || '',
        square_footage: project.square_footage ?? '',
        labor_sqft_rate: project.labor_sqft_rate ?? '',
        notes: project.notes || '',
      });
    }
  }, [project, editing]);

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', project.id],
    queryFn: async () => {
      const { data: links } = await supabase
        .from('project_members')
        .select('user_id, role')
        .eq('project_id', project.id);
      if (!links || links.length === 0) return [];
      const userIds = links.map((l: any) => l.user_id);
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return links.map((l: any) => ({
        user_id: l.user_id,
        role: l.role,
        full_name: byId.get(l.user_id)?.full_name,
        avatar_url: byId.get(l.user_id)?.avatar_url,
      }));
    },
  });

  const { data: activity } = useProjectActivity(project.id);
  const { data: openTasks } = useProjectOpenTasks(project.id);
  const { data: measurements = [] } = useMeasurements(project.id);

  const totals = measurements.reduce(
    (acc, m) => ({
      sqft: acc.sqft + Number(m.total_sqft || 0),
      linear: acc.linear + Number(m.total_linear_ft || 0),
    }),
    { sqft: 0, linear: 0 }
  );

  async function handleSave() {
    setSaving(true);
    const payload: any = {
      customer_name: form.customer_name || null,
      customer_phone: form.customer_phone || null,
      customer_email: form.customer_email || null,
      address: form.address || null,
      city: form.city || null,
      zip_code: form.zip_code || null,
      project_type: form.project_type || null,
      square_footage: form.square_footage === '' ? null : Number(form.square_footage),
      labor_sqft_rate: form.labor_sqft_rate === '' ? null : Number(form.labor_sqft_rate),
      notes: form.notes || null,
    };
    const { error } = await supabase.from('projects').update(payload).eq('id', project.id);
    setSaving(false);
    if (error) return toast.error('Could not save', { description: error.message });
    toast.success('Saved');
    setEditing(false);
    qc.invalidateQueries({ queryKey: ['project-detail', project.id] });
  }

  async function handleCompleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) return toast.error('Could not complete');
    toast.success('Task completed');
    qc.invalidateQueries({ queryKey: ['project-open-tasks', project.id] });
    qc.invalidateQueries({ queryKey: ['project-activity', project.id] });
  }

  function initials(name?: string | null) {
    if (!name) return '?';
    return name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Identity — main column */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Resumo do projeto</CardTitle>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5 h-7">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving} className="gap-1.5 h-7">
                <X className="h-3.5 w-3.5" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-7">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Cliente"><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></Field>
              <Field label="Telefone"><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></Field>
              <Field label="Tipo"><Input value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Endereço">
                  <AddressAutocomplete
                    value={form.address}
                    onChange={(v) => setForm({ ...form, address: v })}
                    onSelect={(r) => setForm({ ...form, address: r.street || r.full, city: r.city || form.city, zip_code: r.zip || form.zip_code })}
                    placeholder="Comece a digitar..."
                  />
                </Field>
              </div>
              <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="Zip"><Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} /></Field>
              <Field label="Área (sq ft)"><Input type="number" value={form.square_footage} onChange={(e) => setForm({ ...form, square_footage: e.target.value })} /></Field>
              <Field label="Labor $/sqft"><Input type="number" step="0.01" value={form.labor_sqft_rate} onChange={(e) => setForm({ ...form, labor_sqft_rate: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Notas"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ReadItem label="Telefone" value={project.customer_phone} />
                <ReadItem label="Email" value={project.customer_email} />
                <ReadItem label="Área" value={project.square_footage ? `${project.square_footage} sq ft` : null} />
                <ReadItem label="Labor Rate" value={project.labor_sqft_rate ? `$${Number(project.labor_sqft_rate).toFixed(2)}/sqft` : null} />
                <ReadItem label="Criado em" value={format(new Date(project.created_at), 'dd/MM/yyyy', { locale: ptBR })} />
                {project.start_date && (
                  <ReadItem label="Início" value={format(new Date(project.start_date), 'dd/MM/yyyy', { locale: ptBR })} />
                )}
              </div>
              {project.notes && (
                <div className="mt-3 p-2.5 bg-muted/40 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Measurements summary — side card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-primary" /> Medidas
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setMeasurementOpen(true)} className="h-7 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nova
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {measurements.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center">Sem medidas</p>
          ) : (
            <>
              <div className="flex gap-3 mb-3 text-sm tabular-nums">
                {totals.sqft > 0 && (
                  <span className="font-semibold">{totals.sqft.toLocaleString()}<span className="text-muted-foreground font-normal text-xs ml-0.5">sqft</span></span>
                )}
                {totals.linear > 0 && (
                  <span className="font-semibold">{totals.linear.toLocaleString()}<span className="text-muted-foreground font-normal text-xs ml-0.5">ln ft</span></span>
                )}
              </div>
              <div className="space-y-1">
                {measurements.slice(0, 4).map((m) => (
                  <Link
                    key={m.id}
                    to={`/admin/measurements?id=${m.id}`}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded text-xs"
                  >
                    <span className="truncate">
                      {m.measurement_date ? format(new Date(m.measurement_date), 'dd/MM') : '—'}
                      <span className="text-muted-foreground ml-1.5">
                        {m.total_sqft > 0 && `${m.total_sqft} sqft`}
                        {m.total_linear_ft > 0 && ` · ${m.total_linear_ft} lf`}
                      </span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Crew */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Sem equipe atribuída</p>
          ) : (
            <div className="space-y-1.5">
              {members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                    <AvatarFallback className="text-[10px] bg-muted">{initials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.full_name ?? 'Sem nome'}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Tasks */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" /> Tarefas abertas
            {openTasks && openTasks.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">({openTasks.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!openTasks || openTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Nenhuma</p>
          ) : (
            <div className="space-y-1.5">
              {openTasks.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-start gap-2 rounded border p-2 hover:bg-muted/40 transition">
                  <button
                    onClick={() => handleCompleteTask(t.id)}
                    className="h-4 w-4 rounded border border-muted-foreground/40 hover:border-[hsl(var(--state-success))] mt-0.5 shrink-0 flex items-center justify-center group"
                    title="Marcar concluída"
                  >
                    <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-success))] opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.due_date ? `Vence ${format(new Date(t.due_date), 'dd/MM')}` : t.priority}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Atividade recente
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!activity || activity.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Sem atividade</p>
          ) : (
            <div className="space-y-1.5">
              {activity.slice(0, 6).map((a: any) => {
                const Icon = a.kind === 'comment' ? MessageSquare : a.kind === 'task' ? CheckSquare : a.kind === 'media' ? ImageIcon : Receipt;
                return (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <Icon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground/90 truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.subtitle && `${a.subtitle} · `}
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FullMeasurementDialog open={measurementOpen} onOpenChange={setMeasurementOpen} projectId={project.id} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReadItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="p-2.5 bg-muted/30 rounded-lg">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {value ? (
        <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground/60 mt-0.5">—</p>
      )}
    </div>
  );
}
