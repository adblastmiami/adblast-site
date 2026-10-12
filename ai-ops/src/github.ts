/**
 * Turns the owner's labeled GitHub issues into decisions Hermes can read.
 * Used by the workflow: gh issue list ... --json number,title,labels | node src/github.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Decision } from "./pipeline.ts";

interface Issue {
  number: number;
  title: string;
  labels: { name: string }[];
}

export function parseDecisions(issues: Issue[]): Decision[] {
  const out: Decision[] = [];
  for (const i of issues) {
    const m = /^\[Hermes\] Approve batch (\S+?):/.exec(i.title);
    if (!m) continue;
    const labels = new Set(i.labels.map((l) => l.name));
    // Rejection wins if both labels are present.
    if (labels.has("rejected")) out.push({ batchId: m[1], issue: i.number, decision: "rejected" });
    else if (labels.has("approved")) out.push({ batchId: m[1], issue: i.number, decision: "approved" });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(parseDecisions(JSON.parse(readFileSync(0, "utf8")) as Issue[]), null, 2));
}
