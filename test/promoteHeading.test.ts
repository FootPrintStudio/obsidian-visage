import { describe, expect, it } from "vitest";
import { parseAtxPrefix } from "../src/promoteHeading";

describe("parseAtxPrefix", () => {
	it("parses heading levels 1–6", () => {
		expect(parseAtxPrefix("# Heading")).toEqual({ level: 1, title: "Heading", rest: "" });
		expect(parseAtxPrefix("## Section title")).toEqual({
			level: 2,
			title: "Section title",
			rest: "",
		});
		expect(parseAtxPrefix("###### Tiny")).toEqual({ level: 6, title: "Tiny", rest: "" });
	});

	it("allows a leading space leftover after the marker", () => {
		expect(parseAtxPrefix(" # Heading")?.title).toBe("Heading");
	});

	it("rejects a missing space after hashes", () => {
		expect(parseAtxPrefix("#Heading")).toBeNull();
	});
});
