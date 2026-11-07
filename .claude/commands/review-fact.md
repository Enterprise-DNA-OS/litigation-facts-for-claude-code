---
description: "review-fact for the selected litigation matter"
---

# review-fact

Read CLAUDE.md. Record only the human reviewer and their supplied reason. Verify current citations first. Do not manufacture sign-off, infer privilege or resolve contradictions.

Gather the real values and named actor from the request. The following is syntax, not permission to create sample records. Run --dry-run when checking a proposed change.

```bash
npm run facts -- review-fact --ref=F01 --note="Original evidence checked by the named reviewer" --matter=HARBOUR --actor="Named operator" --json
```

Replace the example values with the user's supplied values. Ambiguous matches list candidates and fail. Never guess which record they mean. Report what changed or what needs attention, with the evidence references. Never send, publish or file anything.
