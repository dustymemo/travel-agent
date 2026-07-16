---
name: roam-ticket-flow
description: End-to-end workflow for shipping a Roam (travel-agent) TA ticket — find the work, branch, build test-first, verify in a browser, open a PR, post it to Discord for review. Use when the user asks "what's next", "pick up the next ticket", or wants a TA ticket shipped end to end.
---

# Roam ticket flow

Phases run in order. Each has a **Do**, a **Never**, and the constants you need.

## Constants

| Thing | Value |
|---|---|
| Discord #travel-agent | `1526444993693356112` |
| Jira cloudId | `4295656b-742a-40a5-8fbf-3d969b5fd5b6` |
| Jira project | `TA` · browse at `https://david-sun.atlassian.net/browse/TA-<n>` |
| Transition ids | `21`=In Progress · `31`=In Review · `41`=Done |
| Branch name | `TA-<n>-<kebab-summary>` |
| Bot token | `DISCORD_TOKEN` in `~/.claude.json` (`.projects['C:/Users/Dustin/Desktop/Projects'].mcpServers.discord.env`) |
| Playwright | npx cache, NOT a dependency — see §3 |

---

## 1. Find the work

**Do**
1. `gh pr list` **first**. An unmerged green PR outranks new work — land it.
2. Read Discord (`discord_login` → `discord_read_messages`).
3. Fall back to Jira. Ask only for fields you need:
   `project = TA AND statusCategory != Done ORDER BY priority DESC, key ASC`
4. Pick on **dependencies** (what unblocks the most), then confirm with `AskUserQuestion`.

**Never**
- Never treat Discord as the source of truth. It is usually links/notes with no assignment. If it names no work, **say so** — do not invent a mandate.
- Never let the board pick for you: every TA item is Medium priority. It carries no signal.

**Gotchas**
- That JQL returns >100k chars and blows the tool output limit.
- No `jq` on this box. Parse with PowerShell `ConvertFrom-Json`.

---

## 2. Branch and build

**Do**
1. Branch off `master`. Move ticket to In Progress (`21`).
2. Read `AGENTS.md` + the relevant guide in `node_modules/next/dist/docs/` **before** writing code.
3. TDD: red → green → refactor. Tests co-located `*.test.ts(x)`.

**Never**
- Never commit to `master`.
- Never trust a test that passed on first run — it has never been red, so it proves nothing. **Mutate the source, watch it fail for the right reason, restore.**
- Never silently expand scope. Found an overloaded token / pre-existing bug? Surface it with **numbers + a recommendation** before building.

**Gotchas**
- Next.js 16.2 differs from training data. Tailwind v4 is CSS-first: tokens live in `src/app/globals.css`, there is no `tailwind.config`.
- `git checkout <file>` will NOT restore an untracked file. A "restore" after a mutation test can silently no-op — re-run the test to confirm.

### 2a. UI changes: senior-frontend is mandatory

**Do**
1. Invoke the `senior-frontend` skill.
2. **Read the files in its `references/`.** Open them. The skill summary is NOT the skill.

**Never**
- Never skim headings and call it done. Proof: the reference pairs `disabled:opacity` with `disabled:pointer-events-none`. We shipped only the opacity — and CSS `:hover` still matches a disabled `<button>`, so the disabled send button repainted terracotta→terracotta-deep and looked clickable. Skimming missed it twice; reading caught it in five minutes.

**Standards**
- Server Components by default. `'use client'` only for handlers/state/effects/browser APIs, and only at the leaves. A stateless presentational component still renders on the server even when a client parent passes it `onClick`.
- Semantic HTML. An anchor that navigates stays an anchor. Export a class-string helper (`buttonClasses()`) next to the component so a `next/link` wears the skin without impersonating the element — cheaper and honester than `asChild`/Slot.
- Polymorphic `as` for treatments, not elements (`<article>`/`<section>`/`<h3>` must survive).
- `cn()` always. Never hand-concatenate or `.join(" ")`.
- No new dependency for variants (no cva/shadcn). Use a `Record` lookup.
- Colours come from tokens the contrast contract checks (`src/lib/theme/palette.test.ts`). Never hand-pick a hex.

### 2b. Clean up after yourself

**Do** — before opening the PR, re-read your own diff for what it *added*. Extract the smallest thing that removes duplication you introduced. Prove it with `grep -c` (expect the pattern to collapse to one definition).

**Never** — never file your own mess as someone else's follow-up ticket.

The tell: any class string or pattern written out **more than twice**. Cleaning up your own duplication is in scope even when the wider component work is explicitly deferred — note it in the commit and trim the follow-up ticket.

Don't build a component with **one** call site. That's speculative. Wait for a second, and say so in the PR.

---

## 3. Verify for real

**Do**
```bash
npm test && npm run typecheck && npm run lint && npm run build
```
Then drive the app for anything user-visible:
```bash
TRAVEL_AI_PROVIDER=fake npm run start   # then Playwright at localhost:3000
```

**Never**
- Never stop at green tests. They are necessary, not sufficient.
- Never conclude from looking at a screenshot. **Probe `getComputedStyle`/DOM instead** — reading pixels is unreliable and a probe will correct you. (It has: a bubble "looked" unflipped in a PNG and was provably correct.)
- Never add Playwright as a project dependency (bundle discipline).

**Playwright setup**
- Require it from the npx cache via `NODE_PATH`.
- The cached version MUST match the installed browser build, or it fails with a misleading `run npx playwright install`. Check `playwright-core`'s version against `~/AppData/Local/ms-playwright/`.
- Playwright's bundled ffmpeg has **no H.264 encoder** — it cannot make mp4.

### 3a. Record a video for every frontend ticket

Reviewers should watch the change, not read about it.

```js
const ctx = await browser.newContext({
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  colorScheme: "dark",              // record light and dark separately
  viewport: { width: 1280, height: 800 },
});
// … drive the real flow …
await ctx.close();                  // the .webm only flushes on close
const file = await page.video().path();
```

- Drive the **real** flow (type, send, await the itinerary). Not a static page load.
- `waitForTimeout` between beats, or it renders too fast to follow.
- ~10–20s. Write to the scratchpad, never the repo (`.gitignore` covers `*.webm` as a backstop).
- For a refactor, the claim is "no pixels moved" — probe computed styles before/after to back it.

---

## 4. PR

**Do**
- `gh pr create`. Squash-merge is the house style (`TA-57: … (#21)`).
- Body: what changed, why, findings **with numbers**, and an explicit ⚠️ flag on anything visually or behaviourally opinionated so the reviewer can push back.
- End with the Claude Code footer.
- Deferred work → its own Jira ticket, linked from the PR.

**Never** — never bury an opinionated change in a clean-looking diff.

---

## 5. Post to Discord — once

**Do** — one post when the PR opens. Move the ticket to In Review (`31`). Include:
- ticket link · PR link · CI status
- what changed, and anything needing a judgement call
- what to do next

**Never**
- **Never post again for follow-up fixes on the same PR.** One PR = one Discord post. Extra commits, review fixes and self-caught bugs go in the PR and the reply to the user — not the channel. Keep the channel signal, not a commit log.
- Never exceed 2000 chars — split instead.

### Attaching a video

MCP Discord tools are **text-only** (no attachment param). Use the REST API:

```bash
TOKEN=$(node -e "…read DISCORD_TOKEN from ~/.claude.json…")   # never echo it
curl -X POST "https://discord.com/api/v10/channels/$CHANNEL/messages" \
  -H "Authorization: Bot $TOKEN" \
  -F 'payload_json={"content":"…"}' \
  -F "files[0]=@light.webm;type=video/webm"
```

- Posts as ClaudeBot, same identity as the text updates.
- Cap ~10MB unboosted. Keep the token out of logs and the transcript.

---

## 6. Close out

Tell the user what happened, what needs their decision, and what's next. On merge: ticket → Done (`41`), prune the local branch.
