# Litigation Facts for Claude Code

Your case chronology, evidence citations, issues and witness preparation in a database you own. See the gaps before the case review.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and run the demo. | Your case fields, review rules, imports and documents. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=casefleet) · [Instead of Casefleet](https://enterprisedna.co/omni/instead-of/casefleet)

## Start with the case review

Node 20 or later. Open this folder with Claude Code, Codex, OpenCode or Cursor.

```bash
npm install
npm run demo
npm run facts -- chronology --matter=HARBOUR
npm run facts -- issue-proof --matter=HARBOUR
npm run docs
npm run view
```

The demo is fictional. A supplier's delivery note conflicts with a warehouse log. A buyer recalls an undated specification change. Two reviews and a records request are overdue. No actual client records are included.

Local PGlite needs no server. Set DATABASE_URL for PostgreSQL 15 or later and use a trusted database owner account. This is a single trusted operator workspace. Do not expose it through a public database role. No per-matter user access control is supplied. Source documents stay in your own restricted evidence store; the database holds references, not document contents.

## The weekly rituals

/weekly-review combines chronology, attention, issue proof and owner workload. /source-gaps finds missing or stale citations. /witness-brief prepares the witness's linked facts. /contradictions keeps opposing accounts visible. /review-fact records a named human review of the current revision. /draft-chronology and /draft-witness write private HTML drafts and never send.

38 CLI commands and 41 workflow recipes ship with this version. Run `npm run facts -- help` for every command. Every CLI command supports `--json`. Writes require `--actor=NAME` and support `--dry-run`. Names match without case, codes match exactly and UUID prefixes work. Ambiguous names list candidates and fail. The command recipes live in .claude/commands for all runtimes.

## Evidence is tied to what was reviewed

A citation records both the fact revision and source revision. Changing either makes the old citation stale. Repeating cite after checking the evidence refreshes that reference. Changing a fact clears its review. A review requires current support and no stale citations. An agreed or disputed position remains a human assertion, never a software verdict. Contradictions remain visible after review.

The activity record captures before and after values with the actor. Database administrators can alter it: this is not a tamper-proof evidence system. The tool does not decide admissibility, calculate court deadlines, file documents or certify legal compliance. /compliance checks recorded safeguard reviews and local evidence rules. [Rules and sources](docs/compliance.md).

## Ten questions to ask of your own records

These are tested queries this build answers. They are not claims that Casefleet cannot answer the same questions.
1. Which facts have no current supporting citation? Run `source-gaps`.
2. Which citations became stale after a fact or source changed? Run `chronology`.
3. Which issues have no reviewed supporting facts? Run `issue-proof`.
4. Which accounts contradict each other? Run `contradictions`.
5. What does each witness have to explain? Run `witness-brief --ref=W01`.
6. Who owns the most overdue reviews and tasks? Run `owner-load`.
7. Which facts still have no date? Run `attention`.
8. Which case records need a retention or access review? Run `compliance`.
9. Who changed a fact and when? Run `activity`.
10. What evidence and tasks belong in Monday's review? Run `weekly-review`.

## Bring your Casefleet chronology

Create the destination matter, download the Casefleet Fact Spreadsheet, then import it in one command:

```bash
npm run facts -- add-matter --code=CASE01 --name="Our case" --actor="Your name"
npm run facts -- import casefleet --matter=CASE01 --file=imports/facts.xlsx --actor="Your name" --dry-run
npm run facts -- import casefleet --matter=CASE01 --file=imports/facts.xlsx --actor="Your name"
```

Dates and fact text map directly. All original columns, including entity, issue and source descriptions, are retained with each fact. Those descriptions need reviewed links before they count as evidence. A file with different column names needs a small field map; use --sheet for a workbook with several sheets. CSV is supported too. Read [the export steps and mapping limits](docs/replace-casefleet.md).

The importer is atomic. An invalid row rolls back the whole file. Repeating unchanged rows does not duplicate them. Stable source IDs allow an explicit --update for changed rows. Without IDs, changed rows become new facts and require reconciliation. The included fixture is a synthetic mapping example, not an export captured from a Casefleet account.

## Documents and views

Change brand.json once. `npm run docs` writes a draft chronology, issue outline and witness briefs. `npm run view` writes read-only weekly, proof and safeguard reports. Outputs contain internal working material, including privileged references. Review them before any disclosure. Generated records and local data are excluded from version control.

No document viewer, transcription, automatic fact extraction or live collaborative editor is included. Enterprise DNA can scope these into the version it builds for your practice. [What a screen adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our name and logo on the chronology.
2. Import one case without saving it.
3. Map our exported fact description column.
4. Keep approximate dates explicit.
5. Link the delivery note to the recorded fact.
6. Mark the privileged source before drafting.
7. Assign next week's witness preparation tasks.
8. Show facts that have no evidence reference.
9. Add our review sign-off field.
10. Draft the issue outline for Monday.

/customise writes and tests the requested migration. /new-view adds a read-only report.

## Verification

`npm test` uses temporary data, migrates and seeds twice, and exercises every CLI command. It checks stale citations, review invalidation, cross-matter constraints, ambiguous names, import rollback, repeat imports, XLSX handling, exports, drafts and HTML escaping. CI runs Node 20 and 22 on Windows and Linux, plus PostgreSQL. Check the actual workflow result before claiming a platform passed.

## Built and run for you

Enterprise DNA builds your version, brings across agreed Casefleet records and runs it through Omni by Enterprise DNA. One setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=casefleet).

MIT. Not affiliated with Casefleet or Anthropic. Hosting and agent usage have their own costs.
