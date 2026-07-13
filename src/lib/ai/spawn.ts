import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import type { ClaudeRunner } from "./claude-cli";

/**
 * Default runner: spawns `claude`, pipes the prompt to stdin, collects stdout.
 *
 * This is thin I/O glue (excluded from coverage). The testable decision-making
 * lives in ClaudeCliProvider, which receives a runner via constructor injection.
 *
 * On Windows the executable is the `claude.cmd` shim, which Node's `spawn`
 * refuses to run without a shell (ENOENT / EINVAL since the 2024 .cmd security
 * patch). We enable `shell: true` there; the provider keeps args to static
 * flags and folds all untrusted text into stdin, so nothing is shell-quoted.
 * Linux/Docker spawn `claude` directly (no shell), unchanged.
 *
 * `cwd` is forced to a neutral temp dir: `claude` is the Claude Code CLI, which
 * otherwise loads the surrounding repo's CLAUDE.md/AGENTS.md and acts as a
 * coding agent — on refinement turns it would recognise our own prompt payload
 * and reply conversationally ("did you paste this by accident?") instead of
 * planning, breaking the JSON contract. Running outside the repo keeps it a
 * plain planner.
 */
const isWindows = process.platform === "win32";
const NEUTRAL_CWD = tmpdir();

export const spawnClaude: ClaudeRunner = (args, input, timeoutMs) =>
  new Promise<string>((resolve, reject) => {
    const child = spawn("claude", args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: isWindows,
      cwd: NEUTRAL_CWD,
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`claude CLI timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`claude CLI exited ${code}: ${stderr.trim()}`));
    });

    child.stdin.write(input);
    child.stdin.end();
  });
