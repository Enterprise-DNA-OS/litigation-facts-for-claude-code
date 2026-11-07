---
description: "revise-source for the selected litigation matter"
---

# revise-source

Read CLAUDE.md. Explain that existing citations to this source become stale. Preserve the original source file. Review citations before refreshing them.

Gather the real values and named actor from the request. The following is syntax, not permission to create sample records. Run --dry-run when checking a proposed change.

```bash
npm run facts -- revise-source --ref=S01 --locator="evidence/revised-source.pdf" --matter=HARBOUR --actor="Named operator" --json
```

Replace the example values with the user's supplied values. Ambiguous matches list candidates and fail. Never guess which record they mean. Report what changed or what needs attention, with the evidence references. Never send, publish or file anything.
