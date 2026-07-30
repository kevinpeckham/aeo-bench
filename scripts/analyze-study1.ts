/**
 * Study 1 analysis (BRIEF.md): H1 paired aid-vs-baseline correctness,
 * H2 token economics among unprompted markdown-signal cells, H3
 * comparative no-harm + fabrication, H4 descriptives.
 *
 *   bun run scripts/analyze-study1.ts
 */
import { existsSync, readFileSync } from "node:fs";
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

const records: CellRecord[] = [];
for (const model of MODELS) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const path = `results/raw/study1-${slug}.jsonl`;
	if (!existsSync(path)) continue;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		if (line.trim() !== "") records.push(JSON.parse(line) as CellRecord);
	}
}
const present = (r: CellRecord) => r.cls !== "absent";
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

const activeModels = MODELS.filter((m) => rows(m, "A-baseline").length > 0);
for (const model of activeModels) {
	console.log(`--- ${short(model)} ---`);
	for (const arm of ["A-baseline", ...AIDS]) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const pres = rs.filter(present);
		const abs = rs.filter((r) => !present(r));
		const fabricated = abs.filter((r) => !r.correct).length;
		const mdSignals = rs.filter((r) => r.sentMarkdownSignal).length;
		const meanIn = Math.round(
			rs.reduce((s, r) => s + r.tokensIn, 0) / Math.max(rs.length, 1),
		);
		const meanFetches =
			Math.round((rs.reduce((s, r) => s + r.fetches, 0) / rs.length) * 10) / 10;
		console.log(
			`${arm}: present ${pres.filter((r) => r.correct).length}/${pres.length}, absent-ok ${abs.filter((r) => r.correct).length}/${abs.length} (fabricated ${fabricated}) | md-signal ${mdSignals} | llms ${rs.filter((r) => r.consultedLlmsTxt).length} sitemap ${rs.filter((r) => r.consultedSitemap).length} | mean in-tok ${meanIn}, fetches ${meanFetches}, repeats ${rs.reduce((s, r) => s + r.repeatFetches, 0)}`,
		);
	}
}

// H1: pooled over models, paired per (model, task), present classes.
console.log(
	"\n=== H1 (paired aid vs baseline, present classes, pooled models) ===",
);
let anyAidSig = false;
for (const arm of AIDS) {
	let aidOnly = 0;
	let baseOnly = 0;
	for (const model of activeModels) {
		if (!GATE_MODELS.has(model)) continue;
		const base = new Map(
			rows(model, "A-baseline")
				.filter(present)
				.map((r) => [r.taskId, r]),
		);
		for (const r of rows(model, arm).filter(present)) {
			const b = base.get(r.taskId);
			if (!b) continue;
			if (r.correct && !b.correct) aidOnly += 1;
			else if (!r.correct && b.correct) baseOnly += 1;
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

// H2: token economics among unprompted markdown-signal cells.
console.log("\n=== H2 (markdown token economics, unprompted signals only) ===");
let anySignals = false;
let h2 = true;
for (const model of activeModels) {
	for (const arm of ["A-markdown", "A-stacked"]) {
		const sig = rows(model, arm).filter(
			(r) => r.sentMarkdownSignal && r.correct,
		);
		if (sig.length === 0) continue;
		if (GATE_MODELS.has(model)) anySignals = true;
		const baseCorrect = rows(model, "A-baseline").filter((r) => r.correct);
		const mean = (rs: CellRecord[]) =>
			rs.reduce((s, r) => s + r.tokensIn, 0) / Math.max(rs.length, 1);
		const ratio = mean(sig) / Math.max(mean(baseCorrect), 1);
		if (GATE_MODELS.has(model) && ratio > 0.6) h2 = false;
		console.log(
			`${short(model)} ${arm}: ${sig.length} signal cells, in-tok ratio vs baseline ${(ratio * 100).toFixed(0)}%`,
		);
	}
}
if (!anySignals)
	console.log(
		"NO unprompted markdown signals anywhere — H2 VACUOUS (registered reading applies)",
	);

// H3: comparative no-harm.
console.log("\n=== H3 (comparative no-harm) ===");
let h3 = true;
for (const model of activeModels) {
	if (!GATE_MODELS.has(model)) continue;
	const basePres = rows(model, "A-baseline")
		.filter(present)
		.filter((r) => r.correct).length;
	const baseFab = rows(model, "A-baseline").filter(
		(r) => !present(r) && !r.correct,
	).length;
	for (const arm of AIDS) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const pres = rs.filter(present).filter((r) => r.correct).length;
		const fab = rs.filter((r) => !present(r) && !r.correct).length;
		const ok = pres >= basePres - 2 && fab <= baseFab + 2;
		if (!ok) {
			h3 = false;
			console.log(
				`${short(model)} ${arm}: HARM (present ${pres} vs base ${basePres}, fabricated ${fab} vs ${baseFab})`,
			);
		}
	}
}
if (h3)
	console.log(
		"no aid arm harms correctness or induces fabrication beyond the registered margins",
	);

console.log("\n=== Gates ===");
console.log(
	`H1 (some aid improves correctness): ${anyAidSig ? "PASS" : "FAIL"}`,
);
console.log(
	`H2 (markdown economics): ${anySignals ? (h2 ? "PASS" : "FAIL") : "VACUOUS"}`,
);
console.log(`H3 (comparative no-harm): ${h3 ? "PASS" : "FAIL"}`);
console.log(
	`STUDY GATE: ${anyAidSig && h3 && (!anySignals || h2) ? "PASS" : "FAIL"}`,
);
