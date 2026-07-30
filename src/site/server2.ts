/**
 * Study 2 fixture server (docs/BRIEF-STUDY2.md): arm semantics for the
 * weakly-linked catalog-era site. Discovery files per arm:
 *  - baseline: llms.txt + sitemap.xml 404
 *  - sitemap: sitemap.xml, robots-referenced
 *  - llms-curated / llms-giant: one /llms.txt variant
 *  - llms-hier: root + per-section llms.txt files
 *  - hinted: curated llms.txt AND sitemap present (the affordance
 *    lives in the fetch tool description, not the site)
 */
import type { Arm2, Page2 } from "./generate2.js";
import {
	buildSite2,
	llmsCurated,
	llmsGiant,
	llmsHier,
	robots2,
	sitemap2,
} from "./generate2.js";

export interface RunningSite2 {
	origin: string;
	arm: Arm2;
	stop: () => void;
}

export function startSite2(arm: Arm2): RunningSite2 {
	const pages: Map<string, Page2> = buildSite2();
	const hier = arm === "A2-llms-hier" ? llmsHier() : null;
	const hasSitemap = arm === "A2-sitemap" || arm === "A2-hinted";
	const llmsRoot =
		arm === "A2-llms-curated" || arm === "A2-hinted"
			? llmsCurated()
			: arm === "A2-llms-giant"
				? llmsGiant()
				: null;

	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch(req) {
			const url = new URL(req.url);
			let path = url.pathname;
			if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

			if (path === "/robots.txt") {
				return text(robots2(arm));
			}
			if (path === "/sitemap.xml") {
				if (!hasSitemap) return notFound();
				return new Response(sitemap2(), {
					headers: { "content-type": "application/xml; charset=utf-8" },
				});
			}
			if (path.endsWith("/llms.txt") || path === "/llms.txt") {
				if (hier) {
					const file = hier.get(path);
					return file ? text(file) : notFound();
				}
				if (path === "/llms.txt" && llmsRoot) return text(llmsRoot);
				return notFound();
			}
			const page = pages.get(path);
			if (!page) return notFound();
			return new Response(page.html, {
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		},
	});

	return {
		origin: `http://127.0.0.1:${server.port}`,
		arm,
		stop: () => server.stop(true),
	};
}

function text(body: string): Response {
	return new Response(body, {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
function notFound(): Response {
	return new Response(
		'<!doctype html><html><body><h1>404 Not Found</h1><p>That page does not exist. Try the <a href="/">home page</a>.</p></body></html>',
		{ status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
	);
}
