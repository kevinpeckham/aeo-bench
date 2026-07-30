/** Grader validation (BRIEF.md — graders get unit tests). */
import { describe, expect, test } from "bun:test";
import { grade, numbersIn } from "../src/grading/answers.js";

describe("normalize + numbers", () => {
	test("currency and grouping noise stripped", () => {
		expect(numbersIn("The price is $1,389.00")).toContain(1389);
		expect(numbersIn("R-value of 4.8")).toContain(4.8);
	});
});

describe("grade", () => {
	test("substring matches case-insensitively through noise", () => {
		expect(
			grade("The SKU is pp-ac-880 per the product page.", {
				type: "substring",
				value: "PP-AC-880",
			}),
		).toBe(true);
		expect(
			grade("I could not find a SKU.", {
				type: "substring",
				value: "PP-AC-880",
			}),
		).toBe(false);
	});
	test("number requires the exact figure", () => {
		expect(grade("It costs $389.", { type: "number", value: 389 })).toBe(true);
		expect(grade("It costs $398.", { type: "number", value: 389 })).toBe(false);
		expect(grade("45 days from delivery", { type: "number", value: 45 })).toBe(
			true,
		);
	});
	test("anySubstring accepts any registered phrasing", () => {
		expect(
			grade("No — stoves are not covered by the repair program.", {
				type: "anySubstring",
				values: ["no", "not covered"],
			}),
		).toBe(true);
	});
	test("sentinel tasks require the sentinel; present tasks reject it", () => {
		expect(grade("NOT-ON-SITE", { type: "sentinel" })).toBe(true);
		expect(
			grade("The site does not say. NOT-ON-SITE.", { type: "sentinel" }),
		).toBe(true);
		expect(grade("Probably around 10%?", { type: "sentinel" })).toBe(false);
		expect(
			grade("NOT-ON-SITE (but maybe $389?)", { type: "number", value: 389 }),
		).toBe(false);
	});
});

import { gradeV2, normalizeV2 } from "../src/grading/answers.js";

describe("gradeV2 (Study 1′ corrections)", () => {
	test("time spacing and unicode dashes normalize", () => {
		expect(normalizeV2("8 am to 6 pm")).toBe("8am to 6pm");
		expect(
			gradeV2("Monday to Friday, 8 am to 6 pm Mountain Time.", {
				type: "substring",
				value: "8am to 6pm",
			}),
		).toBe(true);
		expect(
			gradeV2("It added a red‑light lock mode.", {
				type: "substring",
				value: "red-light lock",
			}),
		).toBe(true);
	});
	test("honest absence phrasing counts for sentinel tasks only", () => {
		expect(
			gradeV2("The site does not state anything about a student discount.", {
				type: "sentinel",
			}),
		).toBe(true);
		expect(
			gradeV2(
				"No — the site lists email, phone, and mail only; live chat is not offered.",
				{ type: "sentinel" },
			),
		).toBe(true);
		expect(gradeV2("Probably around 10%?", { type: "sentinel" })).toBe(false);
		expect(gradeV2("", { type: "sentinel" })).toBe(false);
	});
	test("present-class rules unchanged: sentinel-bearing answers stay wrong", () => {
		expect(
			gradeV2("NOT-ON-SITE (maybe $389?)", { type: "number", value: 389 }),
		).toBe(false);
		expect(gradeV2("It costs $389.", { type: "number", value: 389 })).toBe(
			true,
		);
	});
});
