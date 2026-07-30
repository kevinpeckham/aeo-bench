/**
 * Study 3 agent loop (docs/BRIEF-STUDY3.md): the affordance designs.
 * Wraps the Study 2 protocol (fetch cap 25 + submit_answer) with three
 * fresh arms: prefetch (index injected into system context),
 * prefetch-giant (the everything-index), and an index tool.
 */
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { gradeV2 } from "../grading/answers.js";
import type { RunningSite2 } from "../site/server2.js";
import type { AeoTask2, CellRecord2 } from "./fetch-runner2.js";
import { MAX_FETCHES_2, SYSTEM_2, TRUNCATE_AT_2 } from "./fetch-runner2.js";

export type Arm3 = "A3-prefetch" | "A3-prefetch-giant" | "A3-tool";

/** Registered prefetch header (BRIEF-STUDY3): no behavioral instruction. */
export const PREFETCH_HEADER = "Site index (served by the site at /llms.txt):";
export const INDEX_TOOL_DESCRIPTION =
	"Returns the site's machine-readable index of pages.";

const TRUNCATION_NOTICE =
	"\n\n[response truncated at 24000 characters by the fetch tool]";
const FETCH_DESCRIPTION =
	'Fetch a page from the website by absolute path (e.g. "/" or "/catalog"). Returns the response body as text.';

export async function runCell3(
	task: AeoTask2,
	site: RunningSite2,
	model: string,
	arm: Arm3,
): Promise<CellRecord2> {
	const fetchLog: { url: string; status: number; bytes: number }[] = [];
	const seen = new Set<string>();
	let repeats = 0;
	let truncations = 0;
	let indexToolCalls = 0;
	let submitted: { answer?: string; notOnSite?: boolean } | null = null;

	// The index text comes from the site itself (curated or giant per the
	// server config the runner started).
	const indexRes = await fetch(`${site.origin}/llms.txt`);
	if (!indexRes.ok) throw new Error("fixture must serve /llms.txt for Study 3");
	const indexText = await indexRes.text();

	const isPrefetch = arm === "A3-prefetch" || arm === "A3-prefetch-giant";
	const system = isPrefetch
		? `${SYSTEM_2}\n\n${PREFETCH_HEADER}\n${indexText}`
		: SYSTEM_2;

	const tools: Record<string, unknown> = {
		fetch: tool({
			description: FETCH_DESCRIPTION,
			inputSchema: z.object({ path: z.string() }) as never,
			execute: async ({ path }: { path: string }) => {
				if (submitted) return "[answer already submitted]";
				if (fetchLog.length >= MAX_FETCHES_2) {
					return "[fetch limit reached — submit your answer]";
				}
				const url = path.startsWith("/") ? path : `/${path}`;
				const res = await fetch(site.origin + url);
				const body = await res.text();
				if (seen.has(url)) repeats += 1;
				seen.add(url);
				fetchLog.push({ url, status: res.status, bytes: body.length });
				if (body.length > TRUNCATE_AT_2) {
					truncations += 1;
					return body.slice(0, TRUNCATE_AT_2) + TRUNCATION_NOTICE;
				}
				return body;
			},
		}),
		submit_answer: tool({
			description:
				"Submit your final answer. Provide `answer` with the answer text, or set `notOnSite` to true if the site does not state the answer. This ends the task.",
			inputSchema: z.object({
				answer: z.string().optional(),
				notOnSite: z.boolean().optional(),
			}) as never,
			execute: async (input: { answer?: string; notOnSite?: boolean }) => {
				if (!submitted) submitted = input;
				return "Answer recorded. You may stop.";
			},
		}),
	};
	if (arm === "A3-tool") {
		tools.read_site_index = tool({
			description: INDEX_TOOL_DESCRIPTION,
			inputSchema: z.object({}) as never,
			execute: async () => {
				indexToolCalls += 1;
				return indexText;
			},
		});
	}

	const started = performance.now();
	const result = await generateText({
		model,
		system,
		messages: [
			{
				role: "user",
				content: `Website root: /\n\nQuestion: ${task.question}`,
			},
		],
		temperature: 0,
		maxRetries: 4,
		maxOutputTokens: 4000,
		stopWhen: stepCountIs(MAX_FETCHES_2 + 4),
		tools,
	} as Parameters<typeof generateText>[0]);

	const sub = submitted as { answer?: string; notOnSite?: boolean } | null;
	const outcome: CellRecord2["outcome"] = sub
		? sub.notOnSite === true
			? "not-on-site"
			: "answered"
		: "no-submit";
	let correct = false;
	if (sub) {
		if (task.matcher.type === "sentinel") {
			correct = sub.notOnSite === true;
		} else {
			correct =
				sub.notOnSite !== true &&
				typeof sub.answer === "string" &&
				gradeV2(sub.answer, task.matcher);
		}
	}
	const discoveryPaths = fetchLog
		.map((f) => f.url)
		.filter((u) => u.endsWith("llms.txt") || u === "/sitemap.xml");
	return {
		taskId: task.id,
		cls: task.cls,
		arm,
		model,
		correct,
		outcome,
		answer: (sub?.answer ?? "").slice(0, 500),
		fetches: fetchLog.length,
		repeatFetches: repeats,
		truncations,
		consultedDiscovery: discoveryPaths.length > 0 || indexToolCalls > 0,
		discoveryPaths:
			indexToolCalls > 0
				? [...discoveryPaths, `[read_site_index x${indexToolCalls}]`]
				: discoveryPaths,
		pathGuesses: fetchLog.filter((f) => f.status === 404).length,
		tokensIn: result.totalUsage.inputTokens ?? 0,
		tokensOut: result.totalUsage.outputTokens ?? 0,
		latencyMs: Math.round(performance.now() - started),
		fetchLog,
	};
}
