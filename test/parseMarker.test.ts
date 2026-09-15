import { describe, expect, it } from "vitest";
import { isVCardMarkerText, parseVCardMarker } from "../src/parseMarker";

describe("isVCardMarkerText", () => {
	it("matches a bare marker", () => {
		expect(isVCardMarkerText("v-card")).toBe(true);
	});

	it("matches bags", () => {
		expect(isVCardMarkerText("v-card {span=2}")).toBe(true);
	});

	it("ignores other inline code", () => {
		expect(isVCardMarkerText("q=status")).toBe(false);
		expect(isVCardMarkerText("card")).toBe(false);
	});
});

describe("parseVCardMarker", () => {
	it("returns defaults for a bare marker", () => {
		expect(parseVCardMarker("v-card")).toEqual({
			span: 1,
			layout: undefined,
			tone: undefined,
			border: undefined,
			errors: [],
		});
	});

	it("parses exclusive bags in any order", () => {
		const parsed = parseVCardMarker("v-card {tone=warning} {span=full} {layout=hero}");
		expect(parsed).toEqual({
			span: "full",
			layout: "hero",
			tone: { kind: "preset", value: "warning" },
			border: undefined,
			errors: [],
		});
	});

	it("parses hex and rgba tones", () => {
		expect(parseVCardMarker("v-card {tone=#8c65e6}")?.tone).toEqual({
			kind: "color",
			value: "#8c65e6",
		});
		expect(parseVCardMarker("v-card {tone=rgba(0,0,0,0.4)}")?.tone).toEqual({
			kind: "color",
			value: "rgba(0,0,0,0.4)",
		});
	});

	it("parses border=none and aliases", () => {
		expect(parseVCardMarker("v-card {border=none}")?.border).toBe("none");
		expect(parseVCardMarker("v-card {border=0}")?.border).toBe("none");
		expect(parseVCardMarker("v-card {border=false}")?.border).toBe("none");
	});

	it("parses border with tone", () => {
		const parsed = parseVCardMarker("v-card {tone=#8c65e6} {border=none}");
		expect(parsed?.border).toBe("none");
		expect(parsed?.tone).toEqual({ kind: "color", value: "#8c65e6" });
		expect(parsed?.errors).toEqual([]);
	});

	it("records unknown keys and duplicates", () => {
		const unknown = parseVCardMarker("v-card {foo=bar}");
		expect(unknown?.errors.some((e) => e.includes("foo"))).toBe(true);
		const dup = parseVCardMarker("v-card {span=2} {span=3}");
		expect(dup?.span).toBe(2);
		expect(dup?.errors.some((e) => e.toLowerCase().includes("duplicate"))).toBe(true);
	});

	it("rejects invalid values", () => {
		expect(parseVCardMarker("v-card {span=9}")?.errors.length).toBeGreaterThan(0);
		expect(parseVCardMarker("v-card {layout=split}")?.errors.length).toBeGreaterThan(0);
		expect(parseVCardMarker("v-card {tone=purple}")?.errors.length).toBeGreaterThan(0);
		expect(parseVCardMarker("v-card {border=thick}")?.errors.length).toBeGreaterThan(0);
	});

	it("returns null for non-markers", () => {
		expect(parseVCardMarker("q=tags")).toBeNull();
	});
});
