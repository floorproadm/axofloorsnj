import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: number;
  ip: string;
  event: "hit" | "miss" | "blocked" | "error";
  latency_ms: number | null;
  style_name: string | null;
  reason: string | null;
  created_at: string;
};

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

function p(arr: number[], q: number) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

export default function VisualizerMetricsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [windowHours, setWindowHours] = useState(24);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("visualizer_usage")
      .select("id, ip, event, latency_ms, style_name, reason, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [windowHours]);

  const total = rows.length;
  const hits = rows.filter((r) => r.event === "hit").length;
  const misses = rows.filter((r) => r.event === "miss").length;
  const blocked = rows.filter((r) => r.event === "blocked").length;
  const errors = rows.filter((r) => r.event === "error").length;
  const cacheRate = pct(hits, hits + misses);

  const missLatencies = rows
    .filter((r) => r.event === "miss" && typeof r.latency_ms === "number")
    .map((r) => r.latency_ms as number);
  const p50 = p(missLatencies, 0.5);
  const p95 = p(missLatencies, 0.95);

  const byIp = new Map<string, { miss: number; blocked: number }>();
  for (const r of rows) {
    const e = byIp.get(r.ip) ?? { miss: 0, blocked: 0 };
    if (r.event === "miss") e.miss++;
    if (r.event === "blocked") e.blocked++;
    byIp.set(r.ip, e);
  }
  const topIps = Array.from(byIp.entries())
    .sort((a, b) => b[1].miss + b[1].blocked - (a[1].miss + a[1].blocked))
    .slice(0, 10);

  const blockReasons = rows
    .filter((r) => r.event === "blocked")
    .reduce<Record<string, number>>((acc, r) => {
      const k = r.reason ?? "unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">AI Floor Visualizer</h3>
        <div className="flex gap-1 p-1 rounded-md bg-white/5 border border-white/10">
          {[1, 24, 24 * 7].map((h) => (
            <button
              key={h}
              onClick={() => setWindowHours(h)}
              className={`text-xs px-2.5 py-1 rounded ${
                windowHours === h ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {h === 1 ? "1h" : h === 24 ? "24h" : "7d"}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat label="Total events" value={total} />
        <Stat label="Cache hit rate" value={cacheRate} hint={`${hits} hit · ${misses} miss`} />
        <Stat label="Model calls" value={misses} hint="billable" />
        <Stat label="Blocked (429)" value={blocked} />
        <Stat label="Errors" value={errors} />
        <Stat label="Miss latency" value={`${p50}/${p95}ms`} hint="p50 / p95" />
      </div>

      {/* Block reasons */}
      {Object.keys(blockReasons).length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">429 reasons</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(blockReasons).map(([k, v]) => (
              <Badge key={k} variant="secondary" className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                {k === "hour" ? "hourly limit" : k === "day" ? "daily limit" : k}: {v}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Top IPs */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Top IPs (by activity)</div>
        {topIps.length === 0 ? (
          <div className="text-sm text-white/40">No activity in window.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-white/50 text-xs">
              <tr><th className="text-left py-1">IP</th><th className="text-right">Miss</th><th className="text-right">Blocked</th></tr>
            </thead>
            <tbody>
              {topIps.map(([ip, c]) => (
                <tr key={ip} className="border-t border-white/5">
                  <td className="py-1 font-mono text-xs">{ip}</td>
                  <td className="text-right">{c.miss}</td>
                  <td className="text-right">{c.blocked > 0 ? <span className="text-amber-300">{c.blocked}</span> : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent events */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Recent events</div>
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-xs">
            <thead className="text-white/50 sticky top-0 bg-[#0B1120]">
              <tr>
                <th className="text-left py-1.5">Time</th>
                <th className="text-left">Event</th>
                <th className="text-left">IP</th>
                <th className="text-left">Stain</th>
                <th className="text-right">Latency</th>
                <th className="text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="py-1 text-white/60">{new Date(r.created_at).toLocaleString()}</td>
                  <td><EventBadge event={r.event} /></td>
                  <td className="font-mono text-white/70">{r.ip}</td>
                  <td className="text-white/70">{r.style_name ?? "—"}</td>
                  <td className="text-right text-white/70">{r.latency_ms != null ? `${r.latency_ms}ms` : "—"}</td>
                  <td className="text-white/50">{r.reason ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-xl font-semibold mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-white/40 mt-0.5">{hint}</div>}
    </div>
  );
}

function EventBadge({ event }: { event: Row["event"] }) {
  const styles: Record<Row["event"], string> = {
    hit: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    miss: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    blocked: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    error: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${styles[event]}`}>{event}</span>;
}
