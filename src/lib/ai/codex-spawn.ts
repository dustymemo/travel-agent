import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { CodexRunner } from "./codex-cli";

/**
 * Default runner: `codex exec`, prompt piped to stdin, final message read from
 * a temp `--output-last-message` file (Codex's stdout also carries agent logs).
 *
 * Thin I/O glue (excluded from coverage); the testable logic lives in
 * CodexCliProvider. Like ClaudeCliProvider (TA-55) we run in a neutral cwd —
 * Codex is an agentic CLI that would otherwise load the repo's AGENTS.md and
 * break the JSON contract — and enable `shell` on Windows for the `.cmd` shim.
 */
const isWindows = process.platform === "win32";
const NEUTRAL_CWD = tmpdir();

export const spawnCodex: CodexRunner = async (args, input, timeoutMs) => {
  const dir = await mkdtemp(join(tmpdir(), "roam-codex-"));
  const outFile = join(dir, "last.txt");

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "codex",
        [...args, "--output-last-message", outFile, "-"],
        { stdio: ["pipe", "pipe", "pipe"], shell: isWindows, cwd: NEUTRAL_CWD },
      );

      let stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`codex CLI timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`codex CLI exited ${code}: ${stderr.trim()}`));
      });

      child.stdin.write(input);
      child.stdin.end();
    });

    return await readFile(outFile, "utf8");
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
};
