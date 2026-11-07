---
description: "import for the selected litigation matter"
---

# import

Read CLAUDE.md. Read docs/replace-casefleet.md first. Use the actual export headers. Inspect the worksheet names and a sample without exposing confidential text unnecessarily. Run a dry run and compare counts before applying. Source, witness and issue descriptions remain raw until explicitly linked. Never invent evidence links.

Gather the real values and named actor from the request. The following is syntax, not permission to create sample records. Run --dry-run when checking a proposed change.

```bash
npm run facts -- import casefleet --file=imports/facts.xlsx --matter=HARBOUR --actor="Named operator" --json
```

Replace the example values with the user's supplied values. Ambiguous matches list candidates and fail. Never guess which record they mean. Report what changed or what needs attention, with the evidence references. Never send, publish or file anything.
