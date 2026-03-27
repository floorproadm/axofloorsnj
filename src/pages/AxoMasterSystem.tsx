import { useState, useEffect, useCallback, useRef } from "react";
import { X, Maximize2, PanelRightOpen, StickyNote, Save } from "lucide-react";
import axoLogo from "@/assets/axo-logo-official.png";
import { TABS, NODE_DATA, type TabConfig, type MasterNode, type NodeData } from "@/data/axoMasterSystem";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ══════════════════════════════════════════════
// COLOR MAP
// ══════════════════════════════════════════════
const COLOR_MAP = {
  gold:   { bg: "#1a1408", border: "#7a5a18", title: "#e8c870", hover: "#c9952a" },
  pine:   { bg: "#0a1410", border: "#1a4a2a", title: "#70d490", hover: "#3aaa60" },
  steel:  { bg: "#080e18", border: "#1a3a5a", title: "#7ac0f0", hover: "#4a9ad4" },
  violet: { bg: "#0c0a18", border: "#322a5a", title: "#b0a0f0", hover: "#8a7ad4" },
  ember:  { bg: "#180a04", border: "#6a2e12", title: "#f09060", hover: "#e07040" },
  teal:   { bg: "#041412", border: "#0a3028", title: "#60d4b8", hover: "#30c4a8" },
  axo:    { bg: "#181208", border: "#7a5a18", title: "#f0d870", hover: "#c9952a" },
};

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

function calcPath(tab: TabConfig, fromId: string, toId: string): string {
  const fNode = tab.nodes.find(n => n.id === fromId);
  const tNode = tab.nodes.find(n => n.id === toId);
  if (!fNode || !tNode) return "";
  const f = getNodeRect(fNode);
  const t = getNodeRect(tNode);
  const dy = t.cy - f.cy;
  const dx = t.cx - f.cx;

  if (tab.id === "influence") {
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
// NODE CARD
// ══════════════════════════════════════════════
function NodeCard({ node, active, onClick }: { node: MasterNode; active: boolean; onClick: () => void }) {
  const c = COLOR_MAP[node.color];
  const isAxo = node.color === "axo";
  return (
    <div
      onClick={onClick}
      className="absolute flex flex-col justify-center items-center text-center cursor-pointer select-none transition-all duration-150 z-[2] hover:z-10"
      style={{
        left: node.x, top: node.y, width: node.w || 120, height: node.h,
        borderRadius: 7, padding: "9px 11px",
        background: c.bg,
        border: active ? `2px solid ${c.hover}` : isAxo ? `2px solid ${c.border}` : `1px solid ${c.border}`,
        boxShadow: active ? `0 0 0 2px ${c.border}` : undefined,
        transform: active ? "translateY(-2px)" : undefined,
      }}
    >
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", color: "#404850", marginBottom: 3, lineHeight: 1.2 }}>{node.tag}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.title, lineHeight: 1.3 }}>{node.title}</div>
      {node.subtitle && <div style={{ fontSize: 9, color: "#7a8490", marginTop: 3, lineHeight: 1.3 }}>{node.subtitle}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════
// NOTION-LIKE DETAIL PANEL
// ══════════════════════════════════════════════
type PanelMode = "modal" | "sidebar" | "fullscreen";

function DetailPanel({ data, nodeId, mode, onClose, onModeChange }: {
  data: NodeData;
  nodeId: string;
  mode: PanelMode;
  onClose: () => void;
  onModeChange: (m: PanelMode) => void;
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      toast({ title: "Notas salvas" });
    }
  }, [notes, savedNotes, nodeId, toast]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [notes]);

  const hasUnsaved = notes !== savedNotes;

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
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" style={{ color: "#7a8490" }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#323a3f #141618" }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: data.color, marginBottom: 5 }}>
          {data.eyebrow}
        </div>

        {/* Title */}
        <div style={{ fontSize: mode === "fullscreen" ? 28 : 20, fontWeight: 600, letterSpacing: "-.02em", color: "#dde2e6", marginBottom: 8 }}>
          {data.title}
        </div>

        {/* Intro */}
        <div style={{ fontSize: 13, color: "#7a8490", lineHeight: 1.8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #252a2d" }}>
          {data.intro}
        </div>

        {/* Sections */}
        {data.sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#404850", margin: "14px 0 8px" }}>
              {sec.title}
            </div>
            <div className="flex flex-col gap-1.5">
              {sec.items.map((item, ii) => (
                <div key={ii} className="flex items-start gap-2.5" style={{ padding: "10px 12px", borderRadius: 6, background: "#1c1f21", border: "1px solid #252a2d", fontSize: 12, color: "#dde2e6", lineHeight: 1.5 }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: sec.color }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.t}</div>
                    {item.s && <div style={{ fontSize: 11, color: "#7a8490", marginTop: 2 }}>{item.s}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* AXO Box */}
        {data.axo && (
          <div style={{ background: "#181208", border: "1px solid #7a5a18", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#c9952a", marginBottom: 4 }}>
              ⬡ {data.axo.t}
            </div>
            <div style={{ fontSize: 11, color: "#907848", lineHeight: 1.7 }}>{data.axo.x}</div>
          </div>
        )}

        {/* Loop Box */}
        {data.loopBox && (
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

        {/* ═══ NOTES SECTION (Notion-like) ═══ */}
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
            placeholder={loading ? "Carregando..." : "Escreva suas anotações aqui...\n\nVocê pode usar este espaço para:\n• Ações pendentes\n• Observações estratégicas\n• Links e referências\n• Qualquer nota pessoal"}
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
        {/* Click-away overlay */}
        <div className="fixed inset-0 z-[-1]" onClick={onClose} />
        <div className="w-full h-full flex flex-col shadow-2xl" style={{ background: "#141618", borderLeft: "1px solid #252a2d" }}>
          {panelContent}
        </div>
      </div>
    );
  }

  // Default: modal (centered overlay)
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
// MAIN PAGE
// ══════════════════════════════════════════════
export default function AxoMasterSystem() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("modal");

  const tab = TABS[activeTab];
  const nodeData = selectedNode ? NODE_DATA[selectedNode] : null;

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

  return (
    <div className="min-h-screen" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#0c0e0f", color: "#dde2e6" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #252a2d" }}>
        <div className="flex items-center gap-3 mb-2">
          <img src={axoLogo} alt="AXO Floors" className="h-8 w-auto" />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#404850" }}>
            Sistema Operacional
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#7a8490", marginTop: 3, marginBottom: 16 }}>
          Clique em qualquer nó para ver os detalhes — use as abas para navegar entre os sistemas
        </div>
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
                const d = calcPath(tab, arrow.from, arrow.to);
                if (!d) return null;
                return (
                  <path key={i} d={d} fill="none" stroke={arrow.dashed ? "#1a4a2a" : "#2a3238"} strokeWidth="1.2"
                    strokeDasharray={arrow.dashed ? "5 4" : undefined}
                    markerEnd={`url(#${arrow.dashed ? "ahd" : "ah"}-${tab.id})`} />
                );
              })}
            </svg>
            {tab.nodes.map((node) => (
              <NodeCard key={node.id} node={node} active={selectedNode === node.id} onClick={() => setSelectedNode(node.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {nodeData && selectedNode && (
        <DetailPanel
          data={nodeData}
          nodeId={selectedNode}
          mode={panelMode}
          onClose={() => setSelectedNode(null)}
          onModeChange={setPanelMode}
        />
      )}
    </div>
  );
}
