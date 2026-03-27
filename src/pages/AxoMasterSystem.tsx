import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { TABS, NODE_DATA, type TabConfig, type MasterNode, type NodeData } from "@/data/axoMasterSystem";

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
    const sx = f.cx, sy = f.bottom;
    const ex = t.cx, ey = t.top - 2;
    return `M${sx} ${sy} C${sx} ${sy + 25},${ex} ${ey - 25},${ex} ${ey}`;
  }

  // loop back up
  const lx = Math.min(f.left, t.left) - 55;
  return `M${f.left} ${f.cy} Q${lx} ${f.cy},${lx} ${(f.cy + t.cy) / 2} Q${lx} ${t.cy},${t.right} ${t.cy}`;
}

// ══════════════════════════════════════════════
// NODE COMPONENT
// ══════════════════════════════════════════════
function NodeCard({ node, active, onClick }: { node: MasterNode; active: boolean; onClick: () => void }) {
  const c = COLOR_MAP[node.color];
  const isAxo = node.color === "axo";
  return (
    <div
      onClick={onClick}
      className="absolute flex flex-col justify-center items-center text-center cursor-pointer select-none transition-all duration-150 z-[2] hover:z-10"
      style={{
        left: node.x,
        top: node.y,
        width: node.w || 120,
        height: node.h,
        borderRadius: 7,
        padding: "9px 11px",
        background: c.bg,
        border: active
          ? `2px solid ${c.hover}`
          : isAxo
            ? `2px solid ${c.border}`
            : `1px solid ${c.border}`,
        boxShadow: active ? `0 0 0 2px ${c.border}` : undefined,
        transform: active ? "translateY(-2px)" : undefined,
      }}
    >
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", color: "#404850", marginBottom: 3, lineHeight: 1.2 }}>
        {node.tag}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.title, lineHeight: 1.3 }}>
        {node.title}
      </div>
      {node.subtitle && (
        <div style={{ fontSize: 9, color: "#7a8490", marginTop: 3, lineHeight: 1.3 }}>
          {node.subtitle}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// DETAIL PANEL
// ══════════════════════════════════════════════
function DetailPanel({ data, onClose }: { data: NodeData; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[560px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto rounded-t-[14px] sm:rounded-[14px]"
        style={{ background: "#141618", border: "1px solid #323a3f", padding: 24 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-[26px] h-[26px] rounded-full flex items-center justify-center text-[#7a8490] transition-colors"
          style={{ background: "#1c1f21", border: "1px solid #252a2d" }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Eyebrow */}
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: data.color, marginBottom: 5 }}>
          {data.eyebrow}
        </div>

        {/* Title */}
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em", color: "#dde2e6", marginBottom: 6 }}>
          {data.title}
        </div>

        {/* Intro */}
        <div style={{ fontSize: 12, color: "#7a8490", lineHeight: 1.7, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #252a2d" }}>
          {data.intro}
        </div>

        {/* Sections */}
        {data.sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#404850", margin: "12px 0 7px" }}>
              {sec.title}
            </div>
            <div className="flex flex-col gap-1.5">
              {sec.items.map((item, ii) => (
                <div key={ii} className="flex items-start gap-2.5" style={{ padding: "8px 10px", borderRadius: 6, background: "#1c1f21", border: "1px solid #252a2d", fontSize: 12, color: "#dde2e6", lineHeight: 1.4 }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: sec.color }} />
                  <div>
                    <div>{item.t}</div>
                    {item.s && <div style={{ fontSize: 10, color: "#7a8490", marginTop: 2 }}>{item.s}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* AXO Box */}
        {data.axo && (
          <div style={{ background: "#181208", border: "1px solid #7a5a18", borderRadius: 8, padding: "11px 13px", marginTop: 10 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#c9952a", marginBottom: 4 }}>
              ⬡ {data.axo.t}
            </div>
            <div style={{ fontSize: 11, color: "#907848", lineHeight: 1.7 }}>
              {data.axo.x}
            </div>
          </div>
        )}

        {/* Loop Box */}
        {data.loopBox && (
          <div className="flex flex-wrap gap-1.5 items-center" style={{ background: "#0a1410", border: "1px solid #1a4a2a", borderRadius: 8, padding: "9px 12px", marginTop: 10 }}>
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
      {/* Import Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #252a2d" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#404850", marginBottom: 5 }}>
          AXO Floors LLC · Sistema Operacional
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", color: "#dde2e6" }}>
          AXO Master System
        </div>
        <div style={{ fontSize: 11, color: "#7a8490", marginTop: 3, marginBottom: 16 }}>
          Clique em qualquer nó para ver os detalhes — use as abas para navegar entre os sistemas
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto" style={{ gap: 0, scrollbarWidth: "none" }}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleTabSwitch(i)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                padding: "11px 18px",
                border: "none",
                background: "none",
                color: activeTab === i ? "#c9952a" : "#7a8490",
                cursor: "pointer",
                borderBottom: activeTab === i ? "2px solid #c9952a" : "2px solid transparent",
                whiteSpace: "nowrap",
                transition: "color .15s, border-color .15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Pane */}
      <div style={{ padding: "28px 24px 60px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "#404850", marginBottom: 6 }}>
          {tab.paneLabel}
        </div>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em", color: "#dde2e6", marginBottom: 4 }}>
          {tab.paneTitle}
        </div>
        <div style={{ fontSize: 12, color: "#7a8490", marginBottom: 24, lineHeight: 1.6 }}>
          {tab.paneSub}
        </div>

        {/* Chart */}
        <div className="w-full overflow-x-auto pb-5">
          <div className="relative mx-auto" style={{ width: tab.chartWidth, height: tab.chartHeight }}>
            {/* SVG Arrows */}
            <svg
              className="absolute top-0 left-0 w-full pointer-events-none overflow-visible z-[1]"
              style={{ height: tab.chartHeight }}
            >
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
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={arrow.dashed ? "#1a4a2a" : "#2a3238"}
                    strokeWidth="1.2"
                    strokeDasharray={arrow.dashed ? "5 4" : undefined}
                    markerEnd={`url(#${arrow.dashed ? "ahd" : "ah"}-${tab.id})`}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {tab.nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                active={selectedNode === node.id}
                onClick={() => setSelectedNode(node.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {nodeData && (
        <DetailPanel data={nodeData} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
