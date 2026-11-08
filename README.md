# Tien Nguyen Minh's CV

- Phone: +84 869 156 149
- Email: [tiennm99@outlook.com](mailto:tiennm99@outlook.com)
- Location: Ho Chi Minh City, Vietnam
- Website: [miti99.com](https://miti99.com/)
- LinkedIn: [miti99](https://linkedin.com/in/miti99)
- GitHub: [tiennm99](https://github.com/tiennm99)


# Experience
## **Senior Software Engineer**, ZingPlay Game Studios, VNG Corp. -- HCMC, Vietnam

July 2020 – present

Progressed from an entry-level game programmer to Senior Software Engineer, building and maintaining Java backends for multiplayer games since 2020. Work with client developers, QA, release teams, and product stakeholders to deliver and support live games.

- Developed gameplay, battle synchronization, matchmaking, payments, and admin tools for [Chaos Age 2](https://play.google.com/store/apps/details?id=vn.zps.tl2) as a primary Java backend contributor, using Java 21, Netty, Vert.x, Couchbase, Redis, and Kafka.

- Diagnosed and fixed production concurrency issues; maintained gameplay events, payment integrations, configuration, and metrics for [Burkozel](https://play.google.com/store/apps/details?id=zps.games.burkozel), [Show](https://play.google.com/store/apps/details?id=zps.games.show), and [Sky Garden](https://play.google.com/store/apps/details?id=vn.kvtm.js).

- Investigated high CPU usage and memory pressure using JVM thread dumps, heap analysis, and GC logs; built load-testing tools to reproduce game-server workloads.

- Built reusable packet handlers and gameplay modules; added JUnit 5 and Mockito tests for gameplay and payments, Docker-based local dependencies, and Gradle/GitLab CI delivery pipelines.

- Created an internal Claude Code plugin and skill marketplace with Java server scaffolding guidance to standardize packet-handler generation and AI-assisted development.



# Projects
## **[Store Scraper Bot](https://github.com/tiennm99/store-scraper-bot)**

Nov 2025 – present

Telegram bot that tracks app updates on the Apple App Store and Google Play.

- Built the [original Java 21 implementation](https://github.com/tiennm99/store-scraper-bot/tree/e794000df38c35d3e1a9aa0545d4573a2298a8a9) with MongoDB, command-based handlers, reusable repositories, Gradle, Docker Compose, and JUnit scraper tests. Ported it to Node.js on Vercel with Upstash Redis, Vercel Cron, and GitHub Actions.



## **[Gomoku](https://github.com/tiennm99dev/gomoku)**

2026

Multiplayer Gomoku game with a Go WebSocket server, Protocol Buffers messages, and a Phaser client.

- Implemented server-side move validation, win detection, player and spectator modes, and a minimax AI with alpha-beta pruning. Added game, lobby, and codec tests, Docker Compose, and GitHub Actions for vet, tests, and builds.



## **[miti99bot](https://github.com/tiennm99/miti99bot)**

May 2026 – present

Modular Go Telegram bot framework deployed to AWS Lambda with AWS SAM.

- Built pluggable Firestore and DynamoDB storage providers and rate-limited AI integrations. Added 53 Go test files covering modules, storage, and rate limiting, plus GitHub Actions CI and OIDC-authenticated AWS deployments.



# Skills
**Languages:** Java, Go, JavaScript/TypeScript, Shell

**Frameworks & Libraries:** Netty, Vert.x, Spring Boot, WebSocket, Cocos2d-x, Godot

**Data & Messaging:** Couchbase, Redis, MySQL, Kafka, ClickHouse

**Infrastructure & DevOps:** Docker, Linux, GitLab CI, GitHub Actions, AWS Lambda/SAM, Cloudflare Workers, Vercel

**Testing & Engineering:** JUnit 5, Mockito, unit testing, code review, production debugging, CI/CD, OOP, design patterns, event-driven architecture, AI-assisted development

# Education
## **Ho Chi Minh City University of Technology**, B.E. in Computer Science and Engineering -- HCMC, Vietnam
Sept 2017 – June 2023

- GPA: 8.0/10; Academic Excellence Scholarship; Five Good Student Award.

- Thesis: Survival2D, a multiplayer battle royale server built with Java, Netty/WebSocket, FlatBuffers, behavior-tree AI, and server-side anti-cheat.


