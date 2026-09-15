import { describe, expect, it } from "vitest";
import { formatVTabsBlock, formatVTabsTemplate, parseVTabsBlock } from "../src/tabs/parseBlock";
import { DEFAULT_SETTINGS } from "../src/types";

describe("parseVTabsBlock", () => {
	it("parses POSITION, ALIGN, and TAB bodies", () => {
		const parsed = parseVTabsBlock(
			[
				"POSITION: left",
				"ALIGN: center",
				"",
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

	it("uses settings defaults when POSITION and ALIGN are omitted", () => {
		const parsed = parseVTabsBlock("TAB: Overview\nHello", DEFAULT_SETTINGS);
		expect(parsed.errors).toEqual([]);
		expect(parsed.position).toBe(DEFAULT_SETTINGS.defaultPosition);
		expect(parsed.align).toBe(DEFAULT_SETTINGS.defaultAlign);
		expect(parsed.tabs).toHaveLength(1);
	});

	it("rejects retired OPTIONS and TABS headers", () => {
		const parsed = parseVTabsBlock(
			["OPTIONS:", "POSITION: top", "TABS:", "TAB: Overview", "Hello"].join("\n"),
			DEFAULT_SETTINGS,
		);
		expect(parsed.errors.some((error) => /OPTIONS:/.test(error.message))).toBe(true);
		expect(parsed.errors.some((error) => /TABS:/.test(error.message))).toBe(true);
	});

	it("requires POSITION and ALIGN before TAB entries", () => {
		const parsed = parseVTabsBlock(["TAB:", "POSITION: left"].join("\n"), DEFAULT_SETTINGS);
		expect(parsed.errors.some((error) => /TAB requires a title/.test(error.message))).toBe(true);
		expect(parsed.errors.some((error) => /POSITION must appear before TAB entries/.test(error.message))).toBe(true);
	});

	it("requires at least one TAB entry", () => {
		const parsed = parseVTabsBlock("POSITION: top", DEFAULT_SETTINGS);
		expect(parsed.errors.some((error) => /at least one TAB entry/.test(error.message))).toBe(true);
	});

	it("parses TAB tone presets and strips bags from title", () => {
		const parsed = parseVTabsBlock(
			["TAB: Overview {tone=warning}", "Hello", "", "TAB: Details {tone=#8c65e6}", "World"].join(
				"\n",
			),
			DEFAULT_SETTINGS,
		);
		expect(parsed.errors).toEqual([]);
		expect(parsed.tabs[0]?.title).toBe("Overview");
		expect(parsed.tabs[0]?.tone).toEqual({ kind: "preset", value: "warning" });
		expect(parsed.tabs[1]?.title).toBe("Details");
		expect(parsed.tabs[1]?.tone).toEqual({ kind: "color", value: "#8c65e6" });
	});

	it("records invalid TAB tone as an error", () => {
		const parsed = parseVTabsBlock("TAB: Overview {tone=purple}\nHi", DEFAULT_SETTINGS);
		expect(parsed.errors.some((error) => /Invalid tone/.test(error.message))).toBe(true);
		expect(parsed.tabs[0]?.title).toBe("Overview");
	});

	it("formats a v-tabs fence", () => {
		expect(formatVTabsBlock("TAB: One\nHi", 4)).toBe("````v-tabs\nTAB: One\nHi\n````");
	});

	it("formats an insert template without OPTIONS or TABS", () => {
		const template = formatVTabsTemplate(DEFAULT_SETTINGS);
		expect(template).toBe(
			[
				`POSITION: ${DEFAULT_SETTINGS.defaultPosition}`,
				`ALIGN: ${DEFAULT_SETTINGS.defaultAlign}`,
				"",
				`TAB: ${DEFAULT_SETTINGS.defaultTabTitle1}`,
				"Content here.",
				"",
				`TAB: ${DEFAULT_SETTINGS.defaultTabTitle2}`,
				"Content here.",
			].join("\n"),
		);
		expect(template.includes("OPTIONS:")).toBe(false);
		expect(template.includes("TABS:")).toBe(false);
	});
});
