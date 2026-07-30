/**
 * Study 3 analysis (docs/BRIEF-STUDY3.md): candidate readiness, the
 * carrier prediction, the size read, comparative no-harm, and the
 * harness economics table. Control/hint arms read from frozen Study 2
 * records per the registered reuse.
 *
 *   bun run scripts/analyze-study3.ts
 */
import { existsSync, readFileSync } from "node:fs";
import type { CellRecord2 } from "../src/harness/fetch-runner2.js";

const MODELS = [
	"anthropic/claude-haiku-4.5",
	"anthropic/claude-opus-4.8",
	"google/gemini-3.5-flash",
];
const HAIKU = "anthropic/claude-haiku-4.5";
const FRESH = ["A3-prefetch", "A3-prefetch-giant", "A3-tool"];
const ALL = ["A3-control", "A3-hint", ...FRESH];

const records: CellRecord2[] = [];
for (const model of MODELS) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const p3 = `results/raw/study3-${slug}.jsonl`;
	if (existsSync(p3)) {
		for (const line of readFileSync(p3, "utf8").split("\n")) {
			if (line.trim() !== "") records.push(JSON.parse(line) as CellRecord2);
		}
	}
	// Registered reuse: Study 2 frozen records as control/hint.
	const p2 = `results/raw/study2-${slug}.jsonl`;
	if (existsSync(p2)) {
		for (const line of readFileSync(p2, "utf8").split("\n")) {
			if (line.trim() === "") continue;
			const r = JSON.parse(line) as CellRecord2;
			if (r.arm === "A2-llms-curated")
				records.push({ ...r, arm: "A3-control" });
			else if (r.arm === "A2-hinted") records.push({ ...r, arm: "A3-hint" });
		}
	}
}
const short = (m: string) => m.split("/")[1] as string;
const rows = (m: string, arm: string, cls?: string) =>
	records.filter(
		(r) => r.model === m && r.arm === arm && (!cls || r.cls === cls),
	);
const ok = (rs: CellRecord2[]) => rs.filter((r) => r.correct).length;

for (const model of MODELS) {
	if (rows(model, "A3-control").length === 0) continue;
	console.log(`--- ${short(model)} ---`);
	for (const arm of ALL) {
		const rs = rows(model, arm);
		if (rs.length === 0) continue;
		const by = (cls: string) => {
			const g = rs.filter((r) => r.cls === cls);
			return `${ok(g)}/${g.length}`;
		};
		const meanIn = Math.round(
			rs.reduce((s, r) => s + r.tokensIn, 0) / rs.length,
		);
		const meanF =
			Math.round((rs.reduce((s, r) => s + r.fetches, 0) / rs.length) * 10) / 10;
		const solved = ok(rs);
		const perSolved = solved
			? Math.round(rs.reduce((s, r) => s + r.tokensIn, 0) / solved)
			: 0;
		console.log(
			`${arm}: orphan ${by("orphan")}, deep ${by("deep")}, shallow ${by("shallow")}, absent ${by("absent")} | no-submit ${rs.filter((r) => r.outcome === "no-submit").length} | fetches ${meanF}, in-tok ${meanIn}, in-tok/solved ${perSolved}`,
		);
	}
}

// S3-H1: Haiku candidate readiness under prefetch.
const hOrphan = ok(rows(HAIKU, "A3-prefetch", "orphan"));
const hLinkedP =
	ok(rows(HAIKU, "A3-prefetch", "deep")) +
	ok(rows(HAIKU, "A3-prefetch", "shallow"));
const hLinkedC =
	ok(rows(HAIKU, "A3-control", "deep")) +
	ok(rows(HAIKU, "A3-control", "shallow"));
const hAbsent = ok(rows(HAIKU, "A3-prefetch", "absent"));
const hNoSubmit = rows(HAIKU, "A3-prefetch").filter(
	(r) => r.outcome === "no-submit",
).length;
const h1 =
	hOrphan >= 9 && hLinkedP >= hLinkedC && hAbsent >= 6 && hNoSubmit === 0;

// S3-H2: pooled paired prefetch vs hint on orphans + fetch economy.
let wins = 0;
let losses = 0;
for (const model of MODELS) {
	const hint = new Map(
		rows(model, "A3-hint", "orphan").map((r) => [r.taskId, r]),
	);
	for (const r of rows(model, "A3-prefetch", "orphan")) {
		const h = hint.get(r.taskId);
		if (!h) continue;
		if (r.correct && !h.correct) wins += 1;
		else if (!r.correct && h.correct) losses += 1;
	}
}
const meanFetches = (arm: string) => {
	const rs = MODELS.flatMap((m) => rows(m, arm));
	return rs.reduce((s, r) => s + r.fetches, 0) / Math.max(rs.length, 1);
};
const h2 =
	wins - losses >= -2 && meanFetches("A3-prefetch") < meanFetches("A3-hint");

// S3-H3: size read.
const pooled = (arm: string, cls: string[]) =>
	ok(MODELS.flatMap((m) => cls.flatMap((c) => rows(m, arm, c))));
const giantOrphanDelta =
	pooled("A3-prefetch", ["orphan"]) - pooled("A3-prefetch-giant", ["orphan"]);
const giantLinkedDelta =
	pooled("A3-prefetch", ["deep", "shallow"]) -
	pooled("A3-prefetch-giant", ["deep", "shallow"]);
const meanIn = (arm: string) => {
	const rs = MODELS.flatMap((m) => rows(m, arm));
	return rs.reduce((s, r) => s + r.tokensIn, 0) / Math.max(rs.length, 1);
};
const sizeRatio =
	meanIn("A3-prefetch-giant") / Math.max(meanIn("A3-prefetch"), 1);

// S3-H4: comparative no-harm vs control.
let h4 = true;
for (const model of MODELS) {
	const linked = (arm: string) =>
		ok(rows(model, arm, "deep")) + ok(rows(model, arm, "shallow"));
	const falseAns = (arm: string) =>
		rows(model, arm, "absent").filter(
			(r) => r.outcome === "answered" && !r.correct,
		).length;
	const bl = linked("A3-control");
	const bf = falseAns("A3-control");
	for (const arm of FRESH) {
		if (rows(model, arm).length === 0) continue;
		if (!(linked(arm) >= bl - 2 && falseAns(arm) <= bf + 2)) {
			h4 = false;
			console.log(
				`${short(model)} ${arm}: HARM (linked ${linked(arm)} vs ${bl}, false-answers ${falseAns(arm)} vs ${bf})`,
			);
		}
	}
}

console.log("\n=== Gates ===");
console.log(
	`S3-H1 (Haiku readiness under prefetch): ${h1 ? "PASS" : "FAIL"} (orphan ${hOrphan}/10, linked ${hLinkedP} vs ${hLinkedC}, absent ${hAbsent}/8, no-submit ${hNoSubmit})`,
);
console.log(
	`S3-H2 (carrier non-inferior + cheaper fetches): ${h2 ? "PASS" : "FAIL"} (wins ${wins}, losses ${losses}; fetches prefetch ${meanFetches("A3-prefetch").toFixed(1)} vs hint ${meanFetches("A3-hint").toFixed(1)})`,
);
console.log(
	`S3-H3 (size read): orphan delta ${giantOrphanDelta}, linked delta ${giantLinkedDelta}, input ratio giant/curated ${sizeRatio.toFixed(2)}`,
);
console.log(`S3-H4 (comparative no-harm): ${h4 ? "PASS" : "FAIL"}`);
console.log(`STUDY GATE: ${h1 && h2 && h4 ? "PASS" : "FAIL"}`);
