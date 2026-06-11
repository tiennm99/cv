# Project Selection — Thoughtworks SE (Java), HCMC

Date: 2026-06-11. Advisory only. Evidence = repo metadata/trees via `gh` (verified 2026-06-11).

## Problem
Pick 3 public GitHub projects (tiennm99) for 1-page CV. JD priorities: Java/OOP/design patterns/clean code > TDD + CI/CD > **AI-first delivery (headline)** > multi-language + cloud bonus. Day job already proves Java/Netty/game backends — projects must ADD signal. Incumbents: store-scraper-bot(+java), gomoku, rplace.

## Core assumption challenged
Incumbent set has **zero AI signal** while the JD makes "AI-first software delivery" a headline responsibility. Also rplace has tests but **no CI workflow** — weak under JD's CI/CD lens. Keeping incumbents unchanged is the wrong default.

## Recommendation (ranked)

### 1. miti99bot — IN (replaces rplace)
Go Telegram bot **framework**: AWS Lambda (SAM) + OIDC deploy, Firestore/DynamoDB pluggable KV provider, **Gemini AI integration with rate limiting**, golangci-lint, CI + deploy workflows, tests in nearly every package (`internal/ai/ratelimit_test.go`, `internal/storage/*_test.go`, `internal/testutil/recording_bot.go`).
- Signal added: **AI-first (only candidate that actually ships AI in product) + AWS cloud + CI/CD + TDD + pluggable architecture (provider/strategy patterns)**. Single strongest JD-coverage repo. Active (pushed today).

### 2. store-scraper-bot (+ archived Java original) — KEEP
JS port of a Java Gradle/Lombok/Docker-compose bot; layered packages, command pattern (`bot/command/*Command.java`), tests in both versions (`AppStoreScraperTest.java`).
- Signal added: **only public Java code** (interviewers can see Java style for a Java role) + Java→JS port = multi-language versatility + ability to read/restructure existing code. Verdict on debate (d): yes, must stay — day job proves Java on paper, this proves it in clickable code.

### 3. gomoku — KEEP
Go WebSocket server, protobuf codec, minimax AI with **benchmark tests** (`ai_bench_test.go`), lobby/room tests, CI build, Phaser client, Dockerized.
- Signal added: public, verifiable proof of real-time multiplayer engineering (corroborates day-job claims recruiters can't otherwise inspect) + deepest test culture of all candidates + algorithms. Day-job overlap acknowledged — but overlap here is *corroboration*, not repetition, and its CI+test rigor beats rplace's.

## Runner-ups & rejections
- **rplace** (dropped incumbent): genuinely good test harness (DO integration tests, fake-sql) and novel edge stack, but **no CI workflow**, "clone" framing reads toy-ish, and serverless-free-tier theme now duplicated by miti99bot. Loses slot 1 to miti99bot on AI+AWS+CI; loses slot 3 to gomoku on CI+test depth. Best 4th if space ever appears.
- **db-keepalive**: adapter pattern is nice design-pattern signal, but no CI, no tests, ~20 files; multi-DB (Couchbase/Redis) repeats day job. Rejected: thin + redundant.
- **awesome-coding-agents**: cron-updated star-ranking list — AI-*adjacent*, not AI engineering. Toy under "penalize demo repos". Rejected.
- **claude-code-routine-trigger-worker** (and Claude tooling family): real AI-workflow signal but each repo is tiny; AI slot better served by miti99bot which pairs AI with cloud+tests. Optionally mention the family in a CV "AI tooling" one-liner outside the 3 project slots.
- **vngeoguessr / loldle / mathmax / sokoban etc.**: product-clone or learning projects, weaker engineering-rigor evidence; no JD dimension they cover better than the picks.

## Trade-offs of final set
| Dimension | miti99bot | store-scraper(+java) | gomoku |
|---|---|---|---|
| Java | – | **yes (only one)** | – |
| TDD/tests | yes | yes | **strongest** |
| CI/CD | **CI+CD pipelines** | – (java repo no CI) | CI |
| AI-first | **Gemini in prod** | – | minimax (algorithmic, not GenAI) |
| Cloud | **AWS Lambda/OIDC** | Docker | Docker |
| Patterns | provider/strategy | command, layered | codec, state mgmt |

Known weaknesses: two Telegram-bot-domain projects (mitigated: framework vs app, different signals); GenAI evidence concentrated in one repo.

## Risks / second-order effects
- Dropping rplace removes frontend/edge diversity — acceptable: JD is backend Java, not frontend.
- store-scraper-bot-java is archived — frame as deliberate port, never hide; "Java→JS migration" is the bullet, not "abandoned".
- miti99bot bullet must lead with AI + AWS + CI/CD, else swap gains nothing over rplace.

## Success criteria
Each project bullet maps to ≥2 distinct JD keywords; combined set covers Java, TDD, CI/CD, AI, cloud, multi-language with zero fabrication (all claims traceable to repo files listed above).

## Next steps
Rewrite the 3 project entries in CV source; re-render; verify 1-page fit.

## Unresolved questions
1. Should CV add a one-line "AI tooling" mention (Claude worker family + awesome-coding-agents) outside project slots to reinforce AI-first, if 1-page budget allows?
2. miti99bot description says Lambda+Firestore but tree shows DynamoDB provider too — confirm which deploy story to claim in the bullet.
