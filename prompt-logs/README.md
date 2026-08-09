# Prompt Logs

This folder keeps a lightweight record of prompts that shaped the project.

## Why

Git records what changed. Prompt logs record why a change was requested, what
problem was being explored, and what context existed before the code changed.

## Format

Logs are grouped by local date:

```text
prompt-logs/
  2026-08-09.md
  2026-08-10.md
```

Each entry uses this format:

```md
## 01:52 - 0803_bbang

User prompt text goes here.

---
```

## Notes

- Logging is currently configured through `.codex/hooks.json`, which attempts to
  append each submitted Codex user prompt automatically.
- Store user prompts only. Agent responses are usually reflected by code, diffs,
  and commits.
- Do not put secrets, private keys, passwords, or personal data in prompts that
  will be committed.
- If automatic capture is not desired, set `.codex/hooks.json` back to
  `"hooks": {}`.
