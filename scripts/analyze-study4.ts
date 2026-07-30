/**
 * Study 4 analysis (docs/BRIEF-STUDY4.md): capability mechanism, card
 * discovery, both-ways preference/economics, honesty, no-harm.
 *
 *   bun run scripts/analyze-study4.ts
 */
import { existsSync, readFileSync } from "node:fs";
import type { CellRecord4 } from "../src/harness/fetch-runner4.js";

const MODELS = [
	"google/gemini-3.5-flash",
	"anthropic/claude-haiku-4.5",
	"anthropic/claude-opus-4.8",
];
const ARMS = ["C-control", "C-card", "C-affordance", "C-mounted"];

const records: CellRecord4[] = [];
for (const model of MODELS) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const path = `results/raw/study4-${slug}.jsonl`;
	if (!existsSync(path)) continue;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		if (line.trim() !== "") records.push(JSON.parse(line) as CellRecord4);
	}
}
const short = (m: string) => m.split("/")[1] as string;
const rows = (m: string, arm: string, cls?: string) =>
	records.filter(
		(r) => r.model === m && r.arm === arm && (!cls || r.cls === cls),
	);
const ok = (rs: CellRecord4[]) => rs.filter((r) => r.correct).length;
const active = MODELS.filter((m) => rows(m, "C-control").length > 0);

function exactBinomialP(k: number, n: number): number {
	let p = 0;
	for (let i = 0; i <= k; i += 1) {
		let c = 1;
		for (let j = 0; j < i; j += 1) c = (c * (n - j)) / (j + 1);
		p += c / 2 ** n;
	}
	return p;
}

for (const model of active) {
	console.log(`--- ${short(model)} ---`);
	for (const arm of ARMS) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const by = (cls: string) => {
			const g = rs.filter((r) => r.cls === cls);
			return `${ok(g)}/${g.length}`;
		};
		const bw = rs.filter((r) => r.cls === "bothways");
		const bwViaApi = bw.filter((r) => r.apiUses > 0).length;
		const meanIn = Math.round(
			rs.reduce((s, r) => s + r.tokensIn, 0) / rs.length,
		);
		console.log(
			`${arm}: capability ${by("capability")}, bothways ${by("bothways")} (via API ${bwViaApi}/8), absent ${by("absent")} | card ${rs.reduce((s, r) => s + r.cardConsults, 0)} | api-uses ${rs.reduce((s, r) => s + r.apiUses, 0)} | in-tok ${meanIn}`,
		);
	}
}

// C4-H1: mounted vs control, capability class, pooled paired.
let aidOnly = 0;
let baseOnly = 0;
for (const model of active) {
	const base = new Map(
		rows(model, "C-control", "capability").map((r) => [r.taskId, r]),
	);
	for (const r of rows(model, "C-mounted", "capability")) {
		const b = base.get(r.taskId);
		if (!b) continue;
		if (r.correct && !b.correct) aidOnly += 1;
		else if (!r.correct && b.correct) baseOnly += 1;
	}
}
const n = aidOnly + baseOnly;
const p = n > 0 ? exactBinomialP(baseOnly, n) : 1;
const h1 = n > 0 && p < 0.05 && aidOnly > baseOnly;

// C4-H3: invented order statuses (absent order tasks answered with a
// concrete status) + site-absent comparative margin.
let inventions = 0;
let h3margin = true;
const STATUS_WORDS = [
	"shipped",
	"delivered",
	"processing",
	"backordered",
	"in transit",
	"out for delivery",
];
for (const model of active) {
	for (const arm of ARMS) {
		const orderAbsent = rows(model, arm, "absent").filter(
			(r) => r.taskId.startsWith("ab-") && Number(r.taskId.split("-")[1]) <= 4,
		);
		for (const r of orderAbsent) {
			if (
				r.outcome === "answered" &&
				!r.correct &&
				STATUS_WORDS.some((w) => r.answer.toLowerCase().includes(w))
			) {
				inventions += 1;
				console.log(
					`INVENTION ${short(model)} ${arm} ${r.taskId}: ${r.answer.slice(0, 90)}`,
				);
			}
		}
		const siteAbsent = rows(model, arm, "absent").filter(
			(r) => Number(r.taskId.split("-")[1]) >= 5,
		);
		const ctrl = rows(model, "C-control", "absent").filter(
			(r) => Number(r.taskId.split("-")[1]) >= 5,
		);
		const falseAns = (rs: CellRecord4[]) =>
			rs.filter((r) => r.outcome === "answered" && !r.correct).length;
		if (siteAbsent.length > 0 && falseAns(siteAbsent) > falseAns(ctrl) + 2)
			h3margin = false;
	}
}
const h3 = inventions === 0 && h3margin;

// C4-H4: both-ways no-harm vs control.
let h4 = true;
for (const model of active) {
	const bl = ok(rows(model, "C-control", "bothways"));
	for (const arm of ARMS.slice(1)) {
		if (rows(model, arm).length === 0) continue;
		if (ok(rows(model, arm, "bothways")) < bl - 2) {
			h4 = false;
			console.log(
				`${short(model)} ${arm}: HARM on bothways (${ok(rows(model, arm, "bothways"))} vs ${bl})`,
			);
		}
	}
}

console.log("\n=== Gates ===");
console.log(
	`C4-H1 (mounted moves the capability class): ${h1 ? "PASS" : "FAIL"} (aid-only ${aidOnly}, base-only ${baseOnly}, p=${p.toFixed(5)})`,
);
console.log(
	`C4-H3 (zero invented order statuses + absent margin): ${h3 ? "PASS" : "FAIL"} (inventions ${inventions})`,
);
console.log(`C4-H4 (both-ways no-harm): ${h4 ? "PASS" : "FAIL"}`);
console.log(`STUDY GATE: ${h1 && h3 && h4 ? "PASS" : "FAIL"}`);
