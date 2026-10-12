import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./config.ts";
import { writeText } from "./store.ts";

const MAX_LESSONS = 60;
const HEADER = "## Lessons learned (newest last)";

/**
 * Each agent's playbook lives in agents/<name>/memory.md. The part above the
 * lessons header is written by the owner (or Hermes) and never trimmed; lessons
 * are appended after every run and the oldest are dropped past MAX_LESSONS.
 */
export function memoryFile(agent: string, root = ROOT): string {
  return path.join(root, "agents", agent, "memory.md");
}

export function readMemory(agent: string, root = ROOT): string {
  // A dry run keeps its own copy; until it has one, start from the real playbook.
  for (const file of [memoryFile(agent, root), memoryFile(agent)]) {
    if (existsSync(file)) return readFileSync(file, "utf8");
  }
  return "";
}

export function addLessons(agent: string, lessons: string[], date: string, root = ROOT): number {
  const text = readMemory(agent, root);
  const idx = text.indexOf(HEADER);
  const head = idx >= 0 ? text.slice(0, idx).trimEnd() : text.trimEnd() || `# ${agent} playbook`;
  const existing = idx >= 0 ? text.slice(idx + HEADER.length).split("\n").filter((l) => l.startsWith("- ")) : [];
  const known = new Set(existing.map((l) => l.replace(/^- \[[^\]]*\] /, "").toLowerCase()));

  const fresh = lessons
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter((l) => l && !known.has(l.toLowerCase()));
  const all = [...existing, ...fresh.map((l) => `- [${date}] ${l}`)].slice(-MAX_LESSONS);

  writeText(memoryFile(agent, root), `${head}\n\n${HEADER}\n${all.join("\n")}\n`);
  return fresh.length;
}
