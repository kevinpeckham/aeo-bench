/**
 * Study 1 scored runs (BRIEF.md). Default: the PILOT (gemini-3.5-flash
 * only). The full matrix requires --models with the go-ahead recorded
 * in the brief.
 *
 *   bunx varlock run -- bun run scripts/run-study1.ts [--models a,b] [--concurrency 4]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import tasksFile from "../corpus/tasks.json";
import type { AeoTask, CellRecord } from "../src/harness/fetch-runner.js";
import { runCell } from "../src/harness/fetch-runner.js";
import type { Arm } from "../src/site/generate.js";
import { startSite } from "../src/site/server.js";

const PILOT_MODELS = ["google/gemini-3.5-flash"];
const ARMS: Arm[] = [
	"A-baseline",
	"A-llmstxt",
	"A-sitemap",
	"A-markdown",
	"A-stacked",
];

function arg(name: string, fallback: string): string {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
const models = arg("models", PILOT_MODELS.join(",")).split(",");
const concurrency = Number(arg("concurrency", "4"));
const tasks = tasksFile.tasks as AeoTask[];

for (const model of models) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const outPath = `results/raw/study1-${slug}.jsonl`;
	mkdirSync(dirname(outPath), { recursive: true });
	const done = new Set<string>();
	if (existsSync(outPath)) {
		for (const line of readFileSync(outPath, "utf8").split("\n")) {
			if (line.trim() === "") continue;
			const r = JSON.parse(line) as CellRecord;
			done.add(`${r.taskId}|${r.arm}`);
		}
	}

	for (const arm of ARMS) {
		const site = startSite(arm);
		const queue = tasks.filter((t) => !done.has(`${t.id}|${arm}`));
		console.log(`\n=== ${model} × ${arm} (${queue.length} cells)`);
		let cursor = 0;
		let ok = 0;
		const worker = async (): Promise<void> => {
			while (cursor < queue.length) {
				const task = queue[cursor] as AeoTask;
				cursor += 1;
				try {
					const record = await runCell(task, site, model);
					appendFileSync(outPath, `${JSON.stringify(record)}\n`);
					if (record.correct) ok += 1;
					console.log(
						`  ${task.id}: ${record.correct ? "ok" : "MISS"} fetches=${record.fetches} md=${record.sentMarkdownSignal} tok=${record.tokensIn}+${record.tokensOut}`,
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
