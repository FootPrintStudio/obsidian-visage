import { describe, expect, it } from "vitest";
import { formatVTabsBlock, parseVTabsBlock } from "../src/tabs/parseBlock";
import { DEFAULT_SETTINGS } from "../src/types";

describe("parseVTabsBlock", () => {
	it("parses OPTIONS and TAB bodies", () => {
		const parsed = parseVTabsBlock(
			[
				"OPTIONS:",
				"POSITION: left",
				"ALIGN: center",
				"TABS:",
				"TAB: Overview",
				"Hello",
				"",
				"TAB: Details",
				"World",
			].join("\n"),
			DEFAULT_SETTINGS,
		);
		expect(parsed.errors).toEqual([]);
		expect(parsed.position).toBe("left");
		expect(parsed.align).toBe("center");
		expect(parsed.tabs.map((t) => t.title)).toEqual(["Overview", "Details"]);
		expect(parsed.tabs[0]?.body).toBe("Hello");
	});

	it("formats a v-tabs fence", () => {
		expect(formatVTabsBlock("TAB: One\nHi", 4)).toBe("````v-tabs\nTAB: One\nHi\n````");
	});
});
