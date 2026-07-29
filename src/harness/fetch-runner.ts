/**
 * The agent loop (BRIEF.md): question + root URL + a fetch tool with
 * ≤ 12 calls, responses truncated at 24k chars with a registered
 * notice. The tool description never mentions markdown or Accept —
 * whether a model sends a markdown signal unprompted is an OUTCOME.
 */
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import type { Matcher } from "../grading/answers.js";
import { grade, SENTINEL } from "../grading/answers.js";
import type { RunningSite } from "../site/server.js";

export const MAX_FETCHES = 12;
export const TRUNCATE_AT = 24_000;
const TRUNCATION_NOTICE =
	"\n\n[response truncated at 24000 characters by the fetch tool]";

/** Registered system prompt — neutral: no technique is named. */
export const SYSTEM = `You are a research assistant answering questions using a specific website. You have a fetch tool for retrieving pages from that site. Answer ONLY from what the site actually states. If the site does not state the answer, reply with exactly ${SENTINEL}. End your reply with a single line: ANSWER: <your answer>.`;

export interface AeoTask {
	id: string;
	cls: "shallow" | "deep" | "cross" | "absent";
	question: string;
	matcher: Matcher;
}

export interface FetchLogEntry {
	url: string;
	accept: string | null;
	status: number;
	contentType: string;
	bytes: number;
}

export interface CellRecord {
	taskId: string;
	cls: string;
	arm: string;
	model: string;
	correct: boolean;
	saidSentinel: boolean;
	answer: string;
	fetches: number;
	repeatFetches: number;
	sentMarkdownSignal: boolean;
	consultedLlmsTxt: boolean;
	consultedSitemap: boolean;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
	fetchLog: FetchLogEntry[];
}

export async function runCell(
	task: AeoTask,
	site: RunningSite,
	model: string,
): Promise<CellRecord> {
	const fetchLog: FetchLogEntry[] = [];
	const seen = new Set<string>();
	let repeats = 0;

	const tools = {
		fetch: tool({
			description:
				'Fetch a page from the website by absolute path (e.g. "/" or "/products"). Optional headers may be supplied as a plain object. Returns the response body as text.',
			// Cast: the ai SDK's tool overloads reject ZodRecord under
			// exactOptionalPropertyTypes; execute's params are typed explicitly
			// below, and runtime validation still runs the real schema.
			inputSchema: z.object({
				path: z.string(),
				headers: z.record(z.string()).optional(),
			}) as never,
			execute: async ({
				path,
				headers,
			}: {
				path: string;
				headers?: Record<string, string>;
			}) => {
				if (fetchLog.length >= MAX_FETCHES) {
					return "[fetch limit reached — answer from what you have]";
				}
				const url = path.startsWith("/") ? path : `/${path}`;
				const res = await fetch(site.origin + url, {
					headers: headers ?? {},
					redirect: "follow",
				});
				const body = await res.text();
				const key = `${url}|${headers?.accept ?? headers?.Accept ?? ""}`;
				if (seen.has(key)) repeats += 1;
				seen.add(key);
				fetchLog.push({
					url,
					accept: headers?.accept ?? headers?.Accept ?? null,
					status: res.status,
					contentType: res.headers.get("content-type") ?? "",
					bytes: body.length,
				});
				return body.length > TRUNCATE_AT
					? body.slice(0, TRUNCATE_AT) + TRUNCATION_NOTICE
					: body;
			},
		}),
	};

	const started = performance.now();
	const result = await generateText({
		model,
		system: SYSTEM,
		messages: [
			{
				role: "user",
				content: `Website root: /\n\nQuestion: ${task.question}`,
			},
		],
		temperature: 0,
		maxRetries: 4,
		maxOutputTokens: 4000,
		stopWhen: stepCountIs(MAX_FETCHES + 2),
		tools,
	} as Parameters<typeof generateText>[0]);

	const answerLine =
		result.text.match(/ANSWER:\s*([\s\S]*)$/)?.[1]?.trim() ?? result.text;
	const sentMarkdownSignal = fetchLog.some(
		(f) => (f.accept ?? "").includes("text/markdown") || f.url.endsWith(".md"),
	);
	return {
		taskId: task.id,
		cls: task.cls,
		arm: site.arm,
		model,
		correct: grade(answerLine, task.matcher),
		saidSentinel: answerLine.toLowerCase().includes(SENTINEL.toLowerCase()),
		answer: answerLine.slice(0, 500),
		fetches: fetchLog.length,
		repeatFetches: repeats,
		sentMarkdownSignal,
		consultedLlmsTxt: fetchLog.some((f) => f.url === "/llms.txt"),
		consultedSitemap: fetchLog.some((f) => f.url === "/sitemap.xml"),
		tokensIn: result.totalUsage.inputTokens ?? 0,
		tokensOut: result.totalUsage.outputTokens ?? 0,
		latencyMs: Math.round(performance.now() - started),
		fetchLog,
	};
}
