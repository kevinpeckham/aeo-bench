/**
 * Study 2 scored runs (docs/BRIEF-STUDY2.md). Default: the PILOT
 * (gemini-3.5-flash). Full matrix requires --models with the
 * go-ahead recorded in the brief.
 *
 *   bunx varlock run -- bun run scripts/run-study2.ts [--models a,b] [--concurrency 4]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import tasksFile from "../corpus/tasks2.json";
import type { AeoTask2, CellRecord2 } from "../src/harness/fetch-runner2.js";
import { runCell2 } from "../src/harness/fetch-runner2.js";
import type { Arm2 } from "../src/site/generate2.js";
import { startSite2 } from "../src/site/server2.js";

const PILOT_MODELS = ["google/gemini-3.5-flash"];
const ARMS: Arm2[] = [
	"A2-baseline",
	"A2-sitemap",
	"A2-llms-curated",
	"A2-llms-giant",
	"A2-llms-hier",
	"A2-hinted",
];

function arg(name: string, fallback: string): string {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
const models = arg("models", PILOT_MODELS.join(",")).split(",");
const concurrency = Number(arg("concurrency", "4"));
const tasks = tasksFile.tasks as AeoTask2[];

for (const model of models) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const outPath = `results/raw/study2-${slug}.jsonl`;
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
		const site = startSite2(arm);
		const queue = tasks.filter((t) => !done.has(`${t.id}|${arm}`));
		console.log(`\n=== ${model} × ${arm} (${queue.length} cells)`);
		let cursor = 0;
		let ok = 0;
		const worker = async (): Promise<void> => {
			while (cursor < queue.length) {
				const task = queue[cursor] as AeoTask2;
				cursor += 1;
				try {
					const record = await runCell2(task, site, model);
					appendFileSync(outPath, `${JSON.stringify(record)}\n`);
					if (record.correct) ok += 1;
					console.log(
						`  ${task.id}: ${record.correct ? "ok" : "MISS"} [${record.outcome}] fetches=${record.fetches} disc=${record.consultedDiscovery}`,
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
