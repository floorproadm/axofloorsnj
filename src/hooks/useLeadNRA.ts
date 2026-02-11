import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeadNRA {
  action: string;
  label: string;
  severity: 'normal' | 'critical' | 'blocked' | 'error' | 'none';
}

interface UseLeadNRAReturn {
  nra: LeadNRA | null;
  loading: boolean;
  refresh: () => void;
}

export function useLeadNRA(leadId?: string): UseLeadNRAReturn {
  const [nra, setNra] = useState<LeadNRA | null>(null);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => setTrigger(t => t + 1), []);

  useEffect(() => {
    if (!leadId) {
      setNra(null);
      return;
    }

    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_lead_nra', { p_lead_id: leadId });
        if (!error && data) {
          setNra(data as unknown as LeadNRA);
        } else {
          setNra(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId, trigger]);

  return { nra, loading, refresh };
}

/**
 * Batch-fetch NRA for multiple leads (used in pipeline cards).
 * Calls RPC once per lead — acceptable for <50 active leads.
 */
export function useLeadNRABatch(leadIds: string[]) {
  const [nraMap, setNraMap] = useState<Record<string, LeadNRA>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leadIds.length === 0) {
      setNraMap({});
      return;
    }

    setLoading(true);

    Promise.all(
      leadIds.map(id =>
        supabase
          .rpc('get_lead_nra', { p_lead_id: id })
          .then(({ data }) => ({ id, nra: data as unknown as LeadNRA | null }))
      )
    ).then(results => {
      const map: Record<string, LeadNRA> = {};
      results.forEach(r => {
        if (r.nra) map[r.id] = r.nra;
      });
      setNraMap(map);
    }).finally(() => setLoading(false));
  }, [leadIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { nraMap, loading };
}
