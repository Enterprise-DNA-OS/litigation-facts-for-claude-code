---
description: "add-source for the selected litigation matter"
---

# add-source

Read CLAUDE.md. Use the recorded case data and explain the result in the operator's words. Keep the selected matter explicit.

Gather the real values and named actor from the request. The following is syntax, not permission to create sample records. Run --dry-run when checking a proposed change.

```bash
npm run facts -- add-source --code=S10 --name="Source title" --locator="evidence/source.pdf" --confidentiality=unreviewed --matter=HARBOUR --actor="Named operator" --json
```

Replace the example values with the user's supplied values. Ambiguous matches list candidates and fail. Never guess which record they mean. Report what changed or what needs attention, with the evidence references. Never send, publish or file anything.
