---
name: Comprehensive Audit 2026-04-06
description: Full quality audit at current main — 2 bugs found (highlights FK + missing highlights in importer), compilation/tests/build all pass
type: project
---

Full audit performed 2026-04-06 on main branch (post v1.4.0, many uncommitted changes).

## Automated Checks
- TypeScript (tsconfig.main.json --noEmit): PASS, zero errors
- Vite build: PASS (1 chunk >500KB warning on renderer bundle — cosmetic)
- Tests: 29/29 passed across 4 test files (3.43s)

## Bugs Found

### CRITICAL: clearAllGames() missing highlights table deletion
`src/db.ts:1538-1548` — Omits `DELETE FROM highlights`. Since `highlights.game_id` has FK to `games(id)` and `foreign_keys = ON`, this will fail with FK constraint violation when highlights exist. Users cannot clear data.

### CRITICAL: Importer does not persist highlights
`src/importer.ts` — Neither `importReplay()` nor `importReplays()` calls `insertHighlights()`. Only `replayAnalyzer.ts` stores highlights. Bulk-imported games have no highlight data.

### WARNING: analyze:run handler also skips highlights insertion
`src/main/handlers/analysis.ts:126-148` — Same gap as importer when persisting new game rows.

### WARNING: Synchronous readFileSync for hashing on main thread
`src/main/handlers/analysis.ts:77,129` — Blocks Electron event loop during SHA-256 hashing. Importer uses async streaming hash correctly.

## Code Health
- 11 `as any` casts (3 DB query results, 1 importer hash loop, 1 analysis handler scope, 1 Onboarding, 5 Recharts prop typing)
- Zero TODO/FIXME/HACK/ts-ignore
- Conversion semantics verified correct throughout
- Division-by-zero guarded everywhere
- SQL injection properly mitigated (parameterized + allowlist)
- IPC security model correct (contextIsolation, validatePath, will-navigate blocked)
- Event listener cleanup present in preload and React components

**Why:** Tracks known bugs and establishes audit baseline for regression detection.
**How to apply:** The highlights FK bug and missing highlights insertion are the top priorities to fix before next release.
