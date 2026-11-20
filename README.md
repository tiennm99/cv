<!-- Generated from miti99.yml by `npm run build`. Edit miti99.yml, not this file. -->

# Tien Nguyen Minh

[Website](https://tiennm99.github.io/cv/) · [Show-off version](https://tiennm99.github.io/cv/show-off/) · [PDF](miti99.pdf) · [llms.txt](https://tiennm99.github.io/cv/llms.txt)

**Senior Java Software Engineer | Real-Time Backends**

Ho Chi Minh City, Vietnam · [tiennm99@outlook.com](mailto:tiennm99@outlook.com) · [miti99.com](https://miti99.com/) · [LinkedIn](https://linkedin.com/in/miti99) · [GitHub](https://github.com/tiennm99)

## Experience

### Senior Software Engineer — ZingPlay Game Studios, VNG Corp.

*Jul 2020 – present · HCMC, Vietnam*

Progressed from an entry-level game programmer to Senior Software Engineer, building and maintaining Java backends for multiplayer games since 2020. Work with client developers, QA, release teams, and product stakeholders to deliver and support live games.

- Developed gameplay, battle synchronization, matchmaking, payments, and admin tools for [Chaos Age 2](https://play.google.com/store/apps/details?id=vn.zps.tl2) as a primary Java backend contributor, using Java 21, Netty, Vert.x, Couchbase, Redis, and Kafka.
- Diagnosed and fixed production concurrency issues; maintained gameplay events, payment integrations, configuration, and metrics for [Burkozel](https://play.google.com/store/apps/details?id=zps.games.burkozel), [Show](https://play.google.com/store/apps/details?id=zps.games.show), and [Sky Garden](https://play.google.com/store/apps/details?id=vn.kvtm.js).
- Investigated high CPU usage and memory pressure using JVM thread dumps, heap analysis, and GC logs; built load-testing tools to reproduce game-server workloads.
- Built reusable packet handlers and gameplay modules; added JUnit 5 and Mockito tests for gameplay and payments, Docker-based local dependencies, and Gradle/GitLab CI delivery pipelines.
- Created an internal Claude Code plugin and skill marketplace with Java server scaffolding guidance to standardize packet-handler generation and AI-assisted development.

## Projects

### [Store Scraper Bot](https://github.com/tiennm99/store-scraper-bot)

*Nov 2025 – present*

Telegram bot that tracks app updates on the Apple App Store and Google Play.

- Built the [original Java 21 implementation](https://github.com/tiennm99/store-scraper-bot/tree/e794000df38c35d3e1a9aa0545d4573a2298a8a9) with MongoDB, command-based handlers, reusable repositories, Gradle, Docker Compose, and JUnit scraper tests. Ported it to Node.js on Vercel with Upstash Redis, Vercel Cron, and GitHub Actions.

### [Gomoku](https://github.com/tiennm99dev/gomoku)

*2026*

Multiplayer Gomoku game with a Go WebSocket server, Protocol Buffers messages, and a Phaser client.

- Implemented server-side move validation, win detection, player and spectator modes, and a minimax AI with alpha-beta pruning. Added game, lobby, and codec tests, Docker Compose, and GitHub Actions for vet, tests, and builds.

### [tiennm99bot](https://github.com/tiennm99/tiennm99bot)

*May 2026 – present*

Modular Go Telegram bot framework deployed to AWS Lambda with AWS SAM.

- Built pluggable Firestore and DynamoDB storage providers and rate-limited AI integrations. Added 53 Go test files covering modules, storage, and rate limiting, plus GitHub Actions CI and OIDC-authenticated AWS deployments.

## Skills

- **Languages:** Java, Go, JavaScript/TypeScript, Shell
- **Frameworks & Libraries:** Netty, Vert.x, Spring Boot, WebSocket, Cocos2d-x, Godot
- **Data & Messaging:** Couchbase, Redis, MySQL, Kafka, ClickHouse
- **Infrastructure & DevOps:** Docker, Linux, GitLab CI, GitHub Actions, AWS Lambda/SAM, Cloudflare Workers, Vercel
- **Testing & Engineering:** JUnit 5, Mockito, unit testing, code review, production debugging, CI/CD, OOP, design patterns, event-driven architecture, AI-assisted development

## Education

### Ho Chi Minh City University of Technology

*B.E. in Computer Science and Engineering · Sep 2017 – Jun 2023 · HCMC, Vietnam*

- GPA: 8.14/10; Academic Excellence Scholarship; Five Good Student Award.
- Thesis: Survival2D, a multiplayer battle royale server built with Java, Netty/WebSocket, FlatBuffers, behavior-tree AI, and server-side anti-cheat.

---

## About this repo

One data file, [`miti99.yml`](miti99.yml), builds the simple web CV, the
animated show-off site, the one-page PDF (Typst), this README and the
`llms.txt` files for the site.

```sh
npm ci
npm run dev     # show-off site at http://127.0.0.1:5199/
npm run build   # dist/ plus the committed miti99.pdf and README.md
```

Needs Node.js 24+ and [uv](https://docs.astral.sh/uv/). Checks, layout and
deployment: [docs/development.md](docs/development.md).
