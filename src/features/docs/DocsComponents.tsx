import * as React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { InlineMd } from '@/design/InlineMd';
import { Badge } from '@/design/Badge';
import { Snippet } from '@/design/Snippet';
import { Mark } from '@/design/Mark';

type Skill = { name: string; alias: string | null; aliasSource: string | null; description: string | null; gate: string | null; group: string | null; frontmatterDescription: string | null; meaningHtml: string | null; stepsHtml: string | null; calledByHtml: string | null; prerequisitesHtml: string[] | null; runsHtml: string[] | null; workflowNames: string[] | null; path: string | null; inReadme: boolean | null };
type Agent = { name: string; alias: string | null; description: string | null; frontmatterDescription: string | null; model: string | null; disciplineHtml: string | null; raisedByHtml: string | null; standingHtml: string | null; modes: Array<{ mode: string; lane: string; stops: string; alias: string | null }> | null; path: string | null };

export function useDocsData() {
  return useStaticQuery<{
    allHatsuSkill: { nodes: Skill[] };
    allHatsuAgent: { nodes: Agent[] };
    allHatsuGate: { nodes: Array<{ gate: string; clause: string; whatHtml: string; delegableHtml: string }> };
    allModelTier: { nodes: Array<{ tier: string; role: string; claudeCode: string; codex: string; cursor: string; antigravity: string }> };
    allHumanPhase: { nodes: Array<{ phase: string; whatHtml: string; whyHtml: string }> };
    allRunProfile: { nodes: Array<{ profile: string; perTurnHtml: string; deferredHtml: string; report: string }> };
    allConfigFile: { nodes: Array<{ file: string; livesIn: string; decidesHtml: string; page: string }> };
    allNenVerb: { nodes: Array<{ family: string; verb: string; purposeHtml: string; readsHtml: string; json: string; summaryHtml: string | null }> };
    allHandbookFamily: { nodes: Array<{ family: string; where: string; prefix: string }> };
    allUxRule: { nodes: Array<{ ruleId: string; title: string }> };
    allChangelogEntry: { nodes: Array<{ repo: string; title: string; version: string | null; date: string | null; bullets: string[]; truncated: boolean }> };
    allSourceRepo: { nodes: Array<{ name: string; version: string; commit: string; readAt: string; skillCount: number | null; agentCount: number | null; verbCount: number | null }> };
    nenDependency: { minimum: string; pinnedRef: string; source: string; bootstrapUrl: string | null; bootstrapScriptSha256: string | null };
  }>(graphql`
    query DocsData {
      allHatsuSkill(sort: { order: ASC }) { nodes { name alias aliasSource description gate group frontmatterDescription meaningHtml stepsHtml calledByHtml prerequisitesHtml runsHtml workflowNames path inReadme } }
      allHatsuAgent(sort: { order: ASC }) { nodes { name alias description frontmatterDescription model disciplineHtml raisedByHtml standingHtml modes { mode lane stops alias } path } }
      allHatsuGate(sort: { order: ASC }) { nodes { gate clause whatHtml delegableHtml } }
      allModelTier(sort: { order: ASC }) { nodes { tier role claudeCode codex cursor antigravity } }
      allHumanPhase(sort: { order: ASC }) { nodes { phase whatHtml whyHtml } }
      allRunProfile(sort: { order: ASC }) { nodes { profile perTurnHtml deferredHtml report } }
      allConfigFile(sort: { order: ASC }) { nodes { file livesIn decidesHtml page } }
      allNenVerb(sort: { order: ASC }) { nodes { family verb purposeHtml readsHtml json summaryHtml } }
      allHandbookFamily(sort: { order: ASC }) { nodes { family where prefix } }
      allUxRule(sort: { order: ASC }) { nodes { ruleId title } }
      allChangelogEntry(sort: { order: ASC }) { nodes { repo title version date bullets truncated } }
      allSourceRepo { nodes { name version commit readAt skillCount agentCount verbCount } }
      nenDependency { minimum pinnedRef source bootstrapUrl bootstrapScriptSha256 }
    }
  `);
}

/** code name · alias, the docs' public name for a skill or agent (D4: both on OSS and docs pages). */
export function Name({ code, alias, proposed }: { code: string; alias: string | null; proposed?: string }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <code className="text-text">{code}</code>
      {alias ? <span className="text-muted">· {alias}</span> : null}
      {proposed ? <Badge kind="proposed">{t('badges.proposed')}: {proposed}</Badge> : null}
    </span>
  );
}

/** A table in a keyboard-focusable scroll region (axe scrollable-region-focusable; UX-7 no page overflow). */
export function Table({ children, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <div className="table-scroll" tabIndex={0}><table {...rest}>{children}</table></div>;
}
export function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  return <pre tabIndex={0} {...props} />;
}

export function SourceStamp() {
  const d = useDocsData();
  const by = Object.fromEntries(d.allSourceRepo.nodes.map((n) => [n.name, n]));
  return (
    <p className="font-mono text-xs text-muted">
      {t('docs.readAt')}: hatsu {by.hatsu?.commit.slice(0, 10)} (v{by.hatsu?.version}) · nen {by.nen?.commit.slice(0, 10)} (v{by.nen?.version}) · handbooks {by.handbooks?.commit.slice(0, 10)} ({by.handbooks?.version}) · {by.hatsu?.readAt}
    </p>
  );
}

export function Versions() {
  const d = useDocsData();
  const by = Object.fromEntries(d.allSourceRepo.nodes.map((n) => [n.name, n]));
  return (
    <ul>
      <li>Hatsu plugin <strong>v{by.hatsu?.version}</strong>: {by.hatsu?.skillCount} skills, {by.hatsu?.agentCount} agents</li>
      <li>Nen <strong>v{by.nen?.version}</strong>: {by.nen?.verbCount} verbs; Hatsu pins <code>{d.nenDependency.pinnedRef}</code> (minimum {d.nenDependency.minimum})</li>
      <li>Bankai-Handbooks <strong>{by.handbooks?.version}</strong></li>
    </ul>
  );
}

export function NenPin() {
  const { nenDependency: n } = useDocsData();
  return (
    <ul>
      <li><code>dependency.source</code>: <code>{n.source}</code></li>
      <li><code>dependency.minimum</code>: <code>{n.minimum}</code></li>
      <li><code>dependency.pinned_ref</code>: <code>{n.pinnedRef}</code></li>
      {n.bootstrapUrl ? <li><code>dependency.bootstrap.url</code>: <code>{n.bootstrapUrl}</code></li> : null}
      {n.bootstrapScriptSha256 ? <li><code>dependency.bootstrap.scriptSha256</code>: <code>{n.bootstrapScriptSha256}</code></li> : null}
    </ul>
  );
}

export function LeadAgent() {
  const d = useDocsData();
  const k = d.allHatsuAgent.nodes.find((a) => a.name === 'kurapika');
  if (!k) return null;
  return (
    <div id="agent-kurapika" className="scroll-mt-24">
      <h3 className="text-xl"><Name code={k.name} alias={k.alias} /></h3>
      <p>{k.description}</p>
      <Table>
        <thead><tr><th>Mode</th><th>Plain name</th><th>Lane</th><th>Where its work stops</th></tr></thead>
        <tbody>{(k.modes ?? []).map((m) => <tr key={m.mode}><td><code>{m.mode}</code></td><td>{m.alias}</td><InlineMd as="td" html={m.lane} /><InlineMd as="td" html={m.stops} /></tr>)}</tbody>
      </Table>
    </div>
  );
}

export function AgentRoster() {
  const d = useDocsData();
  const agents = d.allHatsuAgent.nodes.filter((a) => a.name !== 'kurapika');
  return (
    <ul className="not-prose grid gap-3 sm:grid-cols-2" data-testid="agent-roster">
      {agents.map((a) => (
        <li key={a.name} id={`agent-${a.name}`} className="surface scroll-mt-24 p-4" data-agent={a.name}>
          <h3 className="text-base font-semibold"><Name code={a.name} alias={a.alias} /></h3>
          <p className="mt-1 text-sm text-muted">{a.description}</p>
          {a.disciplineHtml ? <InlineMd as="p" className="mt-2 text-sm" html={a.disciplineHtml} /> : null}
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted">
            {a.raisedByHtml ? <><dt>raised by</dt><dd><InlineMd html={a.raisedByHtml} /></dd></> : null}
            {a.standingHtml ? <><dt>standing</dt><dd><InlineMd html={a.standingHtml} /></dd></> : null}
            {a.model ? <><dt>model tier alias</dt><dd><code>{a.model}</code></dd></> : null}
          </dl>
          <a href={`${siteConfig.github.hatsu}/blob/main/${a.path}`} rel="noopener" className="mt-2 inline-block font-mono text-xs text-accent">{a.path}</a>
        </li>
      ))}
    </ul>
  );
}

const GROUPS: Array<[string, string]> = [['session', 'Session'], ['turn-loop', 'Turn loop'], ['pr-side', 'PR side'], ['backlog', 'Backlog'], ['release-canon', 'Release and canon']];

export function SkillCatalogue() {
  const d = useDocsData();
  const proposed = Object.fromEntries(siteConfig.proposedRenames.map((r) => [r.from, r.to]));
  return (
    <div data-testid="skill-catalogue">
      {GROUPS.map(([id, label]) => {
        const skills = d.allHatsuSkill.nodes.filter((s) => s.group === id);
        if (!skills.length) return null;
        return (
          <section key={id} id={`group-${id}`} className="scroll-mt-24">
            <h3>{label} <span className="font-mono text-sm text-muted">· {skills.length}</span></h3>
            <ul className="not-prose grid gap-3">
              {skills.map((s) => (
                <li key={s.name} id={`skill-${s.name}`} className="surface scroll-mt-24 p-4" data-skill={s.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-semibold"><Name code={s.name} alias={s.alias} proposed={proposed[s.name]} /></h4>
                    {s.gate ? <span className="font-mono text-xs text-muted">{t('docs.gate')}: {s.gate}</span> : null}
                  </div>
                  <p className="mt-1 text-sm">{s.description}</p>
                  <dl className="mt-2 grid gap-y-1 text-sm text-muted sm:grid-cols-[8rem_1fr] sm:gap-x-3">
                    {s.meaningHtml ? <><dt className="font-mono text-xs uppercase">{t('docs.meaning')}</dt><dd><InlineMd html={s.meaningHtml} /></dd></> : null}
                    {s.stepsHtml ? <><dt className="font-mono text-xs uppercase">{t('docs.runs')}</dt><dd><InlineMd html={s.stepsHtml} /></dd></> : null}
                    {s.prerequisitesHtml?.length ? <><dt className="font-mono text-xs uppercase">{t('docs.prerequisites')}</dt><dd>{s.prerequisitesHtml.map((h, i) => <InlineMd key={i} as="div" html={h} />)}</dd></> : null}
                    {s.calledByHtml ? <><dt className="font-mono text-xs uppercase">{t('docs.calledBy')}</dt><dd><InlineMd html={s.calledByHtml} /></dd></> : null}
                  </dl>
                  <details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">frontmatter description, verbatim</summary><p className="mt-1">{s.frontmatterDescription}</p></details>
                  <a href={`${siteConfig.github.hatsu}/blob/main/${s.path}`} rel="noopener" className="mt-2 inline-block font-mono text-xs text-accent">{s.path}</a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function GatesTable() {
  const d = useDocsData();
  return (
    <Table data-testid="gates-table">
      <thead><tr><th>Gate</th><th>Clause</th><th>What it is</th><th>Delegable?</th></tr></thead>
      <tbody>{d.allHatsuGate.nodes.map((g) => <tr key={g.gate}><td><strong>{g.gate.replace(/\*/g, '')}</strong></td><td><code>{g.clause}</code></td><InlineMd as="td" html={g.whatHtml} /><InlineMd as="td" html={g.delegableHtml} /></tr>)}</tbody>
    </Table>
  );
}

export function TiersTable() {
  const d = useDocsData();
  return (
    <Table data-testid="tiers-table">
      <thead><tr><th>Tier</th><th>Role</th><th>Claude Code</th><th>Codex</th><th>Cursor</th><th>Antigravity</th></tr></thead>
      <tbody>{d.allModelTier.nodes.map((r) => <tr key={r.tier}><td><code>{r.tier}</code></td><InlineMd as="td" html={r.role} /><td><code>{r.claudeCode}</code></td><td><code>{r.codex}</code></td><td><code>{r.cursor}</code></td><td><code>{r.antigravity}</code></td></tr>)}</tbody>
    </Table>
  );
}

export function ProfilesTable() {
  const d = useDocsData();
  return (
    <Table>
      <thead><tr><th>Profile</th><th>Per turn</th><th>Deferred to mukai</th><th>Report</th></tr></thead>
      <tbody>{d.allRunProfile.nodes.map((r) => <tr key={r.profile}><td><code>{r.profile}</code></td><InlineMd as="td" html={r.perTurnHtml} /><InlineMd as="td" html={r.deferredHtml} /><td><code>{r.report}</code></td></tr>)}</tbody>
    </Table>
  );
}

export function HumanPhases() {
  const d = useDocsData();
  const skills = Object.fromEntries(d.allHatsuSkill.nodes.map((s) => [s.name, s]));
  return (
    <Table data-testid="human-phases">
      <thead><tr><th>Phase</th><th>What it does</th><th>Why it is the human's</th></tr></thead>
      <tbody>{d.allHumanPhase.nodes.map((p) => { const name = p.phase.replace(/[^a-z-]/g, ''); const s = skills[name]; return <tr key={p.phase}><td>{s ? <Name code={s.name} alias={s.alias} /> : <strong>{p.phase}</strong>}</td><InlineMd as="td" html={p.whatHtml} /><InlineMd as="td" html={p.whyHtml} /></tr>; })}</tbody>
    </Table>
  );
}

export function ConfigFiles() {
  const d = useDocsData();
  return (
    <Table data-testid="config-files">
      <thead><tr><th>File</th><th>Lives in</th><th>Decides</th><th>Reference</th></tr></thead>
      <tbody>{d.allConfigFile.nodes.map((c) => <tr key={c.file}><td><code>{c.file}</code></td><InlineMd as="td" html={c.livesIn} /><InlineMd as="td" html={c.decidesHtml} /><td><a href={`${siteConfig.github.hatsu}/blob/main/docs/config/${c.page}`} rel="noopener">{c.page}</a></td></tr>)}</tbody>
    </Table>
  );
}

export function NenVerbs() {
  const d = useDocsData();
  const families = [...new Set(d.allNenVerb.nodes.map((v) => v.family))];
  return (
    <div data-testid="nen-verbs">
      {families.map((f) => (
        <section key={f} id={`family-${f}`} className="scroll-mt-24">
          <h3><code>nen {f}</code></h3>
          <Table>
            <thead><tr><th>Verb</th><th>Purpose</th><th>Reads</th><th>--json</th></tr></thead>
            <tbody>{d.allNenVerb.nodes.filter((v) => v.family === f).map((v) => <tr key={v.verb} id={`verb-${v.verb.replace(/\s+/g, '-')}`} className="scroll-mt-24"><td><code>{v.verb}</code></td><InlineMd as="td" html={v.purposeHtml} /><InlineMd as="td" html={v.readsHtml} /><td>{v.json}</td></tr>)}</tbody>
          </Table>
        </section>
      ))}
    </div>
  );
}

export function HandbookFamilies() {
  const d = useDocsData();
  return (
    <Table data-testid="handbook-families">
      <thead><tr><th>Family</th><th>Where</th><th>Prefix</th></tr></thead>
      <tbody>{d.allHandbookFamily.nodes.map((f) => <tr key={f.where}><td>{f.family}</td><td><a href={`${siteConfig.github.handbooks}/blob/main/${f.where}`} rel="noopener"><code>{f.where}</code></a></td><td><code>{f.prefix}</code></td></tr>)}</tbody>
    </Table>
  );
}

export function UxRules() {
  const d = useDocsData();
  return <ul>{d.allUxRule.nodes.map((r) => <li key={r.ruleId}><code>{r.ruleId}</code> — {r.title}</li>)}</ul>;
}

export function Changelog({ repo }: { repo: 'hatsu' | 'nen' | 'handbooks' }) {
  const d = useDocsData();
  const entries = d.allChangelogEntry.nodes.filter((e) => e.repo === repo);
  const url = siteConfig.github[repo];
  return (
    <div data-testid={`changelog-${repo}`}>
      {entries.map((e, i) => (
        <section key={`${e.title}-${i}`} className="mb-6">
          <h3 className="flex flex-wrap items-baseline gap-2"><span>{e.version ?? e.title}</span>{e.date ? <span className="font-mono text-sm text-muted">{e.date}</span> : null}</h3>
          {e.title !== e.version ? <p className="text-sm text-muted">{e.title}</p> : null}
          <ul>{e.bullets.map((b, j) => <InlineMd key={j} as="li" html={b} />)}</ul>
          {e.truncated ? <p className="text-sm text-muted">… more in <a href={`${url}/blob/main/CHANGELOG.md`} rel="noopener">CHANGELOG.md</a></p> : null}
        </section>
      ))}
      <p className="text-sm text-muted">Showing the latest {entries.length} sections. The full history is <a href={`${url}/blob/main/CHANGELOG.md`} rel="noopener">CHANGELOG.md</a>.</p>
    </div>
  );
}

export const docsComponents = { table: Table, pre: Pre, Snippet, SkillCatalogue, AgentRoster, LeadAgent, GatesTable, TiersTable, ProfilesTable, HumanPhases, ConfigFiles, NenVerbs, HandbookFamilies, UxRules, Changelog, Versions, NenPin, SourceStamp, Name, Badge, Mark, InlineMd };
