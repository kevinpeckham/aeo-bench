/**
 * Fixture validation (BRIEF.md): a fixture that drifts under the tasks
 * measures nothing. Pins determinism, arm semantics, task
 * answerability, and the NEVER-STATE list.
 */
import { describe, expect, test } from "bun:test";
import facts from "../corpus/facts.json";
import tasks from "../corpus/tasks.json";
import type { Arm } from "../src/site/generate.js";
import {
	buildSite,
	HIDDEN_DIRECTIVE,
	llmsTxt,
	rawPages,
	sitemapXml,
} from "../src/site/generate.js";
import { startSite } from "../src/site/server.js";

const ARMS: Arm[] = [
	"A-baseline",
	"A-llmstxt",
	"A-sitemap",
	"A-markdown",
	"A-stacked",
];

function allText(arm: Arm): string {
	const pages = [...buildSite(arm).values()];
	return pages.map((p) => `${p.html}\n${p.md}`).join("\n");
}

describe("generator", () => {
	test("deterministic: two builds are byte-identical", () => {
		const a = [...buildSite("A-stacked").values()].map((p) => p.html).join("");
		const b = [...buildSite("A-stacked").values()].map((p) => p.html).join("");
		expect(a).toBe(b);
	});
	test("≈40 pages exist and every product has a page", () => {
		const pages = buildSite("A-baseline");
		expect(pages.size).toBeGreaterThanOrEqual(35);
		for (const prod of facts.products) {
			expect(pages.has(`/products/${prod.slug}`)).toBe(true);
		}
	});
	test("hidden directive present only in markdown-capable arms", () => {
		expect(allText("A-markdown")).toContain("Accept: text/markdown");
		expect(allText("A-stacked")).toContain("Accept: text/markdown");
		expect(allText("A-baseline")).not.toContain(HIDDEN_DIRECTIVE);
		expect(allText("A-llmstxt")).not.toContain(HIDDEN_DIRECTIVE);
	});
	test("llms.txt lists every documentation page; sitemap lists every path", () => {
		const llms = llmsTxt();
		for (const path of [
			"/policies/returns",
			"/docs/warranty",
			"/docs/wholesale-api/limits",
			"/changelog",
		]) {
			expect(llms).toContain(path);
		}
		const sm = sitemapXml();
		for (const rp of rawPages()) {
			expect(sm).toContain(`https://petrelandpine.example${rp.path}</loc>`);
		}
	});
	test("NEVER-STATE list: absent-class topics appear nowhere in any arm", () => {
		const banned = [
			"ceo",
			"founder",
			"price match",
			"price-match",
			"student discount",
			"military discount",
			"retail store",
			"gift wrap",
			"carbon neutral",
			"carbon-neutral",
			"offset",
			"live chat",
			"loyalty",
			"black friday",
		];
		for (const arm of ARMS) {
			const text = allText(arm).toLowerCase();
			for (const term of banned) {
				expect(text.includes(term), `"${term}" leaked into ${arm}`).toBe(false);
			}
		}
	});
	test("present-class task facts exist in the site text; sentinel expectations hold", () => {
		const text = allText("A-baseline").toLowerCase();
		const spot = [
			"$389",
			"45 days",
			"pp-ac-880",
			"x-pp-wholesale-key",
			"120 per minute",
			"15 business days",
			"red-light lock",
			"cork",
		];
		for (const needle of spot) {
			expect(text.includes(needle), `missing fact: ${needle}`).toBe(true);
		}
		expect(tasks.tasks.filter((t) => t.cls === "absent").length).toBe(8);
	});
});

describe("server arm semantics", () => {
	test("baseline 404s all aids; each arm serves exactly its own", async () => {
		for (const arm of ARMS) {
			const site = startSite(arm);
			try {
				const status = async (path: string, headers?: Record<string, string>) =>
					(await fetch(site.origin + path, { headers })).status;
				const hasLlms = arm === "A-llmstxt" || arm === "A-stacked";
				const hasSitemap = arm === "A-sitemap" || arm === "A-stacked";
				const hasMd = arm === "A-markdown" || arm === "A-stacked";
				expect(await status("/llms.txt")).toBe(hasLlms ? 200 : 404);
				expect(await status("/sitemap.xml")).toBe(hasSitemap ? 200 : 404);
				expect(await status("/policies/returns.md")).toBe(hasMd ? 200 : 404);
				// Negotiation: markdown arms return text/markdown for Accept header.
				const negotiated = await fetch(site.origin + "/policies/returns", {
					headers: { accept: "text/markdown" },
				});
				const ct = negotiated.headers.get("content-type") ?? "";
				expect(ct.includes(hasMd ? "text/markdown" : "text/html")).toBe(true);
				// robots.txt references the sitemap only where it exists.
				const robots = await (await fetch(site.origin + "/robots.txt")).text();
				expect(robots.includes("Sitemap:")).toBe(hasSitemap);
			} finally {
				site.stop();
			}
		}
	});
	test("markdown responses are materially smaller than HTML", async () => {
		const site = startSite("A-markdown");
		try {
			const html = await (
				await fetch(site.origin + "/products/cirrus-2-tent")
			).text();
			const md = await (
				await fetch(site.origin + "/products/cirrus-2-tent", {
					headers: { accept: "text/markdown" },
				})
			).text();
			expect(md.length).toBeLessThan(html.length * 0.45);
			expect(md).toContain("$389");
		} finally {
			site.stop();
		}
	});
});
