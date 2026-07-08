import { spawn } from "node:child_process";
import type { ClaudeRunner } from "./claude-cli";

/**
 * Default runner: spawns `claude`, pipes the prompt to stdin, collects stdout.
 *
 * This is thin I/O glue (excluded from coverage). The testable decision-making
 * lives in ClaudeCliProvider, which receives a runner via constructor injection.
 */
export const spawnClaude: ClaudeRunner = (args, input, timeoutMs) =>
  new Promise<string>((resolve, reject) => {
    const child = spawn("claude", args, { stdio: ["pipe", "pipe", "pipe"] });

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
