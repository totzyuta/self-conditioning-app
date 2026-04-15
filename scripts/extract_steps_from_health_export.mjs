import fs from "node:fs";
import readline from "node:readline";

/**
 * Apple Health export.xml extractor (fast line-based).
 * - aggregates HKQuantityTypeIdentifierStepCount by local date (YYYY-MM-DD from startDate)
 * - filters from 2026-01-01 inclusive
 * - prints seed lines: { date: "YYYY-MM-DD", steps: 12345 },
 */

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/extract_steps_from_health_export.mjs /path/to/export.xml");
  process.exit(2);
}

const FROM = "2026-01-01";

const rl = readline.createInterface({
  input: fs.createReadStream(file, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

// Attribute order varies; capture startDate and value in any order.
const re = /<Record\b[^>]*\btype="HKQuantityTypeIdentifierStepCount"[^>]*>/;
const reStart = /\bstartDate="([^"]+)"/;
const reValue = /\bvalue="([^"]+)"/;
const sums = new Map(); // date -> steps

for await (const line of rl) {
  if (!re.test(line)) continue;
  const ms = reStart.exec(line);
  const mv = reValue.exec(line);
  if (!ms || !mv) continue;
  const start = ms[1];
  const valueRaw = mv[1];
  const date = start.slice(0, 10);
  if (date < FROM) continue;
  const v = Number(valueRaw);
  if (!Number.isFinite(v)) continue;
  const steps = Math.trunc(v);
  sums.set(date, (sums.get(date) || 0) + steps);
}

const dates = Array.from(sums.keys()).sort();
for (const d of dates) {
  const s = sums.get(d) || 0;
  process.stdout.write(`  { date: "${d}", steps: ${s} },\n`);
}

