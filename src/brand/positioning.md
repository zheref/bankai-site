# Bankai · Brand Positioning (EN) — site copy source

> Transcribed from the Craft document "Bankai · Brand Positioning (EN)" (Lucy, reviewed by Loke; Sergio's decisions of 2026-11-04) on 2026-11-04. The Craft doc wins where this copy drifts. Every string in `src/i18n/en.json` cites a section of this file (`source:` keys). Sections marked **[minimum copy, flag for review]** have no copy in the positioning doc; the site writes the minimum and flags it.

## Status

Draft by Lucy for Sergio's review; Loke to review positioning; not published. Visual source of truth: the Build spec block in the logo doc.

## Legal guardrails (Damnatio's informed guidance, not formal legal advice)

Bankai stays fully open-source, public and free; nothing is sold as part of it. The hosted tier stays unnamed and appears only as a *Coming later* teaser.

Red flags: never pair character-named agents with avatars, quotes or catchphrases; no show-like logos, fonts, kanji or colour schemes; no anime art or characters; never use "official", show titles in taglines, or anime titles in meta or SEO; use namespaced packages; no ValleIA pricing or sales on Bankai pages (Sergio's decision of 2026-11-04 shows the ValleIA setup service on the site as a product that leverages Bankai, never as something sold with it); wordmark is lowercase `bankai` with `ai` in the accent colour.

## Positioning statement

For developers who already ship with AI coding agents but do not trust them to run the whole lifecycle, **Bankai** is an open-source (MIT) AI-driven software development lifecycle system that turns agent work into a governed, repeatable flow: deterministic operations via a CLI, a governance harness inside the agent you already use, and per-stack handbooks as the canon. Unlike ad-hoc prompts, loose skill packs or closed autopilots, Bankai keeps humans at explicit gates (G1-G5) and makes every mechanical step deterministic.

## Target audience

1. Primary: the senior engineer who already ships with agents (Claude Code, Codex, Cursor or Antigravity on real repos). Pains: agents open sloppy PRs, skip release steps and leave the backlog out of sync; every session re-explains the same process; nothing stops the agent at the risky steps (merge, publish). Wants: more delegated work with explicit stop points they control.
2. Secondary: the mobile or frontend tech lead (SwiftUI+TCA, Jetpack Compose or React+Redux). Pains: each agent session reinvents conventions; review time goes to style and process; no single written source agents and humans both follow. Wants: citable per-stack practices and consistent, reviewable PRs.
3. Tertiary: the AI-tooling builder. Wants an open reference architecture to fork, study and extend.
4. Later: teams that want governed AI delivery run for them. A hosted tier is coming later (still unnamed), teased only.

## Core promise

**Let agents run your lifecycle. Keep the final say.** Bankai lets AI drive work from request to release while deterministic tools do the mechanics and you sign off at every gate that matters.

## Brand pillars

1. **Governed, not autopilot.** Human gates G1-G5 (epic approval, merge, publish, canon change, human-only work). Agents propose; you decide. Proof: the gates are defined in Hatsu and visible in every flow demo.
2. **Deterministic where it counts.** Nen runs the mechanical operations as a CLI: same input, same output. AI does the judgment; the CLI does the bookkeeping. Proof: a terminal recording of a Nen command run twice with identical results.
3. **One written canon per stack.** Bankai-Handbooks give agents and humans the same practices for SwiftUI+TCA, Jetpack Compose and React+Redux. Proof: agents cite handbook sections in their PRs; the handbooks are public.
4. **Open, free, agent-agnostic, runs where you run.** MIT licensed, fully open-source, public and free. Hatsu works inside Claude Code, Codex, Cursor and Antigravity. Proof: public repos and the same flow shown in two agents.

## Tagline

Recommended (Loke, confirmed): **Agents do the work. You hold the gates.** Alternates: *Your agents ship. You sign off.* / *Delegate the lifecycle. Keep the gates.* *Release your final form* only as a playful secondary line in docs or social. Option 7, *Agentic delivery that stops at your gates*, is the one-line promise the site build prompt names for the hero.

## Voice and tone

A senior engineer explaining their own system to a peer. Precise, confident, a little playful, never hype. English is the default; a Spanish version is wanted. Technical terms and agent or skill names (Nen, Hatsu, Bankai-Handbooks, mukai, G1-G5, etc.) are never translated.

Do: lead with the plain-English verb, then the code name (open the PR · mukai); show real commands and real flows; say plainly what is built, tease anything not started yet as an upbeat *Coming later*; keep sentences short; let the anime-inspired names add flavour in docs, with a plain alias next to each.

Don't: invent metrics, user counts, speedups or testimonials; promise full autonomy or imply agents merge or publish on their own; use anime imagery, character art, logos or lookalike fonts; name or price the future hosted tier; bury readers in internal clause ids or jargon without a gloss; trash-talk named competitors.

## Messaging hierarchy (landing page)

1. **Hero.** Wordmark. Headline: *Agents do the work. You hold the gates.* Subhead: *Bankai is an open-source, AI-driven development lifecycle for Claude Code, Codex, Cursor and Antigravity. Deterministic CLI ops, governed agents, per-stack handbooks.* CTAs: Get started · View on GitHub. Visual: an animated terminal of a real flow.
2. **The problem.** Agents are fast; lifecycles are messy. PRs, releases and backlogs drift when every session improvises.
3. **How it works.** Three live parts, one loop (Library comes later): Nen, deterministic ops: a CLI for the mechanical work agents should not improvise. Hatsu, governance harness: a skill and agent plugin with 60+ skills, 17 agents and human gates G1-G5. Bankai-Handbooks, the canon: per-stack practices for SwiftUI+TCA, Jetpack Compose and React+Redux. Bankai-Library: coming later, shown as roadmap only.
4. **Human gates.** A visual of G1-G5 and what stops at each one.
5. **Works where you work.** Claude Code, Codex, Cursor, Antigravity.
6. **Open source.** MIT, fully public and free, built in the open by zheref. Teaser: *Hosted, autonomous runs are coming later. Get notified.* (no name, no price)
7. **Footer.** GitHub links, MIT license, the short legal line.

## Proof points (real facts only)

Fully open source under the MIT license. Parts: Nen (CLI), Hatsu (harness), Bankai-Handbooks, Bankai-Library (coming later). Hatsu: 60+ skills, 17 agents (verified 2026-11-04). Five human gates, G1-G5. Runs in Claude Code, Codex, Cursor and Antigravity. Handbooks cover three stacks. Built by zheref, a senior iOS/mobile engineer and agentic AI developer, who uses it on his own work. No invented metrics.

## Competitive framing (generic)

vs. raw agents and ad-hoc prompts: Bankai adds process, gates and determinism around the agent you already use. vs. loose skill and prompt packs: a system (CLI + harness + canon), not a grab bag of prompts. vs. closed autonomous dev platforms: open, agent-agnostic, humans in charge of merges and releases. vs. classic CI/CD and linters: complements them; it governs the agent work before and around the pipeline.

## Coming later (teasers, from the logo doc)

Aspirational, no dates, no names, no prices. Bankai-Library: *Reusable components, next on the path. Coming later.* Hosted, autonomous runs (cloud tier, name TBD): *Hosted, autonomous runs. Coming later.* Combined line: *Coming later: Bankai-Library and hosted, autonomous runs. The path keeps going.*

## Spanish copy (EN stays default; from the logo doc)

Tagline: *Los agentes hacen el trabajo. Tú controlas los gates.* Subhead: *Bankai es un ciclo de desarrollo open source impulsado por IA para Claude Code, Codex, Cursor y Antigravity. Operaciones CLI deterministas, agentes gobernados, handbooks por stack.* CTAs: Empezar · Ver en GitHub. Nav: Docs · Etapas · Gates · GitHub. Coming later: *Próximamente: Bankai-Library y ejecuciones autónomas hospedadas. El camino sigue.* Legal line stays English until Damnatio signs off a Spanish one.

## Sections with no positioning copy **[minimum copy, flag for review]**

SDLC stages, Architecture diagram labels, Quick start, Open source vs. cloud table, Support the project (GitHub Sponsors), Services (ValleIA setup), Pricing (hidden), FAQ answers, meta descriptions beyond the hero subhead. The site writes the minimum from repository facts and the build prompt's factual details, and marks each string `review: true` in `src/i18n/en.json`.
