---
description: Review and update CLAUDE.md and .claude/rules/ to match current codebase state
disable-model-invocation: true
---

Analyze the current codebase and update project documentation to match reality.

Steps:

1. Read `package.json` for current dependencies and scripts.
2. Scan the directory structure (`app/`, `components/`, `lib/`, `prisma/`, `styles/`).
3. Read `prisma/schema.prisma` for current models and conventions.
4. Read key files (`lib/auth.ts`, `lib/public-auth.ts`, `lib/db.ts`, `app/layout.tsx`) for current patterns.
5. Compare findings against `CLAUDE.md` and each file in `.claude/rules/`.
6. Update any file that is out of date - fix versions, add missing entries, remove stale content, correct patterns.
7. Report what changed.
