# Litigation Facts for Claude Code

Read README.md and docs/compliance.md. One database and one CLI: `npm run facts -- <command>`. Recipes are in .claude/commands. Never create a second runtime-specific command library.

Use `--matter=CODE` for all matter-scoped work, `--ref=CODE` for a selected record, `--actor="Name"` on writes, and `--json` for machine output. Do not infer the actor or the matter when several are plausible. Show candidates and resolve ambiguity. Do not infer evidence, dates, positions or legal conclusions. Date input is ISO YYYY-MM-DD; use precision month or year when applicable. Never replace unknown dates with today.

## Command arguments

- add-matter: --code --name [--owner --purpose --retention-review=DATE --access-review=DATE]
- add-fact: --code --name [--date=DATE --precision=day|month|year --owner --due=DATE --position=alleged|agreed|disputed]
- add-source: --code --name [--locator --confidentiality=unreviewed|ordinary|confidential|privileged]
- add-issue: --code --name [--owner]
- add-witness: --code --name [--role]
- add-task: --code --name --owner --due=DATE
- revise-matter: changed --name, --owner, --purpose, --status=open|closed, --retention-review or --access-review
- revise-task: --ref and changed --name, --owner or --due
- revise-fact: --ref and changed --name, --date, --owner, --due or --position
- revise-source: --ref and changed --name, --locator or --confidentiality
- cite: --fact --source --pinpoint [--stance=supports|disputes]
- link-issue, link-witness: --fact --ref
- contradict: --fact --other --note
- review-fact, complete-task: --ref --note
- log: --note
- witness-brief, draft-witness: --ref
- import casefleet: --file [--sheet --map --update --dry-run]
- export: [--out=directory]

All mutations accept --dry-run. Raw imported descriptions are not verified citations. Review and link them before calling a fact supported. Repeating a citation after reviewing changed evidence refreshes its revision. A human review does not resolve contradictions.

## Local operation

Node 20+. `npm install`, `npm run demo`, `npm test`, `npm run docs`, `npm run view`. Never seed a live or shared database. Tests clear DATABASE_URL unless TEST_DATABASE_URL explicitly points to a disposable database. Do not read or print credentials. Do not commit imports, drafts, exports or evidence.

Use the database owner or a restricted trusted operator connection. RLS blocks unconfigured public roles; it does not implement per-lawyer or per-matter permissions. This is a local casework workspace, not a hosted case portal. Back up and restrict the database and generated files.

All documents are internal drafts. Never send, file, publish or upload case records. Do not decide whether a source is privileged or a fact is legally proven. Keep review prompts distinct from compliance certification. Use plain language, no em dashes or buzzwords.
