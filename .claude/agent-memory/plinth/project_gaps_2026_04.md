---
name: Project Gaps (April 2026)
description: Significant missing features and open items as of 2026-04-04 recon
type: project
---

Practice plan tracking: table exists (practice_plans in db.ts), drill_1/2/3 columns exist, but NO db methods to read/write them, NO IPC handlers, NO UI surface. Dead table.

Why: Never built past schema definition.
How to apply: Any request touching practice plans needs full stack work — db methods, IPC handler, preload binding, UI component.

Session AI summary: `ai_summary TEXT` column in sessions table, but never populated anywhere in importer.ts, replayAnalyzer.ts, or db.ts methods. The spec calls for per-session coaching summaries.

Trends page filters: Trends.tsx has charts (recharts AreaChart) but NO matchup/stage/time-range/opponent filter controls. Spec calls for "filter by matchup, stage, time range, opponent." Only global chronological view exists.

Game Detail page: No dedicated route/page for a single game. Stock-by-stock timeline (StockTimeline component) is embedded in Dashboard, not accessible as a standalone drill-down from Sessions.

Signature stats transparency: `prompt.ts:145` mentions signatureStats but passes NO caveats about estimation methodology to the LLM. The signatureStats.ts module has no `caveats` field in its output type. Known gap per memory.

Test coverage holes: No tests for signatureStats, watcher, replayAnalyzer, llm, parsePool, detect-sets, or adaptation signals. Only pipeline (9 tests), db (13), importer (3 — shallow hash tests only), config (4).

Phase 5 features: Shareable coaching reports, opponent scouting, anonymous stat benchmarks — none started.

Uncommitted as of 2026-04-04: OpenAI max_tokens→max_completion_tokens fix, CoachingModal inline styles moved to components.css, Settings.tsx colorMode state sync fix, CSS discovery-watermark + hover transform suppression. All look like cleanup/fixes, nothing half-finished.
