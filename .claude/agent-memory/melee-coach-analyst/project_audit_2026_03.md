---
name: Pipeline domain audit April 2026
description: Findings from full Melee domain correctness audit of pipeline, stats, LLM, and renderer — updated 2026-04-06
type: project
---

Full audit completed 2026-04-06 covering conversion semantics, edgeguard detection, power shields, recovery tracking, signature stats, DB schema, adaptation signals, coaching prompt, highlights, and edge cases.

## Open bugs

1. **CRITICAL — highlights.ts uses array position (0/1) as slippi-js playerIndex**: `detectHighlights` receives `targetPlayerIndex` as 0 or 1 (array position in `gameSummary.players[]`) but uses it directly for `c.playerIndex` comparisons and `frames[f].players[idx]` lookups. These require actual slippi-js player indices (0-3 based on port). Breaks ALL highlight detection for offline replays on non-standard ports. processGame.ts line 172-184 passes literal 0 and 1.

2. **MEDIUM — Freefall states 35-37 missing from recovery/edgeguard detection**: playerSummary.ts lines 350-353 and 401-404. `LANDING_FALL_SPECIAL` (state 43, grounded) is checked instead of actual freefall states (35=FallSpecial, 36=FallSpecialFwd, 37=FallSpecialBack). Misses recovery situations where player is far offstage in freefall but above yMin.

3. **MEDIUM — isAirborne helper includes LANDING_FALL_SPECIAL (grounded state)**: helpers.ts line 95. Low impact since `pd.isAirborne` from slippi-js is checked first.

4. **MEDIUM — Sheik highlight description always says "downthrow"**: highlights.ts line 482 — hardcoded string even when conversion started from uthrow.

5. **LOW — Ganon "Ganoncide" label misleading**: highlights.ts line 557-559. Labels all side-B kills as Ganoncide, but true Ganoncide requires self-destruct.

6. **LOW — ICs prevNanaStocks hardcoded to 4**: signatureStats.ts line 389. Should initialize from first frame for non-4-stock rulesets.

7. **LOW — Adaptation grab frequency higherIsBetter**: adaptation.ts line 131 — not universally correct for characters like Puff/Peach.

8. **LOW — damageEfficiency sentinel value 999**: derivedInsights.ts line 152 — could confuse LLM.

9. **LOW — Zero-to-death requires exactly 0%**: highlights.ts line 114 — should use threshold <= 3% for port priority damage etc.

## Previously found bugs — now confirmed FIXED

- Recovery success rate inflation — stock transition detection now in playerSummary.ts lines 330-337
- Fox upthrowUpairs — now uses `moves.some()` instead of `moves[0]`
- Falcon upthrowKnees — now uses `moves.some()` (line 230) instead of `moves[0]`
- Stale comment on floatCancelAerials — code now has working detection
- Edgeguard kill detection — works for all deaths via prevOppStocks tracking
- Marth chain grab detection includes MOVE_BTHROW

## Confirmed correct

- All conversion.playerIndex semantics (victim) consistently correct across playerSummary.ts, derivedInsights.ts, signatureStats.ts — zero inversions found
- openingsPerKill/damagePerOpening — code uses `.ratio` everywhere, avoiding the inverted .count/.total trap
- Power shield detection logic: projectile reflect (GUARD_REFLECT) + physical powershield (GUARD_SET_OFF within 2-frame window) correct
- Shield pressure: shield size delta with 0.5 threshold, 30-frame gap tolerance, shield break via SHIELD_BREAK_FLY
- Recovery/edgeguard stock transition tracking correct (prevStocks/prevOppStocks)
- All 26 characters have signature stats with reasonable heuristics
- DI estimation: character-aware sigmoid scoring with opponent combo strength multipliers
- Coaching SYSTEM_PROMPT: high quality with data citations, timestamps, matchup awareness, DI caveats
- Adaptation signals: 13 metrics with full per-game trajectories
- Edge cases: timeout/LRAS handled, team games rejected, missing data handled defensively
- stripNulls correctly preserves zero values and false
- All division-by-zero paths guarded
- TypeScript compiles with strict mode

**Why:** These are Melee-specific correctness issues affecting stat accuracy, highlight detection, and coaching quality.
**How to apply:** Reference when fixing bugs or reviewing pipeline/stat changes. The highlights playerIndex bug is the highest-priority open issue.
