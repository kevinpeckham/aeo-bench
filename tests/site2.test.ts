/** Study 2 fixture validation (BRIEF-STUDY2): determinism, weak
 * linking, orphan unreachability, arm semantics, NEVER-STATE. */
import { describe, expect, test } from "bun:test";
import facts2 from "../corpus/facts2.json";
import tasks2 from "../corpus/tasks2.json";
import type { Arm2 } from "../src/site/generate2.js";
import {
	buildSite2,
	llmsCurated,
	llmsGiant,
	llmsHier,
	sitemap2,
} from "../src/site/generate2.js";
import { startSite2 } from "../src/site/server2.js";

const ARMS: Arm2[] = [
	"A2-baseline",
	"A2-sitemap",
	"A2-llms-curated",
	"A2-llms-giant",
	"A2-llms-hier",
	"A2-hinted",
];

describe("generator 2", () => {
	test("deterministic and ~300 pages", () => {
		const a = [...buildSite2().values()].map((p) => p.html).join("");
		const b = [...buildSite2().values()].map((p) => p.html).join("");
		expect(a).toBe(b);
		const size = buildSite2().size;
		expect(size).toBeGreaterThanOrEqual(280);
		expect(size).toBeLessThanOrEqual(340);
	});
	test("orphans exist as pages but are linked from NO page", () => {
		const pages = buildSite2();
		for (const o of facts2.orphans) {
			expect(pages.has(`/${o.slug}`)).toBe(true);
		}
		const linkText = [...pages.values()].map((p) => p.html).join("\n");
		for (const o of facts2.orphans) {
			const hrefCount = linkText.split(`href="/${o.slug}"`).length - 1;
			expect(hrefCount, `orphan ${o.slug} is linked in page HTML`).toBe(0);
		}
	});
	test("orphans appear in sitemap and every llms variant", () => {
		const sm = sitemap2();
		const curated = llmsCurated();
		const giant = llmsGiant();
		const hier = [...llmsHier().values()].join("\n");
		for (const o of facts2.orphans) {
			expect(sm).toContain(`/${o.slug}</loc>`);
			expect(curated).toContain(`(/${o.slug})`);
			expect(giant).toContain(`(/${o.slug})`);
			expect(hier).toContain(`(/${o.slug})`);
		}
	});
	test("pinned products land on page 2 of their category (deep by pagination)", () => {
		const pages = buildSite2();
		for (const p of facts2.pinnedProducts) {
			const pageOne = pages.get(`/catalog/${p.category}`);
			const pageTwo = pages.get(`/catalog/${p.category}/2`);
			expect(pageOne?.html.includes(`/products/${p.slug}`)).toBe(false);
			expect(pageTwo?.html.includes(`/products/${p.slug}`)).toBe(true);
		}
	});
	test("giant llms.txt is an order of magnitude longer than curated", () => {
		expect(llmsGiant().length).toBeGreaterThan(llmsCurated().length * 4);
	});
	test("NEVER-STATE terms appear nowhere", () => {
		const text = [...buildSite2().values()]
			.map((p) => p.html)
			.join("\n")
			.toLowerCase();
		for (const term of [
			"ceo",
			"founder",
			"price match",
			"student discount",
			"retail store",
			"gift wrap",
			"carbon neutral",
			"live chat",
			"loyalty",
			"black friday",
		]) {
			expect(text.includes(term), `"${term}" leaked`).toBe(false);
		}
	});
	test("orphan task needles exist only on orphan pages", () => {
		const pages = buildSite2();
		const orphanPaths = new Set(facts2.orphans.map((o) => `/${o.slug}`));
		for (const o of facts2.orphans) {
			const holders = [...pages.values()].filter((p) =>
				p.html.includes(o.needle),
			);
			expect(holders.length).toBeGreaterThanOrEqual(1);
			for (const h of holders) {
				expect(orphanPaths.has(h.path), `${o.needle} leaked to ${h.path}`).toBe(
					true,
				);
			}
		}
		expect(tasks2.tasks.filter((t) => t.cls === "orphan").length).toBe(10);
	});
});

describe("server 2 arm semantics", () => {
	test("discovery files serve exactly per arm", async () => {
		for (const arm of ARMS) {
			const site = startSite2(arm);
			try {
				const status = async (path: string) =>
					(await fetch(site.origin + path)).status;
				const hasSitemap = arm === "A2-sitemap" || arm === "A2-hinted";
				const hasRootLlms =
					arm === "A2-llms-curated" ||
					arm === "A2-llms-giant" ||
					arm === "A2-llms-hier" ||
					arm === "A2-hinted";
				expect(await status("/sitemap.xml")).toBe(hasSitemap ? 200 : 404);
				expect(await status("/llms.txt")).toBe(hasRootLlms ? 200 : 404);
				expect(await status("/support/llms.txt")).toBe(
					arm === "A2-llms-hier" ? 200 : 404,
				);
				expect(await status("/support/rebate-terms")).toBe(200);
				expect(await status("/nope")).toBe(404);
			} finally {
				site.stop();
			}
		}
	});
});

describe("Study 3 affordance texts", () => {
	test("registered prefetch header and tool description are pinned", async () => {
		const { PREFETCH_HEADER, INDEX_TOOL_DESCRIPTION } = await import(
			"../src/harness/fetch-runner3.js"
		);
		expect(PREFETCH_HEADER).toBe(
			"Site index (served by the site at /llms.txt):",
		);
		expect(INDEX_TOOL_DESCRIPTION).toBe(
			"Returns the site's machine-readable index of pages.",
		);
	});
});

describe("Study 4 capability surface", () => {
	test("order needles exist on no page; endpoints and card serve per arm", async () => {
		const facts4 = (await import("../corpus/facts4.json")).default;
		const pages = buildSite2();
		const allHtml = [...pages.values()].map((p) => p.html).join("\n");
		for (const o of facts4.orders) {
			expect(allHtml.includes(o.number), `${o.number} leaked to a page`).toBe(
				false,
			);
		}
		const { startSite4 } = await import("../src/site/server4.js");
		for (const arm of [
			"C-control",
			"C-card",
			"C-affordance",
			"C-mounted",
		] as const) {
			const site = startSite4(arm);
			try {
				const live = arm !== "C-control";
				const card = await fetch(
					`${site.origin}/.well-known/mcp/server-card.json`,
				);
				expect(card.status).toBe(live ? 200 : 404);
				const good = await fetch(
					`${site.origin}/api/order-status?number=PP-2026-0117`,
				);
				expect(good.status).toBe(live ? 200 : 404);
				if (live) {
					const body = (await good.json()) as { status: string };
					expect(body.status).toBe("shipped");
					const bad = await fetch(
						`${site.origin}/api/order-status?number=PP-2026-0001`,
					);
					expect(bad.status).toBe(404);
					const prod = await fetch(`${site.origin}/api/products/cirrus-2-tent`);
					expect(((await prod.json()) as { price: number }).price).toBe(389);
				}
			} finally {
				site.stop();
			}
		}
	});
	test("orderNotFound grading", async () => {
		const { gradeV2 } = await import("../src/grading/answers.js");
		expect(
			gradeV2("I could not find any order with that number.", {
				type: "orderNotFound",
			}),
		).toBe(true);
		expect(gradeV2("Order not found.", { type: "orderNotFound" })).toBe(true);
		expect(
			gradeV2("It shipped on July 28 via UPS.", { type: "orderNotFound" }),
		).toBe(false);
	});
});
