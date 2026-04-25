# Parallel Instances

Multiple Claude instances may work on this codebase simultaneously. Follow these rules to avoid conflicts.

## Worktree isolation

When told you are working in parallel, operate in a git worktree — never edit files in the main working tree if another instance may be active there. Run `git worktree list` to see active worktrees. When spawning agents via the Agent tool, use `isolation: "worktree"`.

When spawning worktree agents, use `mode: "acceptEdits"`. Other modes (`bypassPermissions`, `auto`, `default`) do not reliably grant Write/Edit tool access in worktree-isolated agents.

## Worktree environment setup

Worktrees only get tracked (committed) files. Gitignored files like `node_modules/`, `.env`, and `.next/` are missing and must be set up before doing any work.

**Run these steps FIRST in every new worktree, before reading files or writing code.**

Each step must be a separate, simple Bash call — compound commands with variable assignments (e.g., `MAIN_TREE=$(...)`) will be denied by the permission system since it matches on the first word of the command.

**Step 1:** Find the main tree path:
```bash
git worktree list --porcelain
```
Read the first line to get the main tree path (e.g., `/Users/.../helmac/web`).

**Step 2:** Copy node_modules (copy, not symlink — workers may add dependencies):
```bash
cp -a /path/to/main/tree/node_modules ./node_modules
```

**Step 3:** Copy environment file:
```bash
cp /path/to/main/tree/.env ./.env
```
If `.env` doesn't exist, try `.env.local` instead.

**If `cp` is denied for `.env`** (built-in safety rule may block copying secret files): use the `Read` tool to read the main tree's `.env` file, then use the `Write` tool to create `.env` in the worktree with the same content. This is a workaround for the safety guardrail that blocks `cp` on `.env` files.

**Step 4:** Create feature branch:
```bash
git checkout -b feat/<area>-<what>
```

**Step 5:** Create screenshots directory in the **main tree** (not the worktree — worktree is cleaned up after work):
```bash
mkdir -p /path/to/main/tree/screenshots/<task-name>
```

Use the main tree path from step 1. Name the subfolder after the task (e.g., `07-scroll-to-top`). Save all screenshots there so they survive worktree removal and are available for PR descriptions.

If any of steps 1-3 fail, stop and report the error — nothing else will work.

## Permissions

The worktree gets `.claude/settings.local.json` from the **committed** state at worktree creation time. If permissions have been updated but not committed, the worktree will have stale permissions and tool calls will be denied.

**Before spawning worktree agents:** ensure all changes to `.claude/settings.local.json` are committed on the base branch.

## Base branch

Do NOT assume `main` or `master` is the base branch. Determine the current base branch by checking which branch the main tree is on:

```bash
git -C /path/to/main/tree branch --show-current
```

Use the main tree path from step 1 of the worktree setup. Use that branch as the merge target for worktree feature branches.

## Dev servers

When working directly in the main tree (interactive session with the user), dev servers are managed externally — never run `npm run dev`. Ask the user to start them if needed.

When working in an **isolated worktree** (parallel background work), you may start the dev server yourself on any available port. Pick a port that doesn't conflict with the main tree (3000) or other worktrees. Stop it when done.

Start worktree dev server with: `PORT=<port> npm run dev`

Run the dev server in the background using Bash with `run_in_background: true`:

```bash
PORT=<port> npm run dev
```

Then verify it started (as a separate command):

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/
```

**Important:** Use the Bash tool's `run_in_background` parameter — do not use `&` or `nohup`. A regular Bash call will hang waiting for the server to exit.

## Verifying UI changes

Use **playwright-parallel MCP** tools (`mcp__playwright-parallel__browser_navigate`, `browser_snapshot`, `browser_take_screenshot`) for isolated browser testing. Each agent gets its own isolated browser session via the `sessionId` parameter — use your agent/worktree name as the session ID to avoid collisions with other parallel workers.

Do NOT use `mcp__chrome-devtools` tools — those connect to the user's main browser session and will interfere with their work.

Do NOT use `mcp__plugin_playwright_playwright` tools — the plugin is disabled in favor of `playwright-parallel` which supports concurrent isolated sessions.

Navigate to your worktree's dev server URL (`http://localhost:<port>`), not the main tree's URL.

Save screenshots to the **main tree's** `screenshots/<task-name>/` directory (see worktree setup step 5). This directory is gitignored but persists after worktree cleanup, keeping screenshots available for PR descriptions.

## Build coordination

In a worktree, `.next/` directories are isolated. In a shared tree, only one instance should build at a time. Always run `npm run lint` before committing.

## Branch conventions

Use `feat/<area>-<what>` or `fix/<area>-<what>`. Each parallel instance must be on its own branch.

## Merging worktree work back to base

You cannot `git checkout <base-branch>` from a worktree — the base branch is checked out in the main tree. Instead:

1. Determine the base branch: `git -C /path/to/main/tree branch --show-current`
2. Commit and rebase onto the base branch from the worktree: `git rebase <base-branch>`
3. Resolve any conflicts, `npm run lint` to verify
4. Merge from the **main repo**: `git -C /path/to/main/tree merge <branch> --ff-only`
5. Stop any worktree dev servers, then exit and remove the worktree via `ExitWorktree`

**Agents must NOT merge into the base branch themselves.** Commit on the feature branch only. The parent session decides whether to merge or keep a separate branch.

### Parent session merge checklist

**Before spawning a worktree agent**, ask the user whether the result should be:
- **Merged** into the base branch (for incremental changes that later work depends on)
- **Left as a feature branch** (for independent changes that will become separate PRs)

When the parent session receives a completed worktree agent result:

1. **Always use `-C` with the main tree path** for git commands — your shell CWD may be stale after worktree removal:
   ```bash
   git -C /path/to/main/tree merge feat/<branch> --no-edit
   ```
2. **Verify the merge landed** — check the commit is on the base branch:
   ```bash
   git -C /path/to/main/tree log --oneline -3
   ```
3. **Only then clean up** — remove the worktree and delete the branch:
   ```bash
   git -C /path/to/main/tree worktree remove .claude/worktrees/<agent-id> --force
   git -C /path/to/main/tree branch -d feat/<branch>
   ```

If keeping as a separate feature branch, skip step 1-2 and only remove the worktree (keep the branch).

Never delete a feature branch before confirming its commits are on the base branch.

## File edit safety (shared tree only)

If not in a worktree, run `git status` before editing — if a file is already modified, another instance may own it. Commit frequently to reduce conflict windows.
