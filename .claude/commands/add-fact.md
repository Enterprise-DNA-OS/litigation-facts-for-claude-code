---
description: "add-fact for the selected litigation matter"
---

# add-fact

Read CLAUDE.md. Use the recorded case data and explain the result in the operator's words. Keep the selected matter explicit.

Gather the real values and named actor from the request. The following is syntax, not permission to create sample records. Run --dry-run when checking a proposed change.

```bash
npm run facts -- add-fact --code=F10 --name="Recorded account" --date=2026-01-01 --precision=day --owner="Responsible person" --due=2030-01-01 --matter=HARBOUR --actor="Named operator" --json
```

Replace the example values with the user's supplied values. Ambiguous matches list candidates and fail. Never guess which record they mean. Report what changed or what needs attention, with the evidence references. Never send, publish or file anything.
