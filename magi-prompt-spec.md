# MAGI: System Prompt & Data Pipeline

## Overview

This document defines two things:
1. The **data pipeline** — how raw Slippi replay data gets transformed into structured context for the LLM
2. The **system prompt** — the instructions that turn a general-purpose LLM into a Melee coach

The key principle: **the intelligence comes from the data pipeline, not the model.** A well-structured
summary of a game gives any decent model enough to produce specific, actionable coaching insights.

---

## Part 1: Data Pipeline (slippi-js → LLM context)

### Pipeline Modules

The pipeline lives in `src/pipeline/` and is barrel-exported via `index.ts`:

| Module | Purpose |
|--------|---------|
| `processGame.ts` | Main orchestrator — parses .slp via `SlippiGame`, returns `GameResult` |
| `playerSummary.ts` | Builds per-player stats (neutral, conversions, movement, recovery, edgeguards) |
| `signatureStats.ts` | Character-specific stat detection for all 26 characters |
| `derivedInsights.ts` | Habit profiles, key moments, performance by stock |
| `adaptation.ts` | Cross-game adaptation signals for multi-game sets |
| `highlights.ts` | Detects notable moments (zero-to-deaths, spikes, high-damage, JVs) |
| `prompt.ts` | System prompts + prompt assembly functions |
| `helpers.ts` | Shared utilities (frame conversion, action state classifiers, stage bounds, move ID mapping) |
| `characterData.ts` | Character metadata |
| `types.ts` | All TypeScript interfaces |

### What slippi-js gives us (via `game.getStats()` and `game.getFrames()`)

```
settings:       stage, characters, ports, player tags/codes
metadata:       platform, start time, duration
stats:          conversions, combos, actionCounts, overall stats per player
frames:         per-frame state for each player (position, action state, inputs, damage, stocks, etc.)
```

### What we compute from that raw data

The data pipeline produces a **GameResult** for each game, containing:

```typescript
interface GameResult {
  gameSummary: GameSummary;
  highlights: GameHighlight[];
}

interface GameSummary {
  // --- Context ---
  gameNumber: number;
  stage: string;
  duration: number;              // seconds
  result: {
    winner: string;
    endMethod: string;           // "stocks" | "timeout" | "LRAS"
    finalStocks: [number, number];
    finalPercents: [number, number];
  };

  // --- Per-player stats ---
  players: [PlayerSummary, PlayerSummary];

  // --- Higher-level analysis ---
  derivedInsights: DerivedInsights;
}

interface PlayerSummary {
  tag: string;
  character: string;

  // Neutral game
  neutralWins: number;
  neutralLosses: number;
  counterHits: number;
  neutralWinRate: number;

  // Openings & conversions
  openingsPerKill: number;
  totalOpenings: number;
  totalConversions: number;
  conversionRate: number;
  averageDamagePerOpening: number;
  killConversions: number;

  // Movement & positioning
  avgStagePosition: { x: number };
  timeOnPlatform: number;
  timeInAir: number;
  timeAtLedge: number;

  // Defense & recovery
  totalDamageTaken: number;
  avgDeathPercent: number;
  recoveryAttempts: number;
  recoverySuccessRate: number;

  // Edgeguarding
  edgeguardAttempts: number;
  edgeguardSuccessRate: number;

  // Shield pressure
  shieldPressureSequences: number;
  shieldPressureAvgDamage: number;
  shieldBreaks: number;
  shieldPokeRate: number;
  powerShieldCount: number;

  // DI quality
  diSurvivalScore: number;
  diComboScore: number;
  diAvgComboLengthReceived: number;
  diAvgComboLengthDealt: number;

  // Tech skill indicators
  lCancelRate: number;
  wavedashCount: number;
  dashDanceFrames: number;

  // Action frequencies (top moves)
  moveUsage: {
    move: string;
    count: number;
    hitRate: number;
  }[];

  // Stock-by-stock breakdown
  stocks: {
    stockNumber: number;
    percentLost: number;
    killMove: string | null;
    duration: number;
    openingsGiven: number;
    damageDealt: number;
  }[];

  // Character-specific signature stats (typed per character)
  signatureStats?: CharacterSignatureStats;
}
```

### Derived insights (computed before prompting)

```typescript
interface DerivedInsights {
  // Habit detection — option distributions after specific game states
  afterKnockdown: {
    options: { action: string; frequency: number }[];
    entropy: number;             // 0 = always same, 1 = perfectly mixed
  };
  afterLedgeGrab: {
    options: { action: string; frequency: number }[];
    entropy: number;
  };
  afterShieldPressure: {
    options: { action: string; frequency: number }[];
    entropy: number;
  };

  // Momentum shifts
  performanceByStock: {
    stock: number;
    neutralWinRate: number;
    damageEfficiency: number;
  }[];

  // Key moments with timestamps
  keyMoments: {
    timestamp: string;           // "HH:MM" format
    description: string;
  }[];

  // Punish quality
  bestConversion: {
    moves: string[];
    totalDamage: number;
    startPercent: number;
    endedInKill: boolean;
    timestamp?: string;
  };
  worstMissedPunish: {
    opener: string;
    damageDealt: number;
    opponentPercent: number;
    timestamp?: string;
  } | null;

  // Adaptation signals (multi-game sets only)
  adaptationSignals: {
    metric: string;
    game1Value: number;
    lastGameValue: number;
    direction: "improving" | "declining" | "stable";
  }[];
}
```

### Highlight detection

```typescript
interface GameHighlight {
  id: string;
  gameId: string;
  type: "zero-to-death" | "spike-kill" | "high-damage" | "four-stock" | "jv5" | "jv4";
  label: string;
  description: string;
  character: string;
  victim: string;
  startFrame: number;
  timestamp: string;
  damage: number;
  startPercent: number;
  didKill: boolean;
  moves: string[];
  stockNumber: number;
}
```

### Character signature stats (26 characters)

Each character has a typed interface for their unique mechanics. Examples:

- **Fox:** waveshines, upthrow upairs, drill shines, shine spikes, upsmash kills
- **Falco:** pillar combos, shine grabs, laser count, dair shines
- **Marth:** ken combos, chain grabs, fsmash kills, tipper rate
- **Sheik:** tech chases, needle hits, fair chains, downthrow followups
- **Falcon:** knee kills, stomp knees, tech chase grabs, gentlemen
- **Puff:** rest kills, rest attempts, bair strings, pound kills
- **ICs:** wobbles, desyncs, sopo kills, nana deaths
- **Peach:** turnip pulls, float cancel aerials, dsmash kills
- Plus: Samus, Pikachu, Luigi, Mario, Doc, Yoshi, Ganon, Link, Y.Link,
  Zelda, Roy, Mewtwo, G&W, Ness, Bowser, Kirby, DK, Pichu

---

## Part 2: System Prompts

The codebase contains three specialized system prompts in `src/pipeline/prompt.ts`:

### SYSTEM_PROMPT (per-game coaching)

The main coaching prompt (~2650 lines). Key sections:

**Core Rules (8 principles):**
- Never give generic advice — cite specific data from the replay
- Reference frame windows and correct Melee terminology
- Distinguish execution issues from decision-making issues
- Calibrate to the player's level
- Use `[HH:MM]` timestamp citations for key moments

**Analysis Structure (per game):**
1. Game Overview (2-3 sentences)
2. Best Moment(s) — with timestamp citation
3. Worst Misplay(s) — with timestamp citation
4. Biggest Improvement Opportunity
5. Neutral Game Assessment
6. Punish Game Assessment
7. Defense & Recovery Assessment (with DI score caveats)
8. Shield Pressure Assessment
9. Set-Level Analysis (multi-game sets only)
10. Practice Plan (3 specific, measurable drills)
11. Coach's Wisdom (one non-obvious insight)

**Character-Specific Guidance:**
The prompt includes detailed signature stat interpretation for 18+ characters,
explaining what each stat means and how to coach around it.

**Matchup Awareness (8+ matchups):**
Fox vs Marth, Fox vs Falco, Fox dittos, Marth vs Sheik, Falco vs Sheik,
Sheik vs Fox, Jigglypuff matchups, Peach matchups, Falcon matchups,
ICs matchups — with general principles for unlisted matchups.

**Tone:** Direct, analytical, respectful. Like a skilled practice partner
giving honest feedback at the venue.

### SYSTEM_PROMPT_AGGREGATE (scoped analysis)

Used for aggregate coaching across many games filtered by character, stage,
or opponent. Focuses on:
- Statistical patterns and averages across the scope
- Comparison to lifetime averages
- Structure: Executive Summary → Highlights/Lowlights → Strategy → Recommendations

### SYSTEM_PROMPT_DISCOVERY (deep pattern analysis)

Used for discovery-mode analysis that identifies hidden patterns:
- Input: correlation matrices, situational splits, win/loss deltas
- Finds: fatigue factors, determinants, hidden links, pressure leaks
- The most analytically intensive coaching mode

---

## Part 3: Prompt Assembly

Four prompt assembly functions, each building a complete user prompt:

### `assembleUserPrompt(gameResults, targetPlayerTag, playerHistory?)`

For per-game/set coaching. Formats:
```
I'd like you to analyze the following set between {p1} ({char}) and {p2} ({char}).
Please analyze from the perspective of {target}.

{playerContext — if history available}

=== GAME {n} — {stage} ===
Result: {winner} wins ({stocks}, {percents})

--- {p1} ({char}) ---
{playerSummary JSON}

--- {p2} ({char}) ---
{playerSummary JSON}

--- Derived Insights ---
{derivedInsights JSON}

--- Highlights ---
{highlights JSON, if any}
```

### `assemblePlayerContext(history)`

Generates a ~500 token summary of the player's history:
- Overall record and recent streak
- Main characters and usage
- Top matchups with win rates
- Recent performance trends

Injected into all prompt types when player history is available.

### `assembleAggregatePrompt(stats, scopeType, identifier, playerHistory?)`

For character/stage/opponent scoped analysis. Includes aggregate stats,
win rates, and comparison to overall averages.

### `assembleDiscoveryPrompt(discoveryData, playerHistory?)`

For deep pattern analysis. Includes correlation matrices and situational
split data for the LLM to mine for insights.

---

## Part 4: Model Selection Notes

**Implemented providers (all support streaming):**

| Provider | Model | Cost | Use Case |
|----------|-------|------|----------|
| Gemini (direct) | 2.5 Flash | Free tier | Default for new users |
| OpenRouter | DeepSeek V3 | ~$0.01-0.03 | Recommended paid default |
| OpenRouter | DeepSeek R1 | ~$0.02-0.05 | Reasoning-heavy analysis |
| OpenRouter | Claude Sonnet 4 | ~$0.10-0.20 | Premium coaching quality |
| OpenRouter | GPT-4o | ~$0.10-0.20 | Alternative premium |
| Anthropic (direct) | Claude Sonnet 4 | ~$0.10-0.20 | Direct API access |
| OpenAI (direct) | GPT-4o | ~$0.10-0.20 | Direct API access |
| Local | Any (Ollama/LM Studio) | Free | Offline, privacy-first |

**Architecture:**
- All providers share: `callLLM(systemPrompt, userPrompt, config)` → string
- Streaming supported across all providers via SSE/chunked responses
- Rate-limited queue (1 request at a time, configurable delay) for free-tier limits
- User picks their provider and brings their own API key
- Provider abstraction in `src/llm.ts`, queue management in `src/llmQueue.ts`

**Quality note:** The structured data pipeline does the heavy lifting. Even
free-tier models produce useful coaching because the prompt includes rich,
pre-computed stats and insights rather than raw frame data.
