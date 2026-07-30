/**
 * Study 2 analysis (docs/BRIEF-STUDY2.md): the orphan-class gate,
 * consultation reads, grep-loop economics, comparative no-harm.
 *
 *   bun run scripts/analyze-study2.ts
 */
import { existsSync, readFileSync } from "node:fs";
import type { CellRecord2 } from "../src/harness/fetch-runner2.js";

const MODELS = [
	"google/gemini-3.5-flash",
	"anthropic/claude-sonnet-4.5",
	"anthropic/claude-opus-4.8",
	"moonshotai/kimi-k3",
	"openai/gpt-oss-120b",
];
const DISCOVERY_ARMS = ["A2-sitemap", "A2-llms-curated", "A2-llms-hier"];
const ALL_ARMS = [
	"A2-baseline",
	"A2-sitemap",
	"A2-llms-curated",
	"A2-llms-giant",
	"A2-llms-hier",
	"A2-hinted",
];

const records: CellRecord2[] = [];
for (const model of MODELS) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const path = `results/raw/study2-${slug}.jsonl`;
	if (!existsSync(path)) continue;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		if (line.trim() !== "") records.push(JSON.parse(line) as CellRecord2);
	}
}
const short = (m: string) => m.split("/")[1] as string;
const rows = (m: string, arm: string, cls?: string) =>
	records.filter(
		(r) => r.model === m && r.arm === arm && (!cls || r.cls === cls),
	);
const active = MODELS.filter((m) => rows(m, "A2-baseline").length > 0);

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
	for (const arm of ALL_ARMS) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const by = (cls: string) => {
			const g = rs.filter((r) => r.cls === cls);
			return `${g.filter((r) => r.correct).length}/${g.length}`;
		};
		const disc = rs.filter((r) => r.consultedDiscovery).length;
		const noSubmit = rs.filter((r) => r.outcome === "no-submit").length;
		const meanIn = Math.round(
			rs.reduce((s, r) => s + r.tokensIn, 0) / rs.length,
		);
		const meanF =
			Math.round((rs.reduce((s, r) => s + r.fetches, 0) / rs.length) * 10) / 10;
		console.log(
			`${arm}: orphan ${by("orphan")}, deep ${by("deep")}, shallow ${by("shallow")}, absent ${by("absent")} | discovery ${disc}/32 | no-submit ${noSubmit} | in-tok ${meanIn}, fetches ${meanF}, guesses ${rs.reduce((s, r) => s + r.pathGuesses, 0)}`,
		);
	}
}

console.log("\n=== S2-H1 (orphan class, paired vs baseline, pooled) ===");
let h1 = false;
for (const arm of DISCOVERY_ARMS) {
	let aidOnly = 0;
	let baseOnly = 0;
	for (const model of active) {
		const base = new Map(
			rows(model, "A2-baseline", "orphan").map((r) => [r.taskId, r]),
		);
		for (const r of rows(model, arm, "orphan")) {
			const b = base.get(r.taskId);
			if (!b) continue;
			if (r.correct && !b.correct) aidOnly += 1;
			else if (!r.correct && b.correct) baseOnly += 1;
		}
	}
	const n = aidOnly + baseOnly;
	const p = n > 0 ? exactBinomialP(baseOnly, n) : 1;
	const sig = n > 0 && p < 0.05 && aidOnly > baseOnly;
	if (sig) h1 = true;
	console.log(
		`${arm}: aid-only ${aidOnly}, baseline-only ${baseOnly}, p=${p.toFixed(5)}${sig ? " *" : ""}`,
	);
}

console.log(
	"\n=== S2-H2 (unprompted discovery consultation, non-hinted arms) ===",
);
for (const model of active) {
	const nonHinted = records.filter(
		(r) =>
			r.model === model && r.arm !== "A2-baseline" && r.arm !== "A2-hinted",
	);
	const disc = nonHinted.filter((r) => r.consultedDiscovery).length;
	const hinted = rows(model, "A2-hinted");
	const hintedDisc = hinted.filter((r) => r.consultedDiscovery).length;
	console.log(
		`${short(model)}: unprompted ${disc}/${nonHinted.length} | hinted ${hintedDisc}/${hinted.length}`,
	);
}

console.log("\n=== S2-H3 (grep-loop economics among consulting cells) ===");
for (const model of active) {
	const stats = (arm: string) => {
		const consulting = rows(model, arm).filter((r) => r.consultedDiscovery);
		if (consulting.length === 0) return null;
		return {
			n: consulting.length,
			in: Math.round(
				consulting.reduce((s, r) => s + r.tokensIn, 0) / consulting.length,
			),
		};
	};
	const cur = stats("A2-llms-curated");
	const gia = stats("A2-llms-giant");
	const hier = stats("A2-llms-hier");
	console.log(
		`${short(model)}: curated ${cur ? `${cur.in} (n=${cur.n})` : "n/a"} | giant ${gia ? `${gia.in} (n=${gia.n})` : "n/a"} | hier ${hier ? `${hier.in} (n=${hier.n})` : "n/a"}`,
	);
}

console.log("\n=== S2-H4 (comparative no-harm, linked classes + absent) ===");
let h4 = true;
for (const model of active) {
	const linked = (arm: string) =>
		rows(model, arm).filter(
			(r) => (r.cls === "shallow" || r.cls === "deep") && r.correct,
		).length;
	const falseAns = (arm: string) =>
		rows(model, arm, "absent").filter(
			(r) => r.outcome === "answered" && !r.correct,
		).length;
	const bl = linked("A2-baseline");
	const bf = falseAns("A2-baseline");
	for (const arm of ALL_ARMS.slice(1)) {
		if (rows(model, arm).length === 0) continue;
		if (!(linked(arm) >= bl - 2 && falseAns(arm) <= bf + 2)) {
			h4 = false;
			console.log(
				`${short(model)} ${arm}: HARM (linked ${linked(arm)} vs ${bl}, false-answers ${falseAns(arm)} vs ${bf})`,
			);
		}
	}
}
if (h4) console.log("comparative no-harm holds everywhere");

console.log("\n=== Gates ===");
console.log(
	`S2-H1 (a discovery arm moves the orphan class): ${h1 ? "PASS" : "FAIL"}`,
);
console.log(`S2-H4 (comparative no-harm): ${h4 ? "PASS" : "FAIL"}`);
console.log(`STUDY GATE: ${h1 && h4 ? "PASS" : "FAIL"}`);
