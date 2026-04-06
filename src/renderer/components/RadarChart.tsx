import { useState, useMemo } from "react";
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import type { RadarStats, RadarGameStats } from "../radarStats";
import { computeRadarForPeriod } from "../radarStats";

// ── Axis labels ──────────────────────────────────────────────────────

const AXES: { key: keyof RadarStats; label: string }[] = [
  { key: "neutral", label: "Neutral" },
  { key: "punish", label: "Punish" },
  { key: "techSkill", label: "Tech Skill" },
  { key: "mixups", label: "Mixups" },
  { key: "edgeguard", label: "Edgeguard" },
  { key: "diQuality", label: "DI Quality" },
  { key: "defense", label: "Defense" },
  { key: "consistency", label: "Consistency" },
];

// ── Period definitions ───────────────────────────────────────────────

type Period = "none" | "week" | "month" | "3months";

function getPeriodDates(period: Period): { current: string; previous: string } | null {
  if (period === "none") return null;
  const now = new Date();
  const days = period === "week" ? 7 : period === "month" ? 30 : 90;
  const currentStart = new Date(now.getTime() - days * 86400000).toISOString();
  const previousStart = new Date(now.getTime() - days * 2 * 86400000).toISOString();
  return { current: currentStart, previous: previousStart };
}

// ── Tooltip ──────────────────────────────────────────────────────────

function RadarTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const { axis } = payload[0].payload;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      padding: "8px 12px",
      fontSize: 12,
      fontFamily: "var(--font-mono)",
    }}>
      <div style={{ color: "var(--text-dim)", fontSize: 10, marginBottom: 4 }}>{axis}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: p.stroke || p.color,
            display: "inline-block",
          }} />
          <span style={{ color: p.stroke || "var(--accent)", fontWeight: 700 }}>
            {Math.round(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface RadarProps {
  stats: RadarStats;
  /** Raw game data for computing time-based comparison. Optional. */
  games?: RadarGameStats[];
  /** Hide the period selector */
  hideComparison?: boolean;
}

export function PlayerRadar({ stats, games, hideComparison }: RadarProps) {
  const [period, setPeriod] = useState<Period>("none");

  const comparison = useMemo(() => {
    if (period === "none" || !games || games.length === 0) return null;
    const dates = getPeriodDates(period);
    if (!dates) return null;
    return computeRadarForPeriod(games, dates.previous, dates.current);
  }, [period, games]);

  const data = AXES.map(({ key, label }) => ({
    axis: label,
    current: stats[key],
    ...(comparison ? { previous: comparison[key] } : {}),
  }));

  const showComparison = comparison !== null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
          <PolarGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--text-dim)", fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)" } as any}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={6}
            tick={{ fill: "var(--text-dim)", fontSize: 8, fontFamily: "var(--font-mono)" } as any}
            axisLine={false}
          />

          {/* Previous period (if comparing) — rendered first so it's behind */}
          {showComparison && (
            <Radar
              name="Previous"
              dataKey="previous"
              stroke="var(--text-dim)"
              fill="var(--text-dim)"
              fillOpacity={0.05}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          )}

          {/* Current period */}
          <Radar
            name={showComparison ? "Current" : "Skill"}
            dataKey="current"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ r: 3.5, fill: "var(--bg-card)", strokeWidth: 2, stroke: "var(--accent)" } as any}
          />

          <Tooltip content={<RadarTooltip />} />
          {showComparison && (
            <Legend
              wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Period selector */}
      {!hideComparison && games && games.length >= 6 && (
        <div className="radar-period-selector">
          {(["none", "week", "month", "3months"] as Period[]).map((p) => (
            <button
              key={p}
              className={`radar-period-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "none" ? "All Time" : p === "week" ? "vs Last Week" : p === "month" ? "vs Last Month" : "vs Last 3mo"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
