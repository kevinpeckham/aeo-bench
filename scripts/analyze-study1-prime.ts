/**
 * Study 1′ re-score (docs/BRIEF-STUDY1-PRIME.md): frozen Study 1
 * records re-graded with gradeV2; gates re-evaluated as registered.
 *
 *   bun run scripts/analyze-study1-prime.ts
 */
import { existsSync, readFileSync } from "node:fs";
import tasksFile from "../corpus/tasks.json";
import type { Matcher } from "../src/grading/answers.js";
import { gradeV2 } from "../src/grading/answers.js";
import type { CellRecord } from "../src/harness/fetch-runner.js";

const MODELS = [
	"google/gemini-3.5-flash",
	"anthropic/claude-sonnet-4.5",
	"anthropic/claude-opus-4.8",
	"moonshotai/kimi-k3",
	"openai/gpt-oss-120b",
	// Haiku backfill (docs/BRIEF-HAIKU.md): descriptive column; gates pinned.
	"anthropic/claude-haiku-4.5",
];
const GATE_MODELS = new Set([
	"google/gemini-3.5-flash",
	"anthropic/claude-sonnet-4.5",
	"anthropic/claude-opus-4.8",
	"moonshotai/kimi-k3",
	"openai/gpt-oss-120b",
]);

const AIDS = ["A-llmstxt", "A-sitemap", "A-markdown", "A-stacked"];
const matchers = new Map<string, Matcher>(
	tasksFile.tasks.map((t) => [t.id, t.matcher as Matcher]),
);

interface Cell2 extends CellRecord {
	correctV2: boolean;
}
const records: Cell2[] = [];
for (const model of MODELS) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const path = `results/raw/study1-${slug}.jsonl`;
	if (!existsSync(path)) continue;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		if (line.trim() === "") continue;
		const r = JSON.parse(line) as CellRecord;
		const m = matchers.get(r.taskId);
		records.push({ ...r, correctV2: m ? gradeV2(r.answer, m) : r.correct });
	}
}
const present = (r: Cell2) => r.cls !== "absent";
const short = (m: string) => m.split("/")[1] as string;
const rows = (m: string, arm: string) =>
	records.filter((r) => r.model === m && r.arm === arm);

function exactBinomialP(k: number, n: number): number {
	let p = 0;
	for (let i = 0; i <= k; i += 1) {
		let c = 1;
		for (let j = 0; j < i; j += 1) c = (c * (n - j)) / (j + 1);
		p += c / 2 ** n;
	}
	return p;
}

console.log(
	"=== v1 → v1′ per model × arm (present correct / absent correct) ===",
);
for (const model of MODELS) {
	for (const arm of ["A-baseline", ...AIDS]) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const p1 = rs.filter(present).filter((r) => r.correct).length;
		const p2 = rs.filter(present).filter((r) => r.correctV2).length;
		const a1 = rs.filter((r) => !present(r)).filter((r) => r.correct).length;
		const a2 = rs.filter((r) => !present(r)).filter((r) => r.correctV2).length;
		console.log(
			`${short(model)} ${arm}: present ${p1}→${p2}/28, absent ${a1}→${a2}/8`,
		);
	}
}

console.log(
	"\n=== H1′ (paired aid vs baseline, present classes, pooled, v2) ===",
);
let anyAidSig = false;
for (const arm of AIDS) {
	let aidOnly = 0;
	let baseOnly = 0;
	for (const model of MODELS) {
		if (!GATE_MODELS.has(model)) continue;
		const base = new Map(
			rows(model, "A-baseline")
				.filter(present)
				.map((r) => [r.taskId, r]),
		);
		for (const r of rows(model, arm).filter(present)) {
			const b = base.get(r.taskId);
			if (!b) continue;
			if (r.correctV2 && !b.correctV2) aidOnly += 1;
			else if (!r.correctV2 && b.correctV2) baseOnly += 1;
		}
	}
	const n = aidOnly + baseOnly;
	const p = n > 0 ? exactBinomialP(baseOnly, n) : 1;
	const sig = n > 0 && p < 0.05 && aidOnly > baseOnly;
	if (arm !== "A-stacked" && sig) anyAidSig = true;
	console.log(
		`${arm}: aid-only ${aidOnly}, baseline-only ${baseOnly}, one-sided p=${p.toFixed(4)}${sig ? " *" : ""}`,
	);
}

console.log("\n=== H3′ (comparative no-harm, v2) ===");
let h3 = true;
for (const model of MODELS) {
	if (!GATE_MODELS.has(model)) continue;
	const basePres = rows(model, "A-baseline")
		.filter(present)
		.filter((r) => r.correctV2).length;
	const baseAbs = rows(model, "A-baseline").filter(
		(r) => !present(r) && !r.correctV2,
	).length;
	for (const arm of AIDS) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const pres = rs.filter(present).filter((r) => r.correctV2).length;
		const abs = rs.filter((r) => !present(r) && !r.correctV2).length;
		if (!(pres >= basePres - 2 && abs <= baseAbs + 2)) {
			h3 = false;
			console.log(
				`${short(model)} ${arm}: HARM (${pres} vs ${basePres}, absent-miss ${abs} vs ${baseAbs})`,
			);
		}
	}
}
if (h3) console.log("comparative no-harm holds under v2 everywhere");

console.log("\n=== Gates (Study 1′) ===");
console.log(`H1′: ${anyAidSig ? "PASS" : "FAIL"}`);
console.log(
	"H2: carried unchanged (no grading dependency) — FAIL by the letter via opus's ratio",
);
console.log(`H3′: ${h3 ? "PASS" : "FAIL"}`);
console.log(
	`STUDY GATE (1′): ${anyAidSig && h3 ? "still governed by H2 → FAIL" : "FAIL"}`,
);
