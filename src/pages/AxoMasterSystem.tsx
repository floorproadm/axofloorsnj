import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, Maximize2, PanelRightOpen, StickyNote, Save, Plus, Trash2, Pencil, GripVertical, Check } from "lucide-react";
import axoLogo from "@/assets/axo-logo-official.png";
import { TABS, NODE_DATA, type TabConfig, type MasterNode, type NodeData } from "@/data/axoMasterSystem";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNodeOverrides } from "@/hooks/useNodeOverrides";

// ══════════════════════════════════════════════
// COLOR MAP
// ══════════════════════════════════════════════
const COLOR_MAP: Record<string, { bg: string; border: string; title: string; hover: string }> = {
  gold:   { bg: "#1a1408", border: "#7a5a18", title: "#e8c870", hover: "#c9952a" },
  pine:   { bg: "#0a1410", border: "#1a4a2a", title: "#70d490", hover: "#3aaa60" },
  steel:  { bg: "#080e18", border: "#1a3a5a", title: "#7ac0f0", hover: "#4a9ad4" },
  violet: { bg: "#0c0a18", border: "#322a5a", title: "#b0a0f0", hover: "#8a7ad4" },
  ember:  { bg: "#180a04", border: "#6a2e12", title: "#f09060", hover: "#e07040" },
  teal:   { bg: "#041412", border: "#0a3028", title: "#60d4b8", hover: "#30c4a8" },
  axo:    { bg: "#181208", border: "#7a5a18", title: "#f0d870", hover: "#c9952a" },
};

const COLOR_OPTIONS = ["gold", "pine", "steel", "violet", "ember", "teal", "axo"] as const;

// ══════════════════════════════════════════════
// SVG ARROW DRAWING
// ══════════════════════════════════════════════
function getNodeRect(node: MasterNode) {
  const w = node.w || 120;
  const h = node.h || 60;
  return {
    x: node.x, y: node.y, w, h,
    cx: node.x + w / 2, cy: node.y + h / 2,
    top: node.y, bottom: node.y + h,
    left: node.x, right: node.x + w,
  };
}

function calcPath(nodes: MasterNode[], tabId: string, fromId: string, toId: string): string {
  const fNode = nodes.find(n => n.id === fromId);
  const tNode = nodes.find(n => n.id === toId);
  if (!fNode || !tNode) return "";
  const f = getNodeRect(fNode);
  const t = getNodeRect(tNode);
  const dy = t.cy - f.cy;
  const dx = t.cx - f.cx;

  if (tabId === "influence") {
    const angle = Math.atan2(dy, dx);
    const sx = f.cx + Math.cos(angle) * (f.w / 2 + 2);
    const sy = f.cy + Math.sin(angle) * (f.h / 2 + 2);
    const ex = t.cx - Math.cos(angle) * (t.w / 2 + 4);
    const ey = t.cy - Math.sin(angle) * (t.h / 2 + 4);
    return `M${sx} ${sy} L${ex} ${ey}`;
  }
  if (Math.abs(dy) < 20 && Math.abs(dx) > 30) {
    const sx = dx > 0 ? f.right : f.left;
    const ex = dx > 0 ? t.left - 2 : t.right + 2;
    return `M${sx} ${f.cy} C${sx + 40} ${f.cy},${ex - 40} ${t.cy},${ex} ${t.cy}`;
  }
  if (dy > 20) {
    return `M${f.cx} ${f.bottom} C${f.cx} ${f.bottom + 25},${t.cx} ${t.top - 27},${t.cx} ${t.top - 2}`;
  }
  const lx = Math.min(f.left, t.left) - 55;
  return `M${f.left} ${f.cy} Q${lx} ${f.cy},${lx} ${(f.cy + t.cy) / 2} Q${lx} ${t.cy},${t.right} ${t.cy}`;
}

// ══════════════════════════════════════════════
// DRAGGABLE NODE CARD
// ══════════════════════════════════════════════
function NodeCard({ node, active, onClick, onDragEnd }: {
  node: MasterNode;
  active: boolean;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const c = COLOR_MAP[node.color] || COLOR_MAP.gold;
  const isAxo = node.color === "axo";
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number; moved: boolean } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !elRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
    if (dragRef.current.moved) {
      elRef.current.style.left = `${dragRef.current.nodeX + dx}px`;
      elRef.current.style.top = `${dragRef.current.nodeY + dy}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (dragRef.current.moved) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onDragEnd(Math.round(dragRef.current.nodeX + dx), Math.round(dragRef.current.nodeY + dy));
    } else {
      onClick();
    }
    dragRef.current = null;
  };

  return (
    <div
      ref={elRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute flex flex-col justify-center items-center text-center cursor-grab select-none transition-shadow duration-150 z-[2] hover:z-10 active:cursor-grabbing"
      style={{
        left: node.x, top: node.y, width: node.w || 120, height: node.h,
        borderRadius: 7, padding: "9px 11px",
        background: c.bg,
        border: active ? `2px solid ${c.hover}` : isAxo ? `2px solid ${c.border}` : `1px solid ${c.border}`,
        boxShadow: active ? `0 0 0 2px ${c.border}` : undefined,
        touchAction: "none",
      }}
    >
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", color: "#404850", marginBottom: 3, lineHeight: 1.2 }}>{node.tag}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.title, lineHeight: 1.3 }}>{node.title}</div>
      {node.subtitle && <div style={{ fontSize: 9, color: "#7a8490", marginTop: 3, lineHeight: 1.3 }}>{node.subtitle}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════
// EDITABLE FIELD
// ══════════════════════════════════════════════
function EditableField({ label, value, onChange, fontSize = 13 }: {
  label: string; value: string; onChange: (v: string) => void; fontSize?: number;
}) {
  return (
    <div className="mb-3">
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: ".12em", textTransform: "uppercase", color: "#404850", marginBottom: 4 }}>
        {label}
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full outline-none rounded px-2.5 py-1.5"
        style={{
          background: "#1c1f21",
          border: "1px solid #252a2d",
          color: "#dde2e6",
          fontSize,
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════
// INLINE TEXT — click to edit any text
// ══════════════════════════════════════════════
function InlineText({ value, onChange, style, placeholder, multiline, className }: {
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className={`cursor-text rounded px-1 -mx-1 transition-colors hover:bg-white/5 ${className || ""}`}
        style={{ ...style, minHeight: 18 }}
        title="Clique para editar"
      >
        {value || <span style={{ color: "#404850", fontStyle: "italic" }}>{placeholder || "Clique para editar..."}</span>}
      </div>
    );
  }

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (multiline) {
    return (
      <textarea
        ref={ref as any}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="w-full outline-none rounded px-1 -mx-1 resize-none"
        style={{ ...style, background: "#1c1f21", border: "1px solid #323a3f", minHeight: 50 }}
        rows={3}
      />
    );
  }

  return (
    <input
      ref={ref as any}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      className="w-full outline-none rounded px-1 -mx-1"
      style={{ ...style, background: "#1c1f21", border: "1px solid #323a3f" }}
    />
  );
}

// ══════════════════════════════════════════════
// DETAIL PANEL (Notion-like + Full Content Editing)
// ══════════════════════════════════════════════
type PanelMode = "modal" | "sidebar" | "fullscreen";

function DetailPanel({ data: baseData, nodeId, node, tabId, mode, onClose, onModeChange, onSaveNode, onDeleteNode, contentOverride, onSaveContent, editMode }: {
  data: NodeData | null;
  nodeId: string;
  node: MasterNode;
  tabId: string;
  mode: PanelMode;
  onClose: () => void;
  onModeChange: (m: PanelMode) => void;
  onSaveNode: (fields: { title?: string; subtitle?: string; tag?: string; color?: string }) => void;
  onDeleteNode: () => void;
  contentOverride: Partial<NodeData> | null;
  onSaveContent: (content: Partial<NodeData>) => void;
  editMode: boolean;
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editSubtitle, setEditSubtitle] = useState(node.subtitle || "");
  const [editTag, setEditTag] = useState(node.tag);
  const [editColor, setEditColor] = useState(node.color);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Merge base data with content override
  const data = useMemo<NodeData | null>(() => {
    if (!baseData && !contentOverride) return null;
    const base = baseData || { color: "#c9952a", eyebrow: node.tag, title: node.title, intro: "", sections: [] };
    if (!contentOverride) return base;
    return {
      ...base,
      eyebrow: contentOverride.eyebrow ?? base.eyebrow,
      title: contentOverride.title ?? base.title,
      intro: contentOverride.intro ?? base.intro,
      sections: contentOverride.sections ?? base.sections,
      axo: contentOverride.axo ?? base.axo,
      loopBox: contentOverride.loopBox ?? base.loopBox,
    };
  }, [baseData, contentOverride, node]);

  // Reset edit fields when node changes
  useEffect(() => {
    setEditTitle(node.title);
    setEditSubtitle(node.subtitle || "");
    setEditTag(node.tag);
    setEditColor(node.color);
    setIsEditing(false);
  }, [nodeId, node.title, node.subtitle, node.tag, node.color]);

  // Load notes from DB
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: row } = await supabase
        .from("system_node_notes")
        .select("content")
        .eq("node_id", nodeId)
        .eq("organization_id", AXO_ORG_ID)
        .maybeSingle();
      if (!cancelled) {
        const content = (row as any)?.content || "";
        setNotes(content);
        setSavedNotes(content);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [nodeId]);

  const saveNotes = useCallback(async () => {
    if (notes === savedNotes) return;
    setSaving(true);
    const { error } = await supabase
      .from("system_node_notes")
      .upsert(
        { node_id: nodeId, organization_id: AXO_ORG_ID, content: notes, updated_at: new Date().toISOString() },
        { onConflict: "node_id,organization_id" }
      );
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setSavedNotes(notes);
    }
  }, [notes, savedNotes, nodeId, toast]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [notes]);

  const hasUnsaved = notes !== savedNotes;

  const handleSaveEdit = () => {
    onSaveNode({ title: editTitle, subtitle: editSubtitle, tag: editTag, color: editColor });
    setIsEditing(false);
    toast({ title: "Card atualizado" });
  };

  // Content editing helpers
  const updateContent = useCallback((patch: Partial<NodeData>) => {
    const current = contentOverride || {};
    const base = baseData || { color: "#c9952a", eyebrow: node.tag, title: node.title, intro: "", sections: [] };
    onSaveContent({ ...current, ...patch });
  }, [contentOverride, baseData, node, onSaveContent]);

  const updateIntro = useCallback((intro: string) => updateContent({ intro }), [updateContent]);
  const updateEyebrow = useCallback((eyebrow: string) => updateContent({ eyebrow }), [updateContent]);

  const updateSectionTitle = useCallback((sIdx: number, title: string) => {
    const sections = [...(data?.sections || [])];
    sections[sIdx] = { ...sections[sIdx], title };
    updateContent({ sections });
  }, [data, updateContent]);

  const updateSectionItemT = useCallback((sIdx: number, iIdx: number, t: string) => {
    const sections = [...(data?.sections || [])];
    const items = [...sections[sIdx].items];
    items[iIdx] = { ...items[iIdx], t };
    sections[sIdx] = { ...sections[sIdx], items };
    updateContent({ sections });
  }, [data, updateContent]);

  const updateSectionItemS = useCallback((sIdx: number, iIdx: number, s: string) => {
    const sections = [...(data?.sections || [])];
    const items = [...sections[sIdx].items];
    items[iIdx] = { ...items[iIdx], s: s || undefined };
    sections[sIdx] = { ...sections[sIdx], items };
    updateContent({ sections });
  }, [data, updateContent]);

  const addSectionItem = useCallback((sIdx: number) => {
    const sections = [...(data?.sections || [])];
    const items = [...sections[sIdx].items, { t: "Novo item", s: "" }];
    sections[sIdx] = { ...sections[sIdx], items };
    updateContent({ sections });
  }, [data, updateContent]);

  const removeSectionItem = useCallback((sIdx: number, iIdx: number) => {
    const sections = [...(data?.sections || [])];
    const items = sections[sIdx].items.filter((_, i) => i !== iIdx);
    sections[sIdx] = { ...sections[sIdx], items };
    updateContent({ sections });
  }, [data, updateContent]);

  const addSection = useCallback(() => {
    const sections = [...(data?.sections || []), { title: "Nova Seção", color: "#c9952a", items: [{ t: "Novo item" }] }];
    updateContent({ sections });
  }, [data, updateContent]);

  const removeSection = useCallback((sIdx: number) => {
    const sections = (data?.sections || []).filter((_, i) => i !== sIdx);
    updateContent({ sections });
  }, [data, updateContent]);

  const c = COLOR_MAP[node.color] || COLOR_MAP.gold;

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#252a2d" }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange(mode === "sidebar" ? "modal" : "sidebar")}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            title={mode === "sidebar" ? "Modo modal" : "Modo sidebar"}
          >
            <PanelRightOpen className="w-4 h-4" style={{ color: mode === "sidebar" ? "#c9952a" : "#7a8490" }} />
          </button>
          <button
            onClick={() => onModeChange(mode === "fullscreen" ? "modal" : "fullscreen")}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            title={mode === "fullscreen" ? "Modo modal" : "Tela cheia"}
          >
            <Maximize2 className="w-4 h-4" style={{ color: mode === "fullscreen" ? "#c9952a" : "#7a8490" }} />
          </button>
          <div className="w-px h-4 mx-1" style={{ background: "#252a2d" }} />
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            title="Editar card"
          >
            <Pencil className="w-4 h-4" style={{ color: isEditing ? "#c9952a" : "#7a8490" }} />
          </button>
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja remover este node?")) onDeleteNode();
            }}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            title="Remover node"
          >
            <Trash2 className="w-4 h-4" style={{ color: "#7a8490" }} />
          </button>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" style={{ color: "#7a8490" }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#323a3f #141618" }}>
        {/* ═══ CARD EDIT MODE ═══ */}
        {isEditing && (
          <div style={{ background: "#1a1408", border: "1px solid #7a5a18", borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <Pencil className="w-3.5 h-3.5" style={{ color: "#c9952a" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#c9952a" }}>
                Editar Card
              </span>
            </div>
            <EditableField label="Tag" value={editTag} onChange={setEditTag} fontSize={11} />
            <EditableField label="Título" value={editTitle} onChange={setEditTitle} fontSize={14} />
            <EditableField label="Subtítulo" value={editSubtitle} onChange={setEditSubtitle} fontSize={12} />
            
            {/* Color picker */}
            <div className="mb-3">
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: ".12em", textTransform: "uppercase", color: "#404850", marginBottom: 6 }}>
                Cor
              </div>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map(co => (
                  <button
                    key={co}
                    onClick={() => setEditColor(co)}
                    className="w-7 h-7 rounded-md transition-all"
                    style={{
                      background: COLOR_MAP[co].bg,
                      border: editColor === co ? `2px solid ${COLOR_MAP[co].hover}` : `1px solid ${COLOR_MAP[co].border}`,
                      boxShadow: editColor === co ? `0 0 0 1px ${COLOR_MAP[co].border}` : undefined,
                    }}
                    title={co}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors mt-2"
              style={{ background: "#c9952a", color: "#0c0e0f" }}
            >
              <Save className="w-3 h-3" />
              Salvar alterações
            </button>
          </div>
        )}

        {/* Eyebrow — inline editable */}
        <InlineText
          value={data?.eyebrow || node.tag}
          onChange={updateEyebrow}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: data?.color || c.title, marginBottom: 5 }}
        />

        {/* Title — inline editable */}
        <InlineText
          value={data?.title || node.title}
          onChange={(title) => updateContent({ title })}
          style={{ fontSize: mode === "fullscreen" ? 28 : 20, fontWeight: 600, letterSpacing: "-.02em", color: "#dde2e6", marginBottom: 8 }}
        />

        {/* Intro — inline editable */}
        <InlineText
          value={data?.intro || ""}
          onChange={updateIntro}
          multiline
          placeholder="Clique para adicionar uma descrição..."
          style={{ fontSize: 13, color: "#7a8490", lineHeight: 1.8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #252a2d" }}
        />

        {/* Sections — inline editable */}
        {data?.sections?.map((sec, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div className="flex items-center justify-between" style={{ margin: "14px 0 8px" }}>
              <InlineText
                value={sec.title}
                onChange={(t) => updateSectionTitle(si, t)}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#404850" }}
              />
              <button
                onClick={() => { if (confirm("Remover esta seção?")) removeSection(si); }}
                className="p-1 rounded hover:bg-white/5"
                title="Remover seção"
              >
                <X className="w-3 h-3" style={{ color: "#404850" }} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {sec.items.map((item, ii) => (
                <div key={ii} className="group flex items-start gap-2.5" style={{ padding: "10px 12px", borderRadius: 6, background: "#1c1f21", border: "1px solid #252a2d", fontSize: 12, color: "#dde2e6", lineHeight: 1.5 }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: sec.color }} />
                  <div className="flex-1 min-w-0">
                    <InlineText
                      value={item.t}
                      onChange={(t) => updateSectionItemT(si, ii, t)}
                      style={{ fontWeight: 500, fontSize: 12, color: "#dde2e6" }}
                    />
                    <InlineText
                      value={item.s || ""}
                      onChange={(s) => updateSectionItemS(si, ii, s)}
                      placeholder="Descrição..."
                      style={{ fontSize: 11, color: "#7a8490", marginTop: 2 }}
                    />
                  </div>
                  <button
                    onClick={() => removeSectionItem(si, ii)}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-opacity shrink-0"
                    title="Remover item"
                  >
                    <X className="w-3 h-3" style={{ color: "#555" }} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addSectionItem(si)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors hover:bg-white/5"
                style={{ color: "#404850", border: "1px dashed #252a2d" }}
              >
                <Plus className="w-3 h-3" />
                Adicionar item
              </button>
            </div>
          </div>
        ))}

        {/* Add Section */}
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors hover:bg-white/5 mb-4"
          style={{ color: "#7a8490", border: "1px dashed #323a3f" }}
        >
          <Plus className="w-3 h-3" />
          Adicionar seção
        </button>

        {/* AXO Box — editable */}
        {data?.axo && (
          <div style={{ background: "#181208", border: "1px solid #7a5a18", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
            <InlineText
              value={data.axo.t}
              onChange={(t) => updateContent({ axo: { ...data.axo!, t } })}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#c9952a", marginBottom: 4 }}
            />
            <InlineText
              value={data.axo.x}
              onChange={(x) => updateContent({ axo: { ...data.axo!, x } })}
              multiline
              style={{ fontSize: 11, color: "#907848", lineHeight: 1.7 }}
            />
          </div>
        )}

        {/* Loop Box */}
        {data?.loopBox && (
          <div className="flex flex-wrap gap-1.5 items-center" style={{ background: "#0a1410", border: "1px solid #1a4a2a", borderRadius: 8, padding: "9px 12px", marginTop: 12 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#3aaa60" }}>
              {data.loopBox.label}
            </span>
            {data.loopBox.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: 10, color: "#3aaa60", background: "#0e2018", border: "1px solid #1a4a2a", borderRadius: 12, padding: "2px 8px" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ═══ NOTES SECTION ═══ */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #252a2d" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5" style={{ color: "#c9952a" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#c9952a" }}>
                Suas Anotações
              </span>
            </div>
            {hasUnsaved && (
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors"
                style={{ background: "#1a1408", border: "1px solid #7a5a18", color: "#c9952a" }}
              >
                <Save className="w-3 h-3" />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if (hasUnsaved) saveNotes(); }}
            placeholder={loading ? "Carregando..." : "Escreva suas anotações aqui...\n\n• Ações pendentes\n• Observações estratégicas\n• Links e referências"}
            className="w-full resize-none outline-none placeholder:text-[#404850]"
            style={{
              background: "transparent",
              border: "none",
              color: "#dde2e6",
              fontSize: 13,
              lineHeight: 1.8,
              minHeight: 120,
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            }}
          />
        </div>
      </div>
    </div>
  );

  // ═══ RENDER MODES ═══
  if (mode === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[200] flex" style={{ background: "#0c0e0f" }}>
        <div className="w-full h-full flex flex-col" style={{ background: "#141618" }}>
          {panelContent}
        </div>
      </div>
    );
  }

  if (mode === "sidebar") {
    return (
      <div className="fixed top-0 right-0 bottom-0 z-[200] flex" style={{ width: "min(520px, 45vw)" }}>
        <div className="fixed inset-0 z-[-1]" onClick={onClose} />
        <div className="w-full h-full flex flex-col shadow-2xl" style={{ background: "#141618", borderLeft: "1px solid #252a2d" }}>
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[580px] max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-[14px] sm:rounded-[14px] overflow-hidden"
        style={{ background: "#141618", border: "1px solid #323a3f" }}
      >
        {panelContent}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// NEW NODE DIALOG
// ══════════════════════════════════════════════
function NewNodeDialog({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (node: { tag: string; title: string; subtitle: string; color: string; x: number; y: number; w: number }) => void;
}) {
  const [tag, setTag] = useState("Novo");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [color, setColor] = useState<string>("gold");

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl overflow-hidden" style={{ background: "#141618", border: "1px solid #323a3f" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#252a2d" }}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" style={{ color: "#c9952a" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#c9952a" }}>
              Novo Node
            </span>
          </div>
        </div>
        <div className="px-5 py-4">
          <EditableField label="Tag" value={tag} onChange={setTag} fontSize={11} />
          <EditableField label="Título" value={title} onChange={setTitle} fontSize={14} />
          <EditableField label="Subtítulo" value={subtitle} onChange={setSubtitle} fontSize={12} />
          <div className="mb-4">
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: ".12em", textTransform: "uppercase", color: "#404850", marginBottom: 6 }}>
              Cor
            </div>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map(co => (
                <button
                  key={co}
                  onClick={() => setColor(co)}
                  className="w-7 h-7 rounded-md transition-all"
                  style={{
                    background: COLOR_MAP[co].bg,
                    border: color === co ? `2px solid ${COLOR_MAP[co].hover}` : `1px solid ${COLOR_MAP[co].border}`,
                    boxShadow: color === co ? `0 0 0 1px ${COLOR_MAP[co].border}` : undefined,
                  }}
                  title={co}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              if (!title.trim()) return;
              onCreate({ tag, title, subtitle, color, x: 100, y: 100, w: 140 });
              onClose();
            }}
            disabled={!title.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "#c9952a", color: "#0c0e0f" }}
          >
            <Plus className="w-4 h-4" />
            Criar Node
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════
export default function AxoMasterSystem() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("sidebar");
  const [showNewNode, setShowNewNode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { overrides, getTabNodes, saveOverride, deleteNode, createNode } = useNodeOverrides();

  const tab = TABS[activeTab];
  const tabNodes = getTabNodes(tab);
  const selectedNodeObj = selectedNode ? tabNodes.find(n => n.id === selectedNode) : null;
  const nodeData = selectedNode ? NODE_DATA[selectedNode] || null : null;

  // Get content override for selected node
  const selectedContentOverride = useMemo(() => {
    if (!selectedNode) return null;
    const ov = overrides.find(o => o.tab_id === tab.id && o.node_id === selectedNode);
    return (ov?.content as Partial<NodeData>) || null;
  }, [selectedNode, overrides, tab.id]);

  const handleSaveContent = useCallback((content: Partial<NodeData>) => {
    if (!selectedNode) return;
    saveOverride(tab.id, selectedNode, { content: content as any });
  }, [selectedNode, tab.id, saveOverride]);

  // Mobile defaults to modal
  useEffect(() => {
    if (isMobile) setPanelMode("modal");
  }, [isMobile]);

  const handleTabSwitch = useCallback((idx: number) => {
    setActiveTab(idx);
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNode(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleDragEnd = useCallback((nodeId: string, x: number, y: number) => {
    saveOverride(tab.id, nodeId, { x, y });
  }, [tab.id, saveOverride]);

  const handleSaveNode = useCallback((nodeId: string, fields: { title?: string; subtitle?: string; tag?: string; color?: string }) => {
    saveOverride(tab.id, nodeId, fields);
  }, [tab.id, saveOverride]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    deleteNode(tab.id, nodeId);
    setSelectedNode(null);
  }, [tab.id, deleteNode]);

  const handleCreateNode = useCallback((node: { tag: string; title: string; subtitle: string; color: string; x: number; y: number; w: number }) => {
    createNode(tab.id, node);
  }, [tab.id, createNode]);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#0c0e0f", color: "#dde2e6" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid #252a2d", background: "#111314" }}>
        <div className="flex items-center gap-3">
          <img src={axoLogo} alt="AXO Floors" className="h-7 w-auto" />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#404850" }}>
            Sistema Operacional
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={() => setShowNewNode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors hover:opacity-80"
              style={{ background: "#1a1408", border: "1px solid #7a5a18", color: "#c9952a" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Node
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors hover:opacity-80"
            style={{
              background: editMode ? "#1a1408" : "transparent",
              border: editMode ? "1px solid #7a5a18" : "1px solid #323a3f",
              color: editMode ? "#c9952a" : "#7a8490",
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
            {editMode ? "Editando" : "Editar"}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ padding: "0 24px", borderBottom: "1px solid #252a2d" }}>
        <div className="flex overflow-x-auto" style={{ gap: 0, scrollbarWidth: "none" }}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleTabSwitch(i)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
                padding: "11px 18px", border: "none", background: "none",
                color: activeTab === i ? "#c9952a" : "#7a8490", cursor: "pointer",
                borderBottom: activeTab === i ? "2px solid #c9952a" : "2px solid transparent",
                whiteSpace: "nowrap", transition: "color .15s, border-color .15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Pane */}
      <div style={{ padding: "28px 24px 60px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "#404850", marginBottom: 6 }}>{tab.paneLabel}</div>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em", color: "#dde2e6", marginBottom: 4 }}>{tab.paneTitle}</div>
        <div style={{ fontSize: 12, color: "#7a8490", marginBottom: 24, lineHeight: 1.6 }}>{tab.paneSub}</div>

        <div className="w-full overflow-x-auto pb-5">
          <div className="relative mx-auto" style={{ width: tab.chartWidth, height: tab.chartHeight }}>
            <svg className="absolute top-0 left-0 w-full pointer-events-none overflow-visible z-[1]" style={{ height: tab.chartHeight }}>
              <defs>
                <marker id={`ah-${tab.id}`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M1 1L6 4L1 7" fill="none" stroke="#404850" strokeWidth="1.5" strokeLinecap="round" />
                </marker>
                <marker id={`ahd-${tab.id}`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M1 1L6 4L1 7" fill="none" stroke="#1a4a2a" strokeWidth="1.5" strokeLinecap="round" />
                </marker>
              </defs>
              {tab.arrows.map((arrow, i) => {
                const d = calcPath(tabNodes, tab.id, arrow.from, arrow.to);
                if (!d) return null;
                return (
                  <path key={i} d={d} fill="none" stroke={arrow.dashed ? "#1a4a2a" : "#2a3238"} strokeWidth="1.2"
                    strokeDasharray={arrow.dashed ? "5 4" : undefined}
                    markerEnd={`url(#${arrow.dashed ? "ahd" : "ah"}-${tab.id})`} />
                );
              })}
            </svg>
            {tabNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                active={selectedNode === node.id}
                onClick={() => setSelectedNode(node.id)}
                onDragEnd={(x, y) => handleDragEnd(node.id, x, y)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNodeObj && selectedNode && (
        <DetailPanel
          data={nodeData}
          nodeId={selectedNode}
          node={selectedNodeObj}
          tabId={tab.id}
          mode={panelMode}
          onClose={() => setSelectedNode(null)}
          onModeChange={setPanelMode}
          onSaveNode={(fields) => handleSaveNode(selectedNode, fields)}
          onDeleteNode={() => handleDeleteNode(selectedNode)}
          contentOverride={selectedContentOverride}
          onSaveContent={handleSaveContent}
        />
      )}

      {/* New Node Dialog */}
      {showNewNode && (
        <NewNodeDialog
          onClose={() => setShowNewNode(false)}
          onCreate={handleCreateNode}
        />
      )}
    </div>
  );
}
