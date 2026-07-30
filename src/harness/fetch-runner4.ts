/**
 * Study 4 agent loop (docs/BRIEF-STUDY4.md): the capability arms.
 * Constant site config across arms (the curated-index site — retrieval
 * aids are not the variable here); the capability surface and its
 * exposure vary per arm.
 */
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import type { Matcher } from "../grading/answers.js";
import { gradeV2 } from "../grading/answers.js";
import type { Arm4, RunningSite4 } from "../site/server4.js";
import type { AeoTask2, CellRecord2 } from "./fetch-runner2.js";
import { MAX_FETCHES_2, SYSTEM_2, TRUNCATE_AT_2 } from "./fetch-runner2.js";

const TRUNCATION_NOTICE =
	"\n\n[response truncated at 24000 characters by the fetch tool]";
const FETCH_DESCRIPTION =
	'Fetch a page from the website by absolute path (e.g. "/" or "/catalog"). Returns the response body as text.';
/** Registered affordance sentence (BRIEF-STUDY4), C-affordance only. */
export const CAPABILITY_HINT =
	"The site may describe machine-usable capabilities at /.well-known/mcp/server-card.json.";

export interface CellRecord4 extends CellRecord2 {
	apiUses: number;
	cardConsults: number;
	mountedToolCalls: number;
}

export interface AeoTask4 extends Omit<AeoTask2, "cls"> {
	cls: "capability" | "bothways" | "absent";
	matcher: Matcher;
}

export async function runCell4(
	task: AeoTask4,
	site: RunningSite4,
	model: string,
): Promise<CellRecord4> {
	const arm: Arm4 = site.arm;
	const fetchLog: { url: string; status: number; bytes: number }[] = [];
	const seen = new Set<string>();
	let repeats = 0;
	let truncations = 0;
	let apiUses = 0;
	let cardConsults = 0;
	let mountedToolCalls = 0;
	let submitted: { answer?: string; notOnSite?: boolean } | null = null;

	const fetchDescription =
		arm === "C-affordance"
			? `${FETCH_DESCRIPTION} ${CAPABILITY_HINT}`
			: FETCH_DESCRIPTION;

	const tools: Record<string, unknown> = {
		fetch: tool({
			description: fetchDescription,
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
				if (url.startsWith("/api/")) apiUses += 1;
				if (url.includes("server-card")) cardConsults += 1;
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
	if (arm === "C-mounted") {
		tools.order_status = tool({
			description:
				"Look up an order by number (format PP-YYYY-NNNN). Returns status, items, ship date, carrier, and tracking.",
			inputSchema: z.object({ number: z.string() }) as never,
			execute: async ({ number }: { number: string }) => {
				mountedToolCalls += 1;
				apiUses += 1;
				const res = await fetch(
					`${site.origin}/api/order-status?number=${encodeURIComponent(number)}`,
				);
				return await res.text();
			},
		});
		tools.product_lookup = tool({
			description:
				"Structured product data by slug. Returns name, price, SKU, weight, and category.",
			inputSchema: z.object({ slug: z.string() }) as never,
			execute: async ({ slug }: { slug: string }) => {
				mountedToolCalls += 1;
				apiUses += 1;
				const res = await fetch(
					`${site.origin}/api/products/${encodeURIComponent(slug)}`,
				);
				return await res.text();
			},
		});
	}

	const started = performance.now();
	const result = await generateText({
		model,
		system: SYSTEM_2,
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
		} else if (task.matcher.type === "orderNotFound") {
			correct =
				sub.notOnSite === true ||
				(typeof sub.answer === "string" && gradeV2(sub.answer, task.matcher));
		} else {
			correct =
				sub.notOnSite !== true &&
				typeof sub.answer === "string" &&
				gradeV2(sub.answer, task.matcher);
		}
	}
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
		consultedDiscovery: cardConsults > 0,
		discoveryPaths: fetchLog
			.map((f) => f.url)
			.filter((u) => u.includes("server-card") || u.endsWith("llms.txt")),
		pathGuesses: fetchLog.filter((f) => f.status === 404).length,
		tokensIn: result.totalUsage.inputTokens ?? 0,
		tokensOut: result.totalUsage.outputTokens ?? 0,
		latencyMs: Math.round(performance.now() - started),
		fetchLog,
		apiUses,
		cardConsults,
		mountedToolCalls,
	};
}
