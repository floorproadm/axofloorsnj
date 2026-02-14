import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MeasurementArea {
  id: string;
  measurement_id: string;
  room_name: string;
  area_sqft: number;
  linear_ft: number;
  dimensions: string | null;
  area_type: 'floor' | 'staircase' | 'baseboard' | 'handrail' | 'other';
  notes: string | null;
  display_order: number;
  created_at: string;
}

export interface ProjectMeasurement {
  id: string;
  project_id: string;
  status: 'scheduled' | 'active' | 'completed';
  measurement_date: string | null;
  measured_by: string | null;
  total_sqft: number;
  total_linear_ft: number;
  service_type: string | null;
  material: string | null;
  finish_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  areas?: MeasurementArea[];
  project?: {
    customer_name: string;
    address: string | null;
    city: string | null;
    project_type: string;
  };
}

export function useMeasurements(projectId?: string) {
  return useQuery({
    queryKey: ['measurements', projectId],
    queryFn: async (): Promise<ProjectMeasurement[]> => {
      let query = supabase
        .from('project_measurements')
        .select('*, projects(customer_name, address, city, project_type)')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((m: any) => ({
        ...m,
        project: m.projects,
      }));
    },
  });
}

export function useMeasurementDetail(measurementId: string | undefined) {
  return useQuery({
    queryKey: ['measurement-detail', measurementId],
    queryFn: async (): Promise<ProjectMeasurement | null> => {
      if (!measurementId) return null;

      const { data: measurement, error } = await supabase
        .from('project_measurements')
        .select('*, projects(customer_name, address, city, project_type)')
        .eq('id', measurementId)
        .single();

      if (error) throw error;

      const { data: areas } = await supabase
        .from('measurement_areas')
        .select('*')
        .eq('measurement_id', measurementId)
        .order('display_order', { ascending: true });

      return {
        ...measurement,
        project: (measurement as any).projects,
        areas: (areas || []) as MeasurementArea[],
      } as ProjectMeasurement;
    },
    enabled: !!measurementId,
  });
}

export function useCreateMeasurement() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      measurement_date?: string;
      measured_by?: string;
      service_type?: string;
      material?: string;
      finish_type?: string;
      notes?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_measurements')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['measurements'] });
      toast({ title: '✓ Medição criada' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    },
  });
}

export function useUpdateMeasurement() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectMeasurement> & { id: string }) => {
      const { project, areas, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('project_measurements')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['measurements'] });
      qc.invalidateQueries({ queryKey: ['measurement-detail', data.id] });
      toast({ title: '✓ Medição atualizada' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    },
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_measurements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['measurements'] });
      toast({ title: '✓ Medição removida' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    },
  });
}

// --- Areas ---

export function useUpsertArea() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      measurement_id: string;
      room_name: string;
      area_sqft: number;
      linear_ft?: number;
      dimensions?: string;
      area_type?: string;
      notes?: string;
      display_order?: number;
    }) => {
      if (input.id) {
        const { id, ...updates } = input;
        const { data, error } = await supabase
          .from('measurement_areas')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('measurement_areas')
          .insert(input)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['measurement-detail', data.measurement_id] });
      qc.invalidateQueries({ queryKey: ['measurements'] });
    },
  });
}

export function useDeleteArea() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, measurement_id }: { id: string; measurement_id: string }) => {
      const { error } = await supabase
        .from('measurement_areas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { measurement_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['measurement-detail', data.measurement_id] });
      qc.invalidateQueries({ queryKey: ['measurements'] });
    },
  });
}
