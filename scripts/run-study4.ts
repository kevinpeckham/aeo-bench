/**
 * Study 4 scored runs (docs/BRIEF-STUDY4.md). Default: the PILOT
 * (gemini-3.5-flash). Matrix (+haiku, +opus) on go-ahead.
 *
 *   bunx varlock run -- bun run scripts/run-study4.ts [--models a,b] [--concurrency 4]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import tasksFile from "../corpus/tasks4.json";
import type { AeoTask4, CellRecord4 } from "../src/harness/fetch-runner4.js";
import { runCell4 } from "../src/harness/fetch-runner4.js";
import type { Arm4 } from "../src/site/server4.js";
import { startSite4 } from "../src/site/server4.js";

const PILOT_MODELS = ["google/gemini-3.5-flash"];
const ARMS: Arm4[] = ["C-control", "C-card", "C-affordance", "C-mounted"];

function arg(name: string, fallback: string): string {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
const models = arg("models", PILOT_MODELS.join(",")).split(",");
const concurrency = Number(arg("concurrency", "4"));
const tasks = tasksFile.tasks as AeoTask4[];

for (const model of models) {
	const slug = model.replace(/[^a-z0-9.-]+/gi, "_");
	const outPath = `results/raw/study4-${slug}.jsonl`;
	mkdirSync(dirname(outPath), { recursive: true });
	const done = new Set<string>();
	if (existsSync(outPath)) {
		for (const line of readFileSync(outPath, "utf8").split("\n")) {
			if (line.trim() === "") continue;
			const r = JSON.parse(line) as CellRecord4;
			done.add(`${r.taskId}|${r.arm}`);
		}
	}
	for (const arm of ARMS) {
		const site = startSite4(arm);
		const queue = tasks.filter((t) => !done.has(`${t.id}|${arm}`));
		console.log(`\n=== ${model} × ${arm} (${queue.length} cells)`);
		let cursor = 0;
		let ok = 0;
		const worker = async (): Promise<void> => {
			while (cursor < queue.length) {
				const task = queue[cursor] as AeoTask4;
				cursor += 1;
				try {
					const record = await runCell4(task, site, model);
					appendFileSync(outPath, `${JSON.stringify(record)}\n`);
					if (record.correct) ok += 1;
					console.log(
						`  ${task.id}: ${record.correct ? "ok" : "MISS"} [${record.outcome}] api=${record.apiUses} card=${record.cardConsults}`,
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
