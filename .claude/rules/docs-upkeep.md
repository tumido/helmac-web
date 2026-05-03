# Documentation Upkeep

After completing any plan implementation or significant body of work (new features, refactors, dependency changes, schema changes, new patterns), and **before the conversation is compacted**, you MUST review and update project documentation:

1. **Check `CLAUDE.md`** - Does it still accurately reflect the tech stack, file structure, commands, and project overview? Update if any of the following changed:
   - Dependencies added, removed, or upgraded (especially major versions)
   - File/directory structure changed
   - npm scripts added or modified
   - Safety rules need updating

2. **Check `.claude/rules/` files** - Does any rule file need updating? Check the ones relevant to the work just completed:
   - `components.md` - Component patterns, MUI usage, layout wrappers
   - `server-actions.md` - Action structure, return types, auth patterns
   - `forms.md` - Form hooks, submit patterns
   - `data-fetching.md` - Service/cache patterns
   - `database.md` - Schema conventions, migration commands
   - `auth.md` - Auth systems, role hierarchy, env vars
   - `api-routes.md` - Route handler patterns, upload patterns
   - `security.md` - Env vars, validation, encryption
   - `troubleshooting.md` - Known issues and fixes

3. **Create new rule files** if a new pattern area was introduced that doesn't fit existing files.

4. **Remove or update stale content** - Delete rules that no longer apply.

Do not ask for permission to perform this review - just do it silently. Only mention documentation changes to the user if something significant was updated.
