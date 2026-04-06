---
name: LLM Integration Audit 2026-04-06
description: Deep audit of all LLM integration issues across providers, prompts, queue, streaming, and caching — supersedes 2026-03-22 audit
type: project
---

Full audit performed 2026-04-06. Many issues from the 2026-03-22 audit have been resolved (streaming added, max_tokens set, 5xx retries added, model-aware caching added). This report covers current remaining and new issues.

## Critical (3)
1. **Streaming retry corruption** — all providers retry on empty stream, but onChunk already sent partial data to renderer. Retry re-sends from beginning, duplicating text in UI.
2. **importAndAnalyze bypasses llmQueue** — src/importer.ts:578 calls callLLM directly, risking concurrent 429 errors.
3. **analyze:discovery not persisted** — analysis.ts:240-269 never calls insertCoachingAnalysis.

## High (6)
1. Gemini model listing puts API key in URL query param (handlers/llm.ts:39)
2. No provider fallback when selected provider is down
3. No temperature set — all providers default to 1.0
4. API keys stored plaintext in ~/.magi-melee/config.json
5. analyze:scoped doesn't pass scope/scopeIdentifier to insertCoachingAnalysis
6. analyze:recent caches against wrong game ID (oldest game of reversed set)

## Medium (8) and Low (7)
See full audit output in conversation for details.

**Why:** These issues affect reliability, cost, output quality, and user trust.
**How to apply:** Fix C1 (streaming corruption) first — it produces visibly broken output. C2 (queue bypass) next for reliability. H3 (temperature) is highest quality-per-effort improvement.
