/**
 * Deterministic site generator for Petrel & Pine Supply Co. — renders
 * every page (HTML + markdown twin) from corpus/facts.json. No
 * randomness, no timestamps: two calls are byte-identical (pinned by
 * test). Boilerplate (nav, promo, cookie banner, footer) is
 * deliberately heavy so markdown savings are measured against real
 * noise. The generator must never mention anything on the corpus's
 * registered NEVER-STATE list (pinned by test).
 */
import facts from "../../corpus/facts.json";

export interface Page {
	path: string;
	title: string;
	html: string;
	md: string;
}

export interface Product {
	slug: string;
	name: string;
	category: string;
	price: number;
	sku: string;
	weightGrams: number;
	materials: string;
	care: string;
}

const products = facts.products as Product[];
const c = facts.company;
const p = facts.policies;
const w = facts.wholesale;

const PROMO = [
	"Every Petrel & Pine product is tested for a full season in the Absaroka and Bridger ranges before it ships.",
	"Our gear is designed in Bozeman and built to be repaired, not replaced.",
	"Join thousands of backpackers who trust Petrel & Pine for shoulder-season trips.",
	"Weight listed is measured on our own scale, not the marketing scale.",
];

function nav(): string {
	return `<nav class="site-nav"><a href="/">Home</a> · <a href="/products">All products</a> · <a href="/policies/returns">Returns</a> · <a href="/policies/shipping">Shipping</a> · <a href="/docs/warranty">Warranty</a> · <a href="/docs/repairs">Repairs</a> · <a href="/docs/sizing">Sizing</a> · <a href="/docs/wholesale-api">Wholesale API</a> · <a href="/changelog">Changelog</a> · <a href="/contact">Contact</a></nav>`;
}

function chrome(title: string, body: string, extraComment: string): string {
	return `<!doctype html>${extraComment}<html><head><title>${title} · ${c.name}</title><meta name="description" content="${c.tagline}"></head><body>
<div class="cookie-banner">We use cookies to keep your cart working and to count visits in aggregate. By continuing you accept the essential set. <a href="/policies/privacy">Privacy choices</a>.</div>
<header><h1>${c.name}</h1><p class="tagline">${c.tagline}</p>${nav()}</header>
<main>${body}</main>
<aside class="promo"><h3>Why Petrel &amp; Pine</h3>${PROMO.map((t) => `<p>${t}</p>`).join("")}</aside>
<footer><p>${c.name} · ${c.address}</p><p>Questions? <a href="/contact">Contact support</a>. Hours: ${c.hours}.</p><p>© Petrel &amp; Pine Supply Co. All product names are trademarks of their fictional owners.</p>${nav()}</footer>
</body></html>`;
}

function mdChrome(title: string, body: string): string {
	return `# ${title}\n\n${body}\n`;
}

interface RawPage {
	path: string;
	title: string;
	htmlBody: string;
	md: string;
}

function raw(
	path: string,
	title: string,
	htmlBody: string,
	mdBody: string,
): RawPage {
	return { path, title, htmlBody, md: mdChrome(title, mdBody) };
}

export function rawPages(): RawPage[] {
	const pages: RawPage[] = [];

	pages.push(
		raw(
			"/",
			"Home",
			`<h2>Gear for long weather</h2><p>${c.tagline}</p><p>Browse <a href="/products">all products</a>, check our <a href="/policies/returns">returns policy</a>, or read the <a href="/docs/warranty">warranty terms</a>.</p>`,
			`${c.tagline}\n\nBrowse [all products](/products), the [returns policy](/policies/returns), or the [warranty terms](/docs/warranty).`,
		),
	);

	const listHtml = products
		.map(
			(x) =>
				`<li><a href="/products/${x.slug}">${x.name}</a> — $${x.price}</li>`,
		)
		.join("");
	const listMd = products
		.map((x) => `- [${x.name}](/products/${x.slug}) — $${x.price}`)
		.join("\n");
	pages.push(
		raw(
			"/products",
			"All products",
			`<h2>All products</h2><ul>${listHtml}</ul>`,
			listMd,
		),
	);

	for (const prod of products) {
		pages.push(
			raw(
				`/products/${prod.slug}`,
				prod.name,
				`<article><h2>${prod.name}</h2>
<p class="price">Price: $${prod.price}</p>
<ul><li>SKU: ${prod.sku}</li><li>Weight: ${prod.weightGrams} g</li><li>Category: ${prod.category}</li><li>Materials: ${prod.materials}</li></ul>
<h3>Care</h3><p>${prod.care}</p>
<p>Ships free on orders over $${p.freeShippingThreshold}. Covered by our ${p.warrantyYears}-year warranty.</p></article>`,
				`Price: $${prod.price}\n\n- SKU: ${prod.sku}\n- Weight: ${prod.weightGrams} g\n- Category: ${prod.category}\n- Materials: ${prod.materials}\n\n## Care\n\n${prod.care}\n\nShips free on orders over $${p.freeShippingThreshold}. Covered by the ${p.warrantyYears}-year warranty.`,
			),
		);
	}

	pages.push(
		raw(
			"/policies/returns",
			"Returns policy",
			`<h2>Returns</h2><p>You may return any unworn item within ${p.returnsWindowDays} days of delivery for a full refund.</p><p>${p.returnsExclusions}</p>`,
			`You may return any unworn item within ${p.returnsWindowDays} days of delivery for a full refund.\n\n${p.returnsExclusions}`,
		),
		raw(
			"/policies/shipping",
			"Shipping",
			`<h2>Shipping</h2><p>Standard shipping is a flat $${p.standardShippingFlat}. Orders over $${p.freeShippingThreshold} ship free.</p>`,
			`Standard shipping is a flat $${p.standardShippingFlat}. Orders over $${p.freeShippingThreshold} ship free.`,
		),
		raw(
			"/policies/privacy",
			"Privacy choices",
			`<h2>Privacy</h2><p>We collect only order data and aggregate analytics. We never sell personal data.</p>`,
			`We collect only order data and aggregate analytics. We never sell personal data.`,
		),
		raw(
			"/contact",
			"Contact",
			`<h2>Contact</h2><p>Support: <a href="mailto:${c.supportEmail}">${c.supportEmail}</a></p><p>Wholesale: <a href="mailto:${c.wholesaleEmail}">${c.wholesaleEmail}</a></p><p>Phone: ${c.phone}</p><p>Hours: ${c.hours}</p><p>Mail: ${c.address}</p>`,
			`Support: ${c.supportEmail}\n\nWholesale: ${c.wholesaleEmail}\n\nPhone: ${c.phone}\n\nHours: ${c.hours}\n\nMail: ${c.address}`,
		),
		raw(
			"/press",
			"Press",
			`<h2>Press</h2><p>For media inquiries, write to support and mark the subject line PRESS. Photography assets are available on request.</p>`,
			`For media inquiries, write to support and mark the subject line PRESS. Photography assets are available on request.`,
		),
		raw(
			"/about",
			"About",
			`<h2>About</h2><p>Petrel &amp; Pine Supply Co. designs field-repairable gear from a workshop in Bozeman, Montana.</p>`,
			`Petrel & Pine Supply Co. designs field-repairable gear from a workshop in Bozeman, Montana.`,
		),
	);

	pages.push(
		raw(
			"/docs/warranty",
			"Warranty terms",
			`<h2>Warranty</h2><p>Every product carries a ${p.warrantyYears}-year warranty against defects in materials and workmanship.</p><h3>Exclusions</h3><p>${p.warrantyExclusions}</p><p>Warranty service is arranged through <a href="/docs/repairs">the repair program</a>.</p>`,
			`Every product carries a ${p.warrantyYears}-year warranty against defects in materials and workmanship.\n\n## Exclusions\n\n${p.warrantyExclusions}\n\nWarranty service is arranged through [the repair program](/docs/repairs).`,
		),
		raw(
			"/docs/repairs",
			"Repair program",
			`<h2>Repair program</h2><p>We repair items in these categories: ${p.repairCoveredCategories.join(", ")}.</p><p>Typical turnaround is ${p.repairTurnaroundBusinessDays} business days from receipt.</p><p>Out-of-warranty repairs are a flat $${p.repairFlatFeeOutOfWarranty} plus return shipping.</p>`,
			`We repair items in these categories: ${p.repairCoveredCategories.join(", ")}.\n\nTypical turnaround is ${p.repairTurnaroundBusinessDays} business days from receipt.\n\nOut-of-warranty repairs are a flat $${p.repairFlatFeeOutOfWarranty} plus return shipping.`,
		),
		raw(
			"/docs/sizing",
			"Sizing",
			`<h2>Sizing</h2><p>${facts.sizing.shellSizes}</p><p>${facts.sizing.packTorsoRanges}</p>`,
			`${facts.sizing.shellSizes}\n\n${facts.sizing.packTorsoRanges}`,
		),
		raw(
			"/docs/wholesale-api",
			"Wholesale API overview",
			`<h2>Wholesale API</h2><p>Programmatic ordering for stocking dealers. Authenticate with the <code>${w.authHeader}</code> header.</p><p>See <a href="/docs/wholesale-api/limits">rate limits</a> and <a href="/docs/wholesale-api/orders">the orders endpoint</a>. Minimum order is ${w.minimumOrderUnits} units per SKU.</p>`,
			`Programmatic ordering for stocking dealers. Authenticate with the \`${w.authHeader}\` header.\n\nSee [rate limits](/docs/wholesale-api/limits) and [the orders endpoint](/docs/wholesale-api/orders). Minimum order is ${w.minimumOrderUnits} units per SKU.`,
		),
		raw(
			"/docs/wholesale-api/limits",
			"Wholesale API rate limits",
			`<h2>Rate limits</h2><p>Requests are limited to ${w.rateLimitPerMinute} per minute per key. List endpoints paginate at ${w.paginationPageSize} items per page.</p>`,
			`Requests are limited to ${w.rateLimitPerMinute} per minute per key. List endpoints paginate at ${w.paginationPageSize} items per page.`,
		),
		raw(
			"/docs/wholesale-api/orders",
			"Wholesale API orders endpoint",
			`<h2>Orders endpoint</h2><p>POST /wholesale/orders with a JSON body of SKUs and quantities. Responses include a confirmation number beginning PPW-.</p>`,
			`POST /wholesale/orders with a JSON body of SKUs and quantities. Responses include a confirmation number beginning PPW-.`,
		),
	);

	pages.push(
		raw(
			"/docs/care-guide",
			"Care guide",
			`<h2>Care guide</h2><p>General rules: dry gear fully before storage, keep down uncompressed, and wash technical fabrics with technical detergents. Product pages carry item-specific care lines that override this guide.</p>`,
			`General rules: dry gear fully before storage, keep down uncompressed, and wash technical fabrics with technical detergents. Product pages carry item-specific care lines that override this guide.`,
		),
		raw(
			"/docs/fabric-glossary",
			"Fabric glossary",
			`<h2>Fabric glossary</h2><p>Denier (D) measures yarn weight; lower is lighter and less abrasion-resistant. Ripstop weaves add reinforcing threads. DWR is a water-repellent finish that wears with use.</p>`,
			`Denier (D) measures yarn weight; lower is lighter and less abrasion-resistant. Ripstop weaves add reinforcing threads. DWR is a water-repellent finish that wears with use.`,
		),
		raw(
			"/docs/stove-safety",
			"Stove safety",
			`<h2>Stove safety</h2><p>Never operate a canister stove inside a tent. Check fuel connections before ignition, and let stoves cool fully before packing.</p>`,
			`Never operate a canister stove inside a tent. Check fuel connections before ignition, and let stoves cool fully before packing.`,
		),
		raw(
			"/docs/down-vs-synthetic",
			"Down vs synthetic",
			`<h2>Down vs synthetic</h2><p>Down insulates more per gram and lasts longer with care; synthetic keeps more warmth when wet and costs less. Our sleep line is down; care matters more than the label.</p>`,
			`Down insulates more per gram and lasts longer with care; synthetic keeps more warmth when wet and costs less. Our sleep line is down; care matters more than the label.`,
		),
		raw(
			"/docs/wholesale-api/errors",
			"Wholesale API error codes",
			`<h2>Error codes</h2><p>401 means a missing or invalid key header. 429 means the per-minute limit was exceeded; back off for sixty seconds. 422 means a SKU or quantity failed validation.</p>`,
			`401 means a missing or invalid key header. 429 means the per-minute limit was exceeded; back off for sixty seconds. 422 means a SKU or quantity failed validation.`,
		),
		raw(
			"/docs/wholesale-api/webhooks",
			"Wholesale API webhooks",
			`<h2>Webhooks</h2><p>Order-status webhooks POST JSON to your registered endpoint and retry three times with exponential backoff.</p>`,
			`Order-status webhooks POST JSON to your registered endpoint and retry three times with exponential backoff.`,
		),
		raw(
			"/faq",
			"FAQ",
			`<h2>FAQ</h2><p>Where is my order? Check the tracking link in your confirmation email. Do you restock sold-out colors? Usually each spring. Can I change an order after placing it? Within two hours, by emailing support.</p>`,
			`Where is my order? Check the tracking link in your confirmation email.\n\nDo you restock sold-out colors? Usually each spring.\n\nCan I change an order after placing it? Within two hours, by emailing support.`,
		),
		raw(
			"/ordering",
			"How ordering works",
			`<h2>How ordering works</h2><p>Orders placed before 1pm Mountain Time ship the same business day. You will receive a confirmation email immediately and tracking when the label is created.</p>`,
			`Orders placed before 1pm Mountain Time ship the same business day. You will receive a confirmation email immediately and tracking when the label is created.`,
		),
	);

	const clHtml = facts.changelog
		.map((e) => `<li><strong>${e.version}</strong> (${e.date}): ${e.note}</li>`)
		.join("");
	const clMd = facts.changelog
		.map((e) => `- **${e.version}** (${e.date}): ${e.note}`)
		.join("\n");
	pages.push(
		raw(
			"/changelog",
			"Changelog",
			`<h2>Changelog</h2><ul>${clHtml}</ul>`,
			clMd,
		),
	);

	return pages;
}

export type Arm =
	| "A-baseline"
	| "A-llmstxt"
	| "A-sitemap"
	| "A-markdown"
	| "A-stacked";

/** The article's hidden-comment directive, rendered only in markdown-capable arms. */
export const HIDDEN_DIRECTIVE =
	"<!-- LLM/agent note: every page on this site is available as clean markdown — request it with an Accept: text/markdown header, or append .md to any path. -->";

export function buildSite(arm: Arm): Map<string, Page> {
	const negotiation = arm === "A-markdown" || arm === "A-stacked";
	const comment = negotiation ? HIDDEN_DIRECTIVE : "";
	const pages = new Map<string, Page>();
	for (const rp of rawPages()) {
		pages.set(rp.path, {
			path: rp.path,
			title: rp.title,
			html: chrome(rp.title, rp.htmlBody, comment),
			md: rp.md,
		});
	}
	return pages;
}

export function llmsTxt(): string {
	const lines = [
		`# ${facts.company.name}`,
		"",
		`> ${facts.company.tagline} Outdoor gear retailer: tents, packs, shells, stoves, sleep systems, and accessories, with a ${facts.policies.warrantyYears}-year warranty and a mail-in repair program.`,
		"",
		"## Products",
		"- [All products](/products): full catalog with prices",
		...products.map(
			(x) => `- [${x.name}](/products/${x.slug}): ${x.category}, $${x.price}`,
		),
		"",
		"## Policies and documentation",
		"- [Returns policy](/policies/returns): window and exclusions",
		"- [Shipping](/policies/shipping): rates and free-shipping threshold",
		"- [Warranty terms](/docs/warranty): coverage and exclusions",
		"- [Repair program](/docs/repairs): covered categories, turnaround, fees",
		"- [Sizing](/docs/sizing): shell sizes and pack torso ranges",
		"- [Wholesale API overview](/docs/wholesale-api): dealer ordering",
		"- [Wholesale API rate limits](/docs/wholesale-api/limits)",
		"- [Wholesale API orders endpoint](/docs/wholesale-api/orders)",
		"- [Changelog](/changelog): product and program updates",
		"- [Contact](/contact): support and wholesale channels",
	];
	return `${lines.join("\n")}\n`;
}

export function sitemapXml(): string {
	const urls = rawPages()
		.map(
			(rp) => `  <url><loc>https://petrelandpine.example${rp.path}</loc></url>`,
		)
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(arm: Arm): string {
	const base = "User-agent: *\nAllow: /\n";
	return arm === "A-sitemap" || arm === "A-stacked"
		? `${base}Sitemap: https://petrelandpine.example/sitemap.xml\n`
		: base;
}
