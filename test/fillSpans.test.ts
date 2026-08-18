import { describe, expect, it } from "vitest";
import { assignFillSpans } from "../src/fillSpans";

describe("assignFillSpans", () => {
	it("keeps a short row of default cards together", () => {
		const out = assignFillSpans([
			{ id: "a", span: 1 },
			{ id: "b", span: 1 },
			{ id: "c", span: 1 },
		]);
		expect(out.map((x) => x.rowStart)).toEqual([false, false, false]);
	});

	it("wraps the 9th default card", () => {
		const items = Array.from({ length: 9 }, (_, i) => ({ id: String(i), span: 1 as const }));
		const out = assignFillSpans(items);
		expect(out.slice(0, 8).every((x) => !x.rowStart)).toBe(true);
		expect(out[8]?.rowStart).toBe(true);
	});

	it("keeps 2 + 3 + fill on one row", () => {
		const out = assignFillSpans([
			{ id: "a", span: 2 },
			{ id: "b", span: 3 },
			{ id: "c", span: "fill" },
		]);
		expect(out.map((x) => x.rowStart)).toEqual([false, false, false]);
	});

	it("keeps fill siblings on one row (equal CSS grow, no leftover tracks)", () => {
		const out = assignFillSpans([
			{ id: "a", span: 1 },
			{ id: "b", span: "fill" },
			{ id: "c", span: "fill" },
		]);
		expect(out.map((x) => x.rowStart)).toEqual([false, false, false]);
	});

	it("wraps numerics that would exceed 8", () => {
		const out = assignFillSpans([
			{ id: "a", span: 5 },
			{ id: "b", span: 5 },
		]);
		expect(out[0]?.rowStart).toBe(false);
		expect(out[1]?.rowStart).toBe(true);
	});

	it("starts a new row after fill for a following literal", () => {
		const out = assignFillSpans([
			{ id: "a", span: "fill" },
			{ id: "b", span: 2 },
		]);
		expect(out[0]?.rowStart).toBe(false);
		expect(out[1]?.rowStart).toBe(true);
	});

	it("lets full own a row", () => {
		const out = assignFillSpans([
			{ id: "a", span: 1 },
			{ id: "b", span: "full" },
			{ id: "c", span: 1 },
		]);
		expect(out.map((x) => x.rowStart)).toEqual([false, true, true]);
	});

	it("wraps the 9th fill", () => {
		const items = Array.from({ length: 9 }, (_, i) => ({ id: String(i), span: "fill" as const }));
		const out = assignFillSpans(items);
		expect(out[8]?.rowStart).toBe(true);
	});
});
