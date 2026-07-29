/**
 * In-process fixture server: real HTTP semantics for one arm on an
 * ephemeral localhost port. Agents reach it only through the harness
 * fetch tool. Semantics per BRIEF.md:
 *  - baseline: HTML only; llms.txt / sitemap.xml / *.md all 404.
 *  - A-llmstxt: + GET /llms.txt.
 *  - A-sitemap: + GET /sitemap.xml, referenced from /robots.txt.
 *  - A-markdown: + Accept: text/markdown negotiation on every page,
 *    + .md fallback paths, + hidden HTML directive (in generate.ts).
 *  - A-stacked: all of the above.
 */
import type { Arm, Page } from "./generate.js";
import { buildSite, llmsTxt, robotsTxt, sitemapXml } from "./generate.js";

export interface RunningSite {
	origin: string;
	arm: Arm;
	stop: () => void;
}

export function startSite(arm: Arm): RunningSite {
	const pages: Map<string, Page> = buildSite(arm);
	const hasLlms = arm === "A-llmstxt" || arm === "A-stacked";
	const hasSitemap = arm === "A-sitemap" || arm === "A-stacked";
	const hasMarkdown = arm === "A-markdown" || arm === "A-stacked";

	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch(req) {
			const url = new URL(req.url);
			let path = url.pathname;
			if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

			if (path === "/robots.txt") {
				return new Response(robotsTxt(arm), {
					headers: { "content-type": "text/plain; charset=utf-8" },
				});
			}
			if (path === "/llms.txt") {
				if (!hasLlms) return notFound();
				return new Response(llmsTxt(), {
					headers: { "content-type": "text/plain; charset=utf-8" },
				});
			}
			if (path === "/sitemap.xml") {
				if (!hasSitemap) return notFound();
				return new Response(sitemapXml(), {
					headers: { "content-type": "application/xml; charset=utf-8" },
				});
			}

			// .md fallback paths (markdown arms only).
			if (path.endsWith(".md")) {
				if (!hasMarkdown) return notFound();
				const base = path.slice(0, -3) || "/";
				const page = pages.get(base === "/index" ? "/" : base);
				if (!page) return notFound();
				return new Response(page.md, {
					headers: { "content-type": "text/markdown; charset=utf-8" },
				});
			}

			const page = pages.get(path);
			if (!page) return notFound();

			const accept = req.headers.get("accept") ?? "";
			if (hasMarkdown && accept.includes("text/markdown")) {
				return new Response(page.md, {
					headers: {
						"content-type": "text/markdown; charset=utf-8",
						vary: "Accept",
					},
				});
			}
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

function notFound(): Response {
	return new Response(
		'<!doctype html><html><body><h1>404 Not Found</h1><p>That page does not exist. Try the <a href="/">home page</a>.</p></body></html>',
		{ status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
	);
}
