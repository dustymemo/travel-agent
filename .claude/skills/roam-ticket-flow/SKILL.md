---
name: roam-ticket-flow
description: The end-to-end workflow for picking up and shipping a Roam (travel-agent) ticket — read #travel-agent on Discord for the next piece of work, branch off the TA ticket, build it test-first, open a PR, post it back to Discord for review, and say what comes next. Use whenever the user asks "what's next", "pick up the next ticket", or wants a TA ticket shipped end to end.
---

# Roam ticket flow

The standing workflow for this repo. Follow it in order; each step feeds the next.

## 1. Find the work

Read Discord **#travel-agent** (`1526444993693356112`) — log in with
`mcp__discord__discord_login` first (token is pre-configured), then
`mcp__discord__discord_read_messages`. Take the most recent message as the
intended next piece of work.

**Discord is a hint, not the source of truth.** The channel is often just links
or notes with no assignment in it. If nothing there names work, say so plainly
rather than inventing a mandate, then fall back to Jira.

Jira project **TA**, cloudId `4295656b-742a-40a5-8fbf-3d969b5fd5b6`:

```
project = TA AND statusCategory != Done ORDER BY priority DESC, key ASC
```

That query returns >100k chars — it will blow the tool limit. Ask only for the
fields you need, or parse the saved file (there is no `jq` on this box; use
PowerShell `ConvertFrom-Json`).

Before starting anything new, **check for open PRs** (`gh pr list`). Unmerged,
green PRs are almost always the real next action — landing them beats opening a
new front.

Every board item is Medium priority, so the board never picks for you. Read the
descriptions and choose on dependencies (what unblocks the most), then confirm
with the user via AskUserQuestion rather than guessing.

## 2. Branch and build

Never commit to master. Branch per ticket: `TA-<n>-<kebab-summary>`. Move the
ticket to **In Progress** (transition id `21`; `31` = In Review, `41` = Done).

**TDD is mandatory** (AGENTS.md §1) — red → green → refactor, tests co-located
as `*.test.ts`. If a test passes the first time you run it, it has never been
red and proves nothing: mutate the source, watch it fail for the right reason,
then restore.

Read `AGENTS.md` and the relevant guide under `node_modules/next/dist/docs/`
before writing code — this Next.js (16.2) differs from training data, and
Tailwind v4 is CSS-first (tokens live in `globals.css`; there is no
`tailwind.config`).

Scope surprises are normal. When you discover the ticket is bigger or different
than written (an overloaded token, a pre-existing bug), surface it to the user
with numbers and a recommendation **before** building — don't silently expand.

## 3. Verify for real

Tests and typecheck are necessary, not sufficient. Run the gate:

```
npm test && npm run typecheck && npm run lint && npm run build
```

Then actually drive the app for anything user-visible. `TRAVEL_AI_PROVIDER=fake
npm run start`, then Playwright against `localhost:3000`. Playwright is not a
project dependency (bundle discipline — don't add it): require it from the npx
cache via `NODE_PATH`, matching the cached version to the installed browser
build, and drive a real plan end to end.

Prefer probing computed styles/DOM over eyeballing screenshots — reading pixels
is unreliable, and a probe will correct you.

## 4. PR

Squash-merge is the house style (history reads `TA-57: … (#21)`). Open with
`gh pr create`. In the body: what changed and why, findings with concrete
numbers, and an explicit flag on anything visually or behaviourally opinionated
so the reviewer can push back. End with the Claude Code footer.

Deferred work gets its own Jira ticket, linked from the PR — never dropped.

## 5. Post to Discord, then say what's next

Send to **#travel-agent** with `mcp__discord__discord_send`. Include:

- the ticket link (`https://david-sun.atlassian.net/browse/TA-<n>`)
- the PR link
- a short summary of what changed and anything needing a judgement call
- what to do next

**2000-char limit** — split longer posts. Move the ticket to **In Review**
(`31`) once the PR is up.

Close by telling the user what comes next and what needs their decision.
