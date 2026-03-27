import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { TABS, type MasterNode, type TabConfig } from "@/data/axoMasterSystem";
import { useToast } from "@/hooks/use-toast";

interface NodeOverride {
  node_id: string;
  tab_id: string;
  title?: string | null;
  subtitle?: string | null;
  tag?: string | null;
  color?: string | null;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  is_custom: boolean;
  is_deleted: boolean;
}

export function useNodeOverrides() {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<NodeOverride[]>([]);
  const [loading, setLoading] = useState(true);

  // Load overrides
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("system_node_overrides")
        .select("*")
        .eq("organization_id", AXO_ORG_ID);
      if (!cancelled) {
        setOverrides((data as any[]) || []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Apply overrides to a tab's nodes
  const getTabNodes = useCallback((tab: TabConfig): MasterNode[] => {
    const tabOverrides = overrides.filter(o => o.tab_id === tab.id);
    
    // Start with static nodes, apply overrides
    const nodes: MasterNode[] = tab.nodes
      .filter(n => !tabOverrides.find(o => o.node_id === n.id && o.is_deleted))
      .map(n => {
        const ov = tabOverrides.find(o => o.node_id === n.id);
        if (!ov) return n;
        return {
          ...n,
          title: ov.title ?? n.title,
          subtitle: ov.subtitle ?? n.subtitle,
          tag: ov.tag ?? n.tag,
          color: (ov.color as MasterNode["color"]) ?? n.color,
          x: ov.x ?? n.x,
          y: ov.y ?? n.y,
          w: ov.w ?? n.w,
          h: ov.h ?? n.h,
        };
      });

    // Add custom nodes
    const customNodes = tabOverrides.filter(o => o.is_custom && !o.is_deleted);
    for (const cn of customNodes) {
      nodes.push({
        id: cn.node_id,
        tag: cn.tag || "Novo",
        title: cn.title || "Novo Node",
        subtitle: cn.subtitle || "",
        color: (cn.color as MasterNode["color"]) || "gold",
        x: cn.x || 100,
        y: cn.y || 100,
        w: cn.w || 140,
        h: cn.h,
      });
    }

    return nodes;
  }, [overrides]);

  // Save a node override
  const saveOverride = useCallback(async (tabId: string, nodeId: string, fields: Partial<NodeOverride>) => {
    const existing = overrides.find(o => o.tab_id === tabId && o.node_id === nodeId);
    const isCustom = existing?.is_custom || fields.is_custom || !TABS.find(t => t.id === tabId)?.nodes.find(n => n.id === nodeId);

    const record = {
      organization_id: AXO_ORG_ID,
      tab_id: tabId,
      node_id: nodeId,
      is_custom: isCustom,
      ...fields,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("system_node_overrides")
      .upsert(record as any, { onConflict: "organization_id,tab_id,node_id" });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return false;
    }

    // Update local state
    setOverrides(prev => {
      const idx = prev.findIndex(o => o.tab_id === tabId && o.node_id === nodeId);
      const newOv: NodeOverride = {
        node_id: nodeId,
        tab_id: tabId,
        is_custom: isCustom,
        is_deleted: false,
        ...existing,
        ...fields,
      };
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newOv;
        return updated;
      }
      return [...prev, newOv];
    });

    return true;
  }, [overrides, toast]);

  // Delete a node (mark as deleted)
  const deleteNode = useCallback(async (tabId: string, nodeId: string) => {
    return saveOverride(tabId, nodeId, { is_deleted: true });
  }, [saveOverride]);

  // Create a new custom node
  const createNode = useCallback(async (tabId: string, node: { tag: string; title: string; subtitle: string; color: string; x: number; y: number; w: number }) => {
    const nodeId = `custom-${Date.now()}`;
    return saveOverride(tabId, nodeId, {
      ...node,
      is_custom: true,
      is_deleted: false,
    });
  }, [saveOverride]);

  return { overrides, loading, getTabNodes, saveOverride, deleteNode, createNode };
}
