/**
 * Study 3 scored runs (docs/BRIEF-STUDY3.md): the three fresh
 * affordance arms. Control and hint arms are REUSED from frozen
 * Study 2 records (see the brief); this runner never re-runs them.
 *
 *   bunx varlock run -- bun run scripts/run-study3.ts [--models a,b] [--concurrency 4]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import tasksFile from "../corpus/tasks2.json";
import type { AeoTask2, CellRecord2 } from "../src/harness/fetch-runner2.js";
import type { Arm3 } from "../src/harness/fetch-runner3.js";
import { runCell3 } from "../src/harness/fetch-runner3.js";
import { startSite2 } from "../src/site/server2.js";

const DEFAULT_MODELS = [
	"anthropic/claude-haiku-4.5",
	"anthropic/claude-opus-4.8",
	"google/gemini-3.5-flash",
];
const ARMS: Arm3[] = ["A3-prefetch", "A3-prefetch-giant", "A3-tool"];

function arg(name: string, fallback: string): string {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
const models = arg("models", DEFAULT_MODELS.join(",")).split(",");
const concurrency = Number(arg("concurrency", "4"));
const tasks = tasksFile.tasks as AeoTask2[];

for (const model of models) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const outPath = `results/raw/study3-${slug}.jsonl`;
	mkdirSync(dirname(outPath), { recursive: true });
	const done = new Set<string>();
	if (existsSync(outPath)) {
		for (const line of readFileSync(outPath, "utf8").split("\n")) {
			if (line.trim() === "") continue;
			const r = JSON.parse(line) as CellRecord2;
			done.add(`${r.taskId}|${r.arm}`);
		}
	}
	for (const arm of ARMS) {
		// Site config per the brief: giant index for prefetch-giant,
		// curated for everything else.
		const site = startSite2(
			arm === "A3-prefetch-giant" ? "A2-llms-giant" : "A2-llms-curated",
		);
		const queue = tasks.filter((t) => !done.has(`${t.id}|${arm}`));
		console.log(`\n=== ${model} × ${arm} (${queue.length} cells)`);
		let cursor = 0;
		let ok = 0;
		const worker = async (): Promise<void> => {
			while (cursor < queue.length) {
				const task = queue[cursor] as AeoTask2;
				cursor += 1;
				try {
					const record = await runCell3(task, site, model, arm);
					appendFileSync(outPath, `${JSON.stringify(record)}\n`);
					if (record.correct) ok += 1;
					console.log(
						`  ${task.id}: ${record.correct ? "ok" : "MISS"} [${record.outcome}] fetches=${record.fetches}`,
					);
				} catch (error) {
					console.log(
						`  ${task.id}: ERROR ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}
		};
		await Promise.all(Array.from({ length: concurrency }, () => worker()));
		site.stop();
		console.log(`=== ${model} × ${arm}: ${ok} correct`);
	}
}
