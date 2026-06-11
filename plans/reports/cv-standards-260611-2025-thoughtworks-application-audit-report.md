# CV Standards Audit — Thoughtworks Software Engineer (Java)

**Source:** `miti99.yml` (cv section) | **JD:** `temp/Software Engineer (Java)_Thoughtworks.pdf` | **Rendered:** 1 page (verified)
**Mode:** ADVISORY ONLY — no files edited. All suggestions limited to ground-truth facts; gaps marked [CANDIDATE TO CONFIRM].

---

## 1. Recruiter 6-Second Scan (top third)

- **[High] Education sits above Experience.** Top third = header + Education block (GPA, thesis). Strongest JD signal — "5+ years senior Java engineer, real-time backends, AI-assisted delivery at VNG" — is below the scan zone. The thesis bullet (2 lines) eats prime real estate that should belong to the ZingPlay summary line.
- **[Positive] Headline is strong and JD-mirrored:** "Senior Java Software Engineer | Java 21, Real-Time Backends, CI/CD, AI-Assisted Delivery" — Java + CI/CD + AI-first all visible in second 1.
- **Fix:** swap Experience before Education (see §5). No content change needed; the existing `summary:` line on the ZingPlay entry then lands in the scan zone.

## 2. Bullet Quality

Pattern across CV: tech-keyword density is high, outcomes are near-absent. Only numbers in entire CV: "5+ years", GPA 8.0, 4096x4096 canvas. For a live game backend job, truthful metric types available: **CCU/peak concurrent users, DAU, requests/sec, # live titles supported, payment/transaction volume, release cadence, team size, incident/diagnostic turnaround, fresher→senior promotion timeline.** All values [CANDIDATE TO CONFIRM].

Per bullet (experience):

| Bullet | Issue | Severity | Fix direction |
|---|---|---|---|
| "Chaos Age 2: Primary Java backend contributor for gameplay systems, battle synchronization, matchmaking, payments..." | No action verb, pure scope noun-list, zero outcome. Flagship bullet, weakest form. | **High** | Lead with verb ("Owned/Delivered backend for X gameplay systems"), add 1 metric: CCU or requests/sec or DAU [CANDIDATE TO CONFIRM] |
| "Built and maintained Java 21 backend modules with Netty/Vert.x, Couchbase, Redis, Kafka, Gradle, JUnit 5, Mockito, Docker..., GitLab CI" | 9-item keyword list; reads as ATS stuffing. Second clause ("automated tests around payment, release-critical flows") is the value — buried. | **Medium** | Trim list to 4–5 (rest already in Skills), lead with the testing/release discipline. Metric: release cadence or pipeline run frequency [CANDIDATE TO CONFIRM] |
| "Applied OOP and design patterns to reusable packet handlers..." | "Applied" is weak; reads as written-for-the-JD. No concrete improvement shown — JD wants "spot (and improve) bad code". | **Medium** | Replace with one concrete refactor/extraction story if one exists [CANDIDATE TO CONFIRM], e.g. "Refactored X into reusable packet-handler framework adopted across N titles" |
| "Burkozel, Show, Sky Garden: Maintained backend gameplay events, payment/config updates, metrics, concurrency fixes, live diagnostics..." | 6-item laundry list; "concurrency fixes" (strongest engineering signal) buried mid-list. | **Medium** | Lead with "Supported 3 live titles in production"; pull concurrency fixes forward with 1 specific example [CANDIDATE TO CONFIRM] |
| "Built an internal Claude Code plugin/skill marketplace..." | Best JD-differentiator bullet (AI-first delivery is a headline JD responsibility). Missing adoption outcome. | **High** (opportunity) | Add adoption metric: # engineers/teams using it, % boilerplate eliminated, time saved [CANDIDATE TO CONFIRM]. Consider moving to position 2 in bullet order — JD lists AI-first strategy as a core responsibility |

Projects bullets are also tech lists but acceptable for a projects section; lower priority. Gomoku/Rplace already show tests + CI — good JD alignment.

## 3. ATS / Keyword Coverage vs JD

Present and matching: Java, OOP, design patterns, reusable, CI/CD, GitLab CI/GitHub Actions, code review, unit testing, Docker, AWS (Lambda/SAM), AI-assisted workflows, production debugging, DevOps collaboration.

Absent JD keywords:

| JD keyword | In CV? | Can truthfully add? |
|---|---|---|
| **TDD** | No | Only as "awareness" — JD asks "good awareness of TDD". JUnit5/Mockito + tests around release-critical flows supports awareness. Add to Delivery Practices as "TDD-aware testing" ONLY if candidate genuinely writes tests first at least sometimes [CANDIDATE TO CONFIRM]. Do NOT claim "practiced TDD" otherwise. |
| **Pair programming** | No | Not in ground truth. Stay out unless candidate actually pairs [CANDIDATE TO CONFIRM]. |
| **Agile / Lean** | No | Not in ground truth. Game studio with regular releases + cross-functional stakeholders likely runs sprints — if so, "Agile" truthful in Delivery Practices [CANDIDATE TO CONFIRM]. "Lean": stay out. |
| **Continuous delivery / continuous integration (spelled out)** | Only as "CI/CD" | Yes — truthful. Spell out once ("continuous integration/continuous delivery (CI/CD)") for ATS string-match safety. |
| **Clean code** | "reusable" yes, "clean" no | Yes — defensible self-description given testing/review practices; low value but harmless to phrase one bullet as "clean, reusable". |
| **Cross-functional** | Phrased as "client, QA, release, and product stakeholders" | Yes — truthful rewording of existing summary line ("cross-functional teams: QA, product, release"). |
| **Knowledge sharing** | Implied by marketplace + "scaffolding guidance" | Yes — marketplace bullet can truthfully say "standardizing ... and sharing knowledge across teams" if other engineers consume it [CANDIDATE TO CONFIRM adoption]. |
| **Kubernetes** | No | **Must stay out** — not in ground truth. AWS + Docker already cover the "bonus" line. |
| **Refactoring / "improve bad code"** | No ("concurrency fixes" closest) | Only with a concrete real instance [CANDIDATE TO CONFIRM]. |
| **Mentoring** | No | Not in ground truth. Stay out unless senior role included mentoring juniors [CANDIDATE TO CONFIRM]. |

## 4. Red Flags

- **[Critical] Title/date mismatch — "Senior Software Engineer, 2020-07 – present".** Ground truth: fresher→senior progression over 5+ yrs. CV currently claims senior title for the entire 6-year span, starting 3 years before graduation (2023-06). Any reference check or HR verification at a consultancy surfaces this as title inflation. Fix: split into two entries or sub-positions ("Software Engineer / Fresher 2020–20XX; promoted to Senior Software Engineer 20XX") [CANDIDATE TO CONFIRM promotion dates]. Bonus: the progression is a *positive* signal for Thoughtworks' growth/learning culture — currently invisible. Showing it is strictly better.
- **[High] TOEIC 600+ listed.** Consultancy = client-facing English; TOEIC 600 is below the informal consultancy bar (~700–800) and the line actively advertises a weakness. Options: (a) drop the score, state proficiency level only if defensible [CANDIDATE TO CONFIRM real working level], (b) retake test before applying, (c) drop the spoken-languages row entirely (English assumed/tested at interview). Listing "600+" is honest but self-harming.
- **[Medium] Photo on CV** (`photo: avatar.jpg`). Thoughtworks is a Western consultancy with an explicit fairness/bias policy in this very JD. Photos invite bias concerns and waste 3cm of a 1-pager. Vietnam-local norm, but for this employer: remove.
- **[Low] Work start (2020-07) predates graduation (2023-06)** — legitimate (worked while studying) but unexplained gap-logic; the fresher→senior split above resolves it naturally.
- **[Low] Single employer, 5+ yrs** — not a flag at this seniority; breadth already shown via 4 titles + polyglot personal projects. Optionally reinforce with "50+ public repos" (ground truth ~50) next to GitHub link as learning-passion evidence for JD professional skills.
- **[Low] Telegram handle in header** — unusual for an international consultancy application; email/LinkedIn/GitHub suffice.
- No fabrication detected: all experience claims trace to ground-truth facts; Play Store + GitHub links make claims verifiable — good practice.

## 5. Structure

- **[High] Swap section order to: Experience → Projects → Skills → Education.** Education-first is correct for new grads only; at 5+ yrs senior it buries the lede. Education (GPA 8.0, scholarship, thesis) is still strong — fine at the bottom; consider compressing thesis bullet to 1 line.
- **[Low] Headline:** effective as-is; mirrors JD vocabulary. No change.
- **[Low] Summary placement:** currently an entry-level `summary:` under ZingPlay — acceptable once Experience moves to top (lands in scan zone). A separate top-level profile section is unnecessary on a tight 1-pager (would duplicate headline). Minor: summary repeats "Senior ... engineer" from headline; could spend those words on AI-first or multi-title scope instead.
- **[Low] Skills hygiene:** two rows labeled "Languages"/"Languages (Spoken)" — rename second to "Spoken Languages" or drop (see TOEIC finding). Kafka under "Databases" is a misfile (message broker) — TW interviewers notice; relabel row "Data & Messaging".

## Recommended Actions (priority order)

1. Fix senior-title/date accuracy: show fresher→senior promotion [CANDIDATE TO CONFIRM dates] — Critical.
2. Move Experience above Education — High.
3. Remove/replace TOEIC 600+ line — High.
4. Add 1–2 truthful metrics to Chaos Age 2 + marketplace bullets (CCU/requests/adoption) [CANDIDATE TO CONFIRM values] — High.
5. Remove photo — Medium.
6. Keyword adds where truthful: spell out continuous integration/delivery; "Agile" + "TDD awareness" pending candidate confirmation; never add Kubernetes/pair programming/Lean without basis — Medium.
7. Rewrite Chaos Age 2 bullet with action verb; de-list-ify bullets 2 and 4 — Medium.
8. Skills row cleanup (Kafka, duplicate "Languages") — Low.

## Positive Observations

- Headline precisely targets JD (Java 21, CI/CD, AI-Assisted Delivery).
- AI marketplace bullet is a genuine differentiator for the JD's headline "AI-first delivery strategy" responsibility.
- All claims verifiable via Play Store/GitHub links — rare and good.
- Recent (2025–2026) polyglot personal projects with tests + CI directly evidence "clean code in a variety of languages" and learning passion.
- Fits 1 page at readable density.

## Unresolved Questions

1. Actual promotion timeline fresher→senior (dates/titles) — needed for the Critical fix.
2. Which metrics can the candidate truthfully state (CCU, DAU, req/s, marketplace adoption, release cadence)?
3. Does the team genuinely practice Agile ceremonies and any test-first development (gates the Agile/TDD keyword adds)?
4. Real spoken-English working level if TOEIC score is dropped?
