/**
 * Study 2 agent loop (docs/BRIEF-STUDY2.md): fetch (cap 25) plus the
 * structured submit_answer channel. The fetch description never
 * mentions any technique; the A2-hinted arm appends ONE registered
 * sentence naming machine-readable indexes.
 */
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import type { Matcher } from "../grading/answers.js";
import { gradeV2 } from "../grading/answers.js";
import type { RunningSite2 } from "../site/server2.js";

export const MAX_FETCHES_2 = 25;
export const TRUNCATE_AT_2 = 24_000;
const TRUNCATION_NOTICE =
	"\n\n[response truncated at 24000 characters by the fetch tool]";

const FETCH_DESCRIPTION =
	'Fetch a page from the website by absolute path (e.g. "/" or "/catalog"). Returns the response body as text.';
/** Registered affordance sentence, A2-hinted only (BRIEF-STUDY2). */
export const HINT_SENTENCE =
	"The site may also provide machine-readable indexes at paths like /llms.txt or /sitemap.xml.";

export const SYSTEM_2 = `You are a research assistant answering questions using a specific website. Use the fetch tool to read pages. Answer ONLY from what the site actually states. When you have the answer, call submit_answer with it. If the site does not state the answer, call submit_answer with notOnSite set to true. Always finish by calling submit_answer.`;

export interface AeoTask2 {
	id: string;
	cls: "orphan" | "deep" | "shallow" | "absent";
	question: string;
	matcher: Matcher;
}

export interface CellRecord2 {
	taskId: string;
	cls: string;
	arm: string;
	model: string;
	correct: boolean;
	outcome: "answered" | "not-on-site" | "no-submit";
	answer: string;
	fetches: number;
	repeatFetches: number;
	truncations: number;
	consultedDiscovery: boolean;
	discoveryPaths: string[];
	pathGuesses: number;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
	fetchLog: { url: string; status: number; bytes: number }[];
}

export async function runCell2(
	task: AeoTask2,
	site: RunningSite2,
	model: string,
): Promise<CellRecord2> {
	const fetchLog: { url: string; status: number; bytes: number }[] = [];
	const seen = new Set<string>();
	let repeats = 0;
	let truncations = 0;
	let submitted: { answer?: string; notOnSite?: boolean } | null = null;

	const fetchDescription =
		site.arm === "A2-hinted"
			? `${FETCH_DESCRIPTION} ${HINT_SENTENCE}`
			: FETCH_DESCRIPTION;

	const tools = {
		fetch: tool({
			description: fetchDescription,
			// Cast per the Study 1 note: execute params typed explicitly.
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
		} else {
			correct =
				sub.notOnSite !== true &&
				typeof sub.answer === "string" &&
				gradeV2(sub.answer, task.matcher);
		}
	}
	// Path anatomy: a discovery consult is any llms.txt/sitemap fetch; a
	// path guess is a 404 on a path never seen in any fetched content —
	// approximated mechanically as any 404 fetch.
	const discoveryPaths = fetchLog
		.map((f) => f.url)
		.filter((u) => u.endsWith("llms.txt") || u === "/sitemap.xml");
	return {
		taskId: task.id,
		cls: task.cls,
		arm: site.arm,
		model,
		correct,
		outcome,
		answer: (sub?.answer ?? "").slice(0, 500),
		fetches: fetchLog.length,
		repeatFetches: repeats,
		truncations,
		consultedDiscovery: discoveryPaths.length > 0,
		discoveryPaths,
		pathGuesses: fetchLog.filter((f) => f.status === 404).length,
		tokensIn: result.totalUsage.inputTokens ?? 0,
		tokensOut: result.totalUsage.outputTokens ?? 0,
		latencyMs: Math.round(performance.now() - started),
		fetchLog,
	};
}
