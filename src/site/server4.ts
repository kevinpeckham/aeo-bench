/**
 * Study 4 fixture server (docs/BRIEF-STUDY4.md): the Study 2 site plus
 * a capability surface — order-status and product endpoints and an MCP
 * server card at /.well-known/mcp/server-card.json — served per arm.
 * Order data appears on NO page (pinned by test).
 */
import facts4 from "../../corpus/facts4.json";
import type { Page2 } from "./generate2.js";
import { buildCatalog, buildSite2, llmsCurated, robots2 } from "./generate2.js";

export type Arm4 = "C-control" | "C-card" | "C-affordance" | "C-mounted";

export interface RunningSite4 {
	origin: string;
	arm: Arm4;
	stop: () => void;
}

export function serverCard(origin: string): string {
	return JSON.stringify(
		{
			name: "Petrel & Pine Supply Co.",
			description:
				"Machine-usable capabilities for the Petrel & Pine store: order status lookup and structured product data.",
			transport: "http",
			capabilities: [
				{
					name: "order_status",
					description:
						"Look up an order by number (format PP-YYYY-NNNN). Returns status, items, ship date, carrier, tracking.",
					method: "GET",
					url: `${origin}/api/order-status?number={orderNumber}`,
				},
				{
					name: "product_lookup",
					description:
						"Structured product data by slug. Returns name, price, SKU, weight, category.",
					method: "GET",
					url: `${origin}/api/products/{slug}`,
				},
			],
		},
		null,
		1,
	);
}

export function orderJson(number: string): { status: number; body: string } {
	const order = facts4.orders.find((o) => o.number === number);
	if (!order) {
		return {
			status: 404,
			body: JSON.stringify({ error: "order not found", number }),
		};
	}
	return { status: 200, body: JSON.stringify(order) };
}

export function startSite4(arm: Arm4): RunningSite4 {
	const pages: Map<string, Page2> = buildSite2();
	const products = new Map(
		[...buildCatalog().values()].flat().map((p) => [p.slug, p]),
	);
	const capabilitiesLive = arm !== "C-control";

	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch(req) {
			const url = new URL(req.url);
			let path = url.pathname;
			if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

			if (path === "/robots.txt") return text(robots2("A2-llms-curated"));
			if (path === "/llms.txt") return text(llmsCurated());
			if (path === "/.well-known/mcp/server-card.json") {
				if (!capabilitiesLive) return notFound();
				return new Response(serverCard(url.origin), {
					headers: { "content-type": "application/json; charset=utf-8" },
				});
			}
			if (path === "/api/order-status") {
				if (!capabilitiesLive) return notFound();
				const r = orderJson(url.searchParams.get("number") ?? "");
				return new Response(r.body, {
					status: r.status,
					headers: { "content-type": "application/json; charset=utf-8" },
				});
			}
			if (path.startsWith("/api/products/")) {
				if (!capabilitiesLive) return notFound();
				const slug = path.slice("/api/products/".length);
				const p = products.get(slug);
				return new Response(
					p
						? JSON.stringify(p)
						: JSON.stringify({ error: "product not found", slug }),
					{
						status: p ? 200 : 404,
						headers: { "content-type": "application/json; charset=utf-8" },
					},
				);
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
