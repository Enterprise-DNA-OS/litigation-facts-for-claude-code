---
description: "revise-fact for the selected litigation matter"
---

# revise-fact

Read CLAUDE.md. Explain that changing a fact clears its review and makes old citations stale. Preserve opposing accounts, use contradict rather than erasing inconvenient evidence.

Gather the real values and named actor from the request. The following is syntax, not permission to create sample records. Run --dry-run when checking a proposed change.

```bash
npm run facts -- revise-fact --ref=F01 --name="Corrected recorded account" --matter=HARBOUR --actor="Named operator" --json
```

Replace the example values with the user's supplied values. Ambiguous matches list candidates and fail. Never guess which record they mean. Report what changed or what needs attention, with the evidence references. Never send, publish or file anything.
