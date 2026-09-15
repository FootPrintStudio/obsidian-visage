import { describe, expect, it } from "vitest";
import { assignFillSpans, DECK_COLUMNS } from "../src/fillSpans";

describe("assignFillSpans", () => {
	it("gives three default cards equal width on a 24-track row", () => {
		const out = assignFillSpans([
			{ id: "a", span: 1 },
			{ id: "b", span: 1 },
			{ id: "c", span: 1 },
		]);
		expect(out.map((x) => x.columns)).toEqual([8, 8, 8]);
		expect(out.reduce((s, x) => s + x.columns, 0)).toBe(DECK_COLUMNS);
	});

	it("wraps the 9th default card onto a new row", () => {
		const items = Array.from({ length: 9 }, (_, i) => ({ id: String(i), span: 1 as const }));
		const out = assignFillSpans(items);
		expect(out.slice(0, 8).every((x) => x.columns === 3)).toBe(true);
		expect(out[8]?.columns).toBe(DECK_COLUMNS);
	});

	it("gives leftover tracks to fill after literals", () => {
		const out = assignFillSpans([
			{ id: "a", span: 2 },
			{ id: "b", span: 3 },
			{ id: "c", span: "fill" },
		]);
		// 2→6, 3→9, fill→9
		expect(out.map((x) => x.columns)).toEqual([6, 9, 9]);
	});

	it("shares leftover among fill siblings", () => {
		const out = assignFillSpans([
			{ id: "a", span: 1 },
			{ id: "b", span: "fill" },
			{ id: "c", span: "fill" },
		]);
		expect(out.map((x) => x.columns)).toEqual([8, 8, 8]);
	});

	it("wraps numerics that would exceed 8 slots", () => {
		const out = assignFillSpans([
			{ id: "a", span: 5 },
			{ id: "b", span: 5 },
		]);
		expect(out.map((x) => x.columns)).toEqual([15, 15]);
	});

	it("starts a new row after fill for a following literal", () => {
		const out = assignFillSpans([
			{ id: "a", span: "fill" },
			{ id: "b", span: 2 },
		]);
		expect(out[0]?.columns).toBe(DECK_COLUMNS);
		expect(out[1]?.columns).toBe(6);
	});

	it("lets full own a row", () => {
		const out = assignFillSpans([
			{ id: "a", span: 1 },
			{ id: "b", span: "full" },
			{ id: "c", span: 1 },
		]);
		expect(out.map((x) => x.columns)).toEqual([DECK_COLUMNS, DECK_COLUMNS, DECK_COLUMNS]);
	});

	it("wraps the 9th fill", () => {
		const items = Array.from({ length: 9 }, (_, i) => ({ id: String(i), span: "fill" as const }));
		const out = assignFillSpans(items);
		expect(out.slice(0, 8).every((x) => x.columns === 3)).toBe(true);
		expect(out[8]?.columns).toBe(DECK_COLUMNS);
	});

	it("keeps five default cards nearly even", () => {
		const out = assignFillSpans(
			Array.from({ length: 5 }, (_, i) => ({ id: String(i), span: 1 as const })),
		);
		expect(out.map((x) => x.columns)).toEqual([5, 5, 5, 5, 4]);
	});
});
