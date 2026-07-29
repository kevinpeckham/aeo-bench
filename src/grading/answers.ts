/**
 * Mechanical answer grading (BRIEF.md): registered per-task matchers.
 * Graders get unit tests — a benchmark with an unvalidated grader
 * measures nothing.
 */

export type Matcher =
	| { type: "substring"; value: string }
	| { type: "anySubstring"; values: string[] }
	| { type: "number"; value: number }
	| { type: "sentinel" };

export const SENTINEL = "NOT-ON-SITE";

/** Lowercase, collapse whitespace, strip currency/grouping noise. */
export function normalize(text: string): string {
	return text.toLowerCase().replace(/[$,]/g, "").replace(/\s+/g, " ").trim();
}

/** Every number appearing in the answer, with 4.8-style decimals intact. */
export function numbersIn(text: string): number[] {
	return [...normalize(text).matchAll(/\d+(?:\.\d+)?/g)].map((m) =>
		Number(m[0]),
	);
}

export function grade(answer: string, matcher: Matcher): boolean {
	const norm = normalize(answer);
	// A sentinel reply only counts for sentinel tasks: an agent that says
	// NOT-ON-SITE for a present fact is wrong, whatever else it wrote.
	const saidSentinel = norm.includes(SENTINEL.toLowerCase());
	switch (matcher.type) {
		case "sentinel":
			return saidSentinel;
		case "substring":
			return !saidSentinel && norm.includes(normalize(matcher.value));
		case "anySubstring":
			return (
				!saidSentinel && matcher.values.some((v) => norm.includes(normalize(v)))
			);
		case "number":
			return !saidSentinel && numbersIn(answer).includes(matcher.value);
	}
}
