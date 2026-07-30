/**
 * Study 2 fixture generator (docs/BRIEF-STUDY2.md): the catalog-era
 * Petrel & Pine — ~300 pages, weakly linked by design, with 12
 * registered orphan pages reachable only via discovery files.
 * Deterministic: seeded PRNG from corpus/facts2.json, byte-identical
 * across builds (pinned by test). HTML only (no markdown arms here).
 */
import facts1 from "../../corpus/facts.json";
import facts2 from "../../corpus/facts2.json";

export type Arm2 =
	| "A2-baseline"
	| "A2-sitemap"
	| "A2-llms-curated"
	| "A2-llms-giant"
	| "A2-llms-hier"
	| "A2-hinted";

export interface Page2 {
	path: string;
	title: string;
	html: string;
}

/** mulberry32 — tiny deterministic PRNG. */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a += 0x6d2b79f5;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export interface CatalogProduct {
	slug: string;
	name: string;
	category: string;
	price: number;
	sku: string;
	weightGrams: number;
	pinned: boolean;
}

/** The full catalog: generated products plus pinned ones, deterministic. */
export function buildCatalog(): Map<string, CatalogProduct[]> {
	const rng = mulberry32(facts2.seed);
	const { categories, productsPerCategory, nameAdjectives, nameNouns } =
		facts2.catalog;
	const used = new Set<string>(facts2.pinnedProducts.map((p) => p.slug));
	const byCategory = new Map<string, CatalogProduct[]>();
	for (const [ci, category] of categories.entries()) {
		const items: CatalogProduct[] = [];
		while (items.length < productsPerCategory - 1) {
			const adj = nameAdjectives[
				Math.floor(rng() * nameAdjectives.length)
			] as string;
			const noun = nameNouns[Math.floor(rng() * nameNouns.length)] as string;
			const name = `${adj} ${noun} ${category.slice(0, 1).toUpperCase()}${category.slice(1, -1)}`;
			const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
			if (used.has(slug)) continue;
			used.add(slug);
			items.push({
				slug,
				name,
				category,
				price: 20 + Math.floor(rng() * 56) * 10 + (ci % 2 === 0 ? 9 : 5),
				sku: `PP-${category.slice(0, 2).toUpperCase()}-${100 + items.length}${ci}`,
				weightGrams: 40 + Math.floor(rng() * 300) * 10,
				pinned: false,
			});
		}
		byCategory.set(category, items);
	}
	// Pinned products go LAST in their category (page 2 of the pagination —
	// deep by construction, per the brief's deep-task design).
	for (const p of facts2.pinnedProducts) {
		const items = byCategory.get(p.category);
		if (!items) throw new Error(`pinned category missing: ${p.category}`);
		items.push({ ...p, pinned: true });
	}
	return byCategory;
}

const c = facts1.company;
const pol = facts1.policies;
const w = facts1.wholesale;
const PAGE_SIZE = 10;

function chrome2(title: string, body: string): string {
	// Deliberately thin header: home link only — weak linking is the design.
	return `<!doctype html><html><head><title>${title} · ${c.name}</title></head><body>
<header><a href="/">${c.name}</a> — ${c.tagline}</header>
<main>${body}</main>
<footer><p>${c.name} · ${c.address}</p><p>© Petrel &amp; Pine Supply Co.</p></footer>
</body></html>`;
}

export function buildSite2(): Map<string, Page2> {
	const pages = new Map<string, Page2>();
	const add = (path: string, title: string, body: string) =>
		pages.set(path, { path, title, html: chrome2(title, body) });
	const catalog = buildCatalog();
	const categories = [...catalog.keys()];

	add(
		"/",
		"Home",
		`<h1>${c.name}</h1><p>${c.tagline}</p><ul>
<li><a href="/catalog">Browse the catalog</a></li>
<li><a href="/policies">Store policies</a></li>
<li><a href="/docs">Documentation</a></li>
<li><a href="/contact">Contact</a></li>
<li><a href="/changelog">Changelog</a></li></ul>`,
	);

	add(
		"/catalog",
		"Catalog",
		`<h1>Catalog</h1><ul>${categories
			.map((cat) => `<li><a href="/catalog/${cat}">${cat}</a></li>`)
			.join("")}</ul>`,
	);

	for (const cat of categories) {
		const items = catalog.get(cat) as CatalogProduct[];
		const pageCount = Math.ceil(items.length / PAGE_SIZE);
		for (let page = 1; page <= pageCount; page += 1) {
			const slice = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
			const next =
				page < pageCount
					? `<p><a href="/catalog/${cat}/${page + 1}">Next page</a></p>`
					: "";
			const path = page === 1 ? `/catalog/${cat}` : `/catalog/${cat}/${page}`;
			add(
				path,
				`${cat} (page ${page})`,
				`<h1>${cat} — page ${page} of ${pageCount}</h1><ul>${slice
					.map(
						(x) =>
							`<li><a href="/products/${x.slug}">${x.name}</a> — $${x.price}</li>`,
					)
					.join("")}</ul>${next}`,
			);
		}
		for (const x of items) {
			add(
				`/products/${x.slug}`,
				x.name,
				`<h1>${x.name}</h1><p>Price: $${x.price}</p><ul><li>SKU: ${x.sku}</li><li>Weight: ${x.weightGrams} g</li><li>Category: ${x.category}</li></ul><p>Ships free over $${pol.freeShippingThreshold}. ${pol.warrantyYears}-year warranty.</p>`,
			);
		}
	}

	add(
		"/policies",
		"Store policies",
		`<h1>Policies</h1><ul><li><a href="/policies/returns">Returns</a></li><li><a href="/policies/shipping">Shipping</a></li><li><a href="/policies/privacy">Privacy</a></li></ul>`,
	);
	add(
		"/policies/returns",
		"Returns policy",
		`<h1>Returns</h1><p>Unworn items may be returned within ${pol.returnsWindowDays} days of delivery.</p><p>${pol.returnsExclusions}</p>`,
	);
	add(
		"/policies/shipping",
		"Shipping",
		`<h1>Shipping</h1><p>Standard shipping is a flat $${pol.standardShippingFlat}. Orders over $${pol.freeShippingThreshold} ship free.</p>`,
	);
	add(
		"/policies/privacy",
		"Privacy",
		`<h1>Privacy</h1><p>We collect only order data and aggregate analytics.</p>`,
	);
	add(
		"/contact",
		"Contact",
		`<h1>Contact</h1><p>Support: ${c.supportEmail}</p><p>Wholesale: ${c.wholesaleEmail}</p><p>Phone: ${c.phone}</p><p>Hours: ${c.hours}</p>`,
	);
	add(
		"/changelog",
		"Changelog",
		`<h1>Changelog</h1><ul>${facts1.changelog
			.map(
				(e) => `<li><strong>${e.version}</strong> (${e.date}): ${e.note}</li>`,
			)
			.join("")}</ul>`,
	);

	// Docs: a CHAIN, each page linking only the next (deep by design).
	add(
		"/docs",
		"Documentation",
		`<h1>Documentation</h1><ul><li><a href="/docs/warranty">Warranty terms</a></li><li><a href="/docs/wholesale-api">Wholesale API</a></li></ul>`,
	);
	add(
		"/docs/warranty",
		"Warranty terms",
		`<h1>Warranty</h1><p>${pol.warrantyYears}-year coverage against defects. ${pol.warrantyExclusions}</p><p>See <a href="/docs/warranty/repairs">the repair program</a>.</p>`,
	);
	add(
		"/docs/warranty/repairs",
		"Repair program",
		`<h1>Repairs</h1><p>Covered categories: ${pol.repairCoveredCategories.join(", ")}. Turnaround ${pol.repairTurnaroundBusinessDays} business days. Out-of-warranty flat fee $${pol.repairFlatFeeOutOfWarranty}.</p>`,
	);
	add(
		"/docs/wholesale-api",
		"Wholesale API",
		`<h1>Wholesale API</h1><p>Authenticate with the ${w.authHeader} header. Minimum order ${w.minimumOrderUnits} units per SKU.</p><p>Next: <a href="/docs/wholesale-api/limits">rate limits</a>.</p>`,
	);
	add(
		"/docs/wholesale-api/limits",
		"Rate limits",
		`<h1>Rate limits</h1><p>${w.rateLimitPerMinute} requests per minute per key; list endpoints paginate at ${w.paginationPageSize}.</p><p>Next: <a href="/docs/wholesale-api/errors">error codes</a>.</p>`,
	);
	add(
		"/docs/wholesale-api/errors",
		"Error codes",
		`<h1>Error codes</h1><p>401 missing key; 429 rate limited, back off sixty seconds; 422 validation failure.</p><p>Next: <a href="/docs/wholesale-api/webhooks">webhooks</a>.</p>`,
	);
	add(
		"/docs/wholesale-api/webhooks",
		"Webhooks",
		`<h1>Webhooks</h1><p>Order-status webhooks retry three times with exponential backoff. Confirmation numbers begin PPW-.</p>`,
	);

	// Orphans: pages that exist but are linked from NOWHERE.
	for (const o of facts2.orphans) {
		add(`/${o.slug}`, o.title, `<h1>${o.title}</h1><p>${o.fact}</p>`);
	}

	return pages;
}

/** Section prefix for hierarchical llms.txt grouping. */
function sectionOf(path: string): string {
	if (path.startsWith("/catalog") || path.startsWith("/products"))
		return "catalog";
	if (path.startsWith("/docs")) return "docs";
	if (path.startsWith("/support")) return "support";
	if (path.startsWith("/policies")) return "policies";
	return "root";
}

export function llmsCurated(): string {
	const catalog = buildCatalog();
	const lines = [
		`# ${c.name}`,
		"",
		`> ${c.tagline} Outdoor gear: ${[...catalog.keys()].length} categories, ${[...catalog.values()].flat().length} products, policies, documentation, and support bulletins.`,
		"",
		"## Sections",
		"- [Catalog](/catalog): all categories",
		...[...catalog.keys()].map((cat) => `- [${cat}](/catalog/${cat})`),
		"- [Policies](/policies): returns, shipping, privacy",
		"- [Warranty terms](/docs/warranty) and [repairs](/docs/warranty/repairs)",
		"- [Wholesale API](/docs/wholesale-api): auth, limits, errors, webhooks",
		"- [Contact](/contact) · [Changelog](/changelog)",
		"",
		"## Support notices (not linked from site navigation)",
		...facts2.orphans.map((o) => `- [${o.title}](/${o.slug})`),
	];
	return `${lines.join("\n")}\n`;
}

export function llmsGiant(): string {
	const pages = buildSite2();
	const lines = [
		`# ${c.name} — complete page index`,
		"",
		...[...pages.values()].map((p) => `- [${p.title}](${p.path})`),
	];
	return `${lines.join("\n")}\n`;
}

/** Hierarchical: root file lists per-section llms.txt files. */
export function llmsHier(): Map<string, string> {
	const pages = buildSite2();
	const bySection = new Map<string, Page2[]>();
	for (const p of pages.values()) {
		const s = sectionOf(p.path);
		bySection.set(s, [...(bySection.get(s) ?? []), p]);
	}
	const files = new Map<string, string>();
	files.set(
		"/llms.txt",
		`# ${c.name}\n\n> ${c.tagline} Per-section indexes:\n\n${[
			"catalog",
			"docs",
			"support",
			"policies",
		]
			.map((s) => `- [${s}](/${s}/llms.txt)`)
			.join(
				"\n",
			)}\n\nRoot pages: [Home](/), [Contact](/contact), [Changelog](/changelog)\n`,
	);
	for (const s of ["catalog", "docs", "support", "policies"]) {
		const list = bySection.get(s) ?? [];
		files.set(
			`/${s}/llms.txt`,
			`# ${c.name} — ${s}\n\n${list.map((p) => `- [${p.title}](${p.path})`).join("\n")}\n`,
		);
	}
	return files;
}

export function sitemap2(): string {
	const urls = [...buildSite2().keys()]
		.map(
			(path) => `  <url><loc>https://petrelandpine.example${path}</loc></url>`,
		)
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robots2(arm: Arm2): string {
	const base = "User-agent: *\nAllow: /\n";
	return arm === "A2-sitemap" || arm === "A2-hinted"
		? `${base}Sitemap: https://petrelandpine.example/sitemap.xml\n`
		: base;
}
