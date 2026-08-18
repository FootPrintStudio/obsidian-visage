import type { ParseError, ParsedTab, ParsedVTabsBlock, TabAlign, TabPosition, VTabsSettings } from "./types";
import { TAB_ALIGNS, TAB_POSITIONS } from "./types";

type Section = "none" | "options" | "tabs";

function normalizeLine(raw: string): string {
	let line = raw.trim();
	if (line.startsWith("- ")) line = line.slice(2).trim();
	return line;
}

function normalizeAlign(value: string): TabAlign | null {
	const lower = value.trim().toLowerCase();
	if (lower === "centre") return "center";
	if (TAB_ALIGNS.includes(lower as TabAlign)) return lower as TabAlign;
	return null;
}

function parsePosition(value: string, line: number, errors: ParseError[]): TabPosition | null {
	const normalized = value.trim().toLowerCase() as TabPosition;
	if (!TAB_POSITIONS.includes(normalized)) {
		errors.push({
			line,
			message: `Unknown POSITION "${value}". Use one of: ${TAB_POSITIONS.join(", ")}`,
		});
		return null;
	}
	return normalized;
}

function parseAlign(value: string, line: number, errors: ParseError[]): TabAlign | null {
	const normalized = normalizeAlign(value);
	if (!normalized) {
		errors.push({
			line,
			message: `Unknown ALIGN "${value}". Use one of: left, right, center, centre, justify`,
		});
		return null;
	}
	return normalized;
}

function trimTrailingBlankLines(lines: string[]): string[] {
	const result = [...lines];
	while (result.length > 0 && result[result.length - 1]?.trim() === "") {
		result.pop();
	}
	return result;
}

function slugifyTitle(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "");
}

/** Returns tab title when line is a TAB: directive, otherwise null. */
function parseTabDirective(line: string): string | null {
	const match = line.match(/^TAB\s*:(.*)$/i);
	return match ? match[1]!.trim() : null;
}

export function parseVTabsBlock(source: string, settings: VTabsSettings): ParsedVTabsBlock {
	const errors: ParseError[] = [];
	let position: TabPosition = settings.defaultPosition;
	let align: TabAlign = settings.defaultAlign;
	let section: Section = "none";
	let sawPosition = false;
	let sawAlign = false;
	const tabs: ParsedTab[] = [];

	let currentTitle: string | null = null;
	let currentBodyLines: string[] = [];
	let currentTabLine = 0;

	const flushTab = (): void => {
		if (currentTitle === null) return;
		const bodyLines = trimTrailingBlankLines(currentBodyLines);
		tabs.push({
			title: currentTitle,
			body: bodyLines.join("\n"),
			line: currentTabLine,
			linkSlug: slugifyTitle(currentTitle),
		});
		currentTitle = null;
		currentBodyLines = [];
	};

	const lines = source.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i] ?? "";
		const lineNum = i + 1;

		if (section === "tabs" && currentTitle !== null) {
			const tabTitle = parseTabDirective(normalizeLine(rawLine));
			if (tabTitle === null) {
				currentBodyLines.push(rawLine);
				continue;
			}
			flushTab();
			if (!tabTitle) {
				errors.push({ line: lineNum, message: "TAB requires a title." });
				continue;
			}
			currentTitle = tabTitle;
			currentTabLine = lineNum;
			continue;
		}

		const line = normalizeLine(rawLine);
		if (!line || line.startsWith("#")) continue;

		if (/^OPTIONS:$/i.test(line)) {
			flushTab();
			section = "options";
			continue;
		}
		if (/^TABS:$/i.test(line)) {
			flushTab();
			section = "tabs";
			continue;
		}

		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) {
			errors.push({ line: lineNum, message: `Unrecognized line: "${line}"` });
			continue;
		}

		const key = line.slice(0, colonIndex).trim().toUpperCase();
		const value = line.slice(colonIndex + 1).trim();

		if (key === "TAB") {
			section = "tabs";
			flushTab();
			if (!value) {
				errors.push({ line: lineNum, message: "TAB requires a title." });
				continue;
			}
			currentTitle = value;
			currentTabLine = lineNum;
			continue;
		}

		if (key === "POSITION" || key === "ALIGN") {
			if (section === "tabs") {
				errors.push({
					line: lineNum,
					message: `${key} must appear in OPTIONS (before TAB entries).`,
				});
				continue;
			}
			section = section === "none" ? "options" : section;
		}

		if (section === "options" || (section === "none" && (key === "POSITION" || key === "ALIGN"))) {
			if (key === "POSITION") {
				const parsed = parsePosition(value, lineNum, errors);
				if (parsed) {
					if (sawPosition) errors.push({ line: lineNum, message: "Duplicate POSITION option." });
					else {
						position = parsed;
						sawPosition = true;
					}
				}
			} else if (key === "ALIGN") {
				const parsed = parseAlign(value, lineNum, errors);
				if (parsed) {
					if (sawAlign) errors.push({ line: lineNum, message: "Duplicate ALIGN option." });
					else {
						align = parsed;
						sawAlign = true;
					}
				}
			} else {
				errors.push({ line: lineNum, message: `Unknown option "${key}". Use POSITION or ALIGN.` });
			}
			continue;
		}

		errors.push({ line: lineNum, message: `Expected TAB: in TABS section (got ${key}).` });
	}

	flushTab();

	if (tabs.length === 0 && errors.length === 0) {
		errors.push({ line: 1, message: "TABS section requires at least one TAB entry." });
	}

	return { position, align, tabs, errors };
}

export function formatVTabsTemplate(settings: VTabsSettings): string {
	const lines = [
		"OPTIONS:",
		`POSITION: ${settings.defaultPosition}`,
		`ALIGN: ${settings.defaultAlign}`,
		"TABS:",
		`TAB: ${settings.defaultTabTitle1}`,
		"Content here.",
		"",
		`TAB: ${settings.defaultTabTitle2}`,
		"Content here.",
	];
	return lines.join("\n");
}

export function formatVTabsBlock(source: string, fenceLength = 4): string {
	const fence = "`".repeat(fenceLength);
	return `${fence}v-tabs\n${source}\n${fence}`;
}

/** Longest markdown fence marker at line start inside tab bodies. */
export function maxInnerFenceLength(source: string): number {
	let max = 0;
	for (const line of source.split("\n")) {
		const match = line.match(/^(`+|~+)(?:\s|\S)/);
		if (match) max = Math.max(max, match[1]!.length);
	}
	return max;
}

export function validateOuterFence(openFenceLength: number, source: string): string | null {
	const innerMax = maxInnerFenceLength(source);
	if (innerMax >= openFenceLength) {
		const needed = innerMax + 1;
		return `Nested code fences need a longer outer fence. Use ${needed} backticks on the opening and closing lines (inner fences use at most ${innerMax}).`;
	}
	return null;
}

export function openFenceLengthAtLine(fileContent: string, lineStart: number): number | null {
	const lines = fileContent.split("\n");
	const openMatch = lines[lineStart]?.trim().match(/^(`+|~+)v-tabs\s*$/i);
	return openMatch ? openMatch[1]!.length : null;
}
