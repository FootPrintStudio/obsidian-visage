export type SpanValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "full" | "fill";

export type LayoutValue = "hero" | "inline" | "footer";

export type BorderValue = "none";

export type TonePreset = "note" | "tip" | "warning" | "danger" | "success" | "neutral";

export type ToneValue =
	| { kind: "preset"; value: TonePreset }
	| { kind: "color"; value: string };

export interface ParsedVCard {
	span: SpanValue;
	/** Row span 1–8; omitted means 1. */
	rows?: number;
	layout?: LayoutValue;
	tone?: ToneValue;
	border?: BorderValue;
	errors: string[];
}

const TONE_PRESETS = new Set<TonePreset>([
	"note",
	"tip",
	"warning",
	"danger",
	"success",
	"neutral",
]);

const BAG_RE = /\{([^{}]*)\}/g;
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE =
	/^rgba?\(\s*[\d.%]+\s*,\s*[\d.%]+\s*,\s*[\d.%]+(?:\s*,\s*[\d.]+\s*)?\)$/i;

export function isVCardMarkerText(text: string): boolean {
	return /^v-card(?:\s|$)/.test(text.trim());
}

export function parseVCardMarker(raw: string): ParsedVCard | null {
	const text = raw.trim();
	if (!isVCardMarkerText(text)) return null;

	const rest = text.slice("v-card".length).trim();
	const errors: string[] = [];
	const seen = new Set<string>();
	let span: SpanValue = 1;
	let rows: number | undefined;
	let layout: LayoutValue | undefined;
	let tone: ToneValue | undefined;
	let border: BorderValue | undefined;

	if (!rest) {
		return { span, rows, layout, tone, border, errors };
	}

	let cursor = 0;
	BAG_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = BAG_RE.exec(rest)) !== null) {
		const between = rest.slice(cursor, match.index).trim();
		if (between) {
			errors.push(`Unexpected text “${between}”`);
		}
		cursor = match.index + match[0].length;
		const bag = (match[1] ?? "").trim();
		if (!bag) {
			errors.push("Empty attribute bag");
			continue;
		}
		const eq = bag.indexOf("=");
		if (eq < 1) {
			errors.push(`Invalid attribute “${bag}”`);
			continue;
		}
		const key = bag.slice(0, eq).trim().toLowerCase();
		const value = bag.slice(eq + 1).trim();
		if (seen.has(key)) {
			errors.push(`Duplicate “${key}” (only one of each key is allowed)`);
			continue;
		}
		seen.add(key);
		if (key === "span") {
			const parsed = parseSpan(value);
			if (parsed === null) errors.push(`Invalid span “${value}”`);
			else span = parsed;
		} else if (key === "rows") {
			const parsed = parseRows(value);
			if (parsed === null) errors.push(`Invalid rows “${value}”`);
			else rows = parsed;
		} else if (key === "layout") {
			const parsed = parseLayout(value);
			if (parsed === null) errors.push(`Invalid layout “${value}”`);
			else layout = parsed;
		} else if (key === "tone") {
			const parsed = parseTone(value);
			if (parsed === null) errors.push(`Invalid tone “${value}”`);
			else tone = parsed;
		} else if (key === "border") {
			const parsed = parseBorder(value);
			if (parsed === null) errors.push(`Invalid border “${value}”`);
			else border = parsed;
		} else {
			errors.push(`Unknown key “${key}”`);
		}
	}

	const trailing = rest.slice(cursor).trim();
	if (trailing) {
		errors.push(`Unexpected text “${trailing}”`);
	}

	return { span, rows, layout, tone, border, errors };
}

/**
 * Parse attribute bags from a string that may include leading title text.
 * Returns the title (text before bags) plus parsed key/value bags.
 */
export function parseAttributeBags(raw: string): {
	title: string;
	bags: Array<{ key: string; value: string }>;
	errors: string[];
} {
	const text = raw.trim();
	const errors: string[] = [];
	const bags: Array<{ key: string; value: string }> = [];
	const seen = new Set<string>();

	BAG_RE.lastIndex = 0;
	if (!BAG_RE.test(text)) {
		return { title: text, bags, errors };
	}

	let cursor = 0;
	BAG_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	let firstBagStart = -1;
	while ((match = BAG_RE.exec(text)) !== null) {
		if (firstBagStart === -1) firstBagStart = match.index;
		const between = text.slice(cursor, match.index).trim();
		if (cursor > 0 && between) {
			errors.push(`Unexpected text “${between}”`);
		}
		cursor = match.index + match[0].length;
		const bag = (match[1] ?? "").trim();
		if (!bag) {
			errors.push("Empty attribute bag");
			continue;
		}
		const eq = bag.indexOf("=");
		if (eq < 1) {
			errors.push(`Invalid attribute “${bag}”`);
			continue;
		}
		const key = bag.slice(0, eq).trim().toLowerCase();
		const value = bag.slice(eq + 1).trim();
		if (seen.has(key)) {
			errors.push(`Duplicate “${key}” (only one of each key is allowed)`);
			continue;
		}
		seen.add(key);
		bags.push({ key, value });
	}

	const trailing = text.slice(cursor).trim();
	if (trailing) {
		errors.push(`Unexpected text “${trailing}”`);
	}

	const title =
		firstBagStart === -1 ? text : text.slice(0, firstBagStart).trim();
	return { title, bags, errors };
}

function parseSpan(value: string): SpanValue | null {
	const v = value.toLowerCase();
	if (v === "full" || v === "fill") return v;
	if (/^[2-7]$/.test(v)) return Number(v) as SpanValue;
	if (v === "1") return 1;
	return null;
}

/** Integer 1–8 inclusive. */
function parseRows(value: string): number | null {
	const v = value.trim();
	if (!/^[1-8]$/.test(v)) return null;
	return Number(v);
}

function parseLayout(value: string): LayoutValue | null {
	const v = value.toLowerCase();
	if (v === "hero" || v === "inline" || v === "footer") return v;
	return null;
}

function parseBorder(value: string): BorderValue | null {
	const v = value.trim().toLowerCase();
	if (v === "none" || v === "0" || v === "false") return "none";
	return null;
}

export function parseTone(value: string): ToneValue | null {
	const v = value.trim();
	const lower = v.toLowerCase();
	if (TONE_PRESETS.has(lower as TonePreset)) {
		return { kind: "preset", value: lower as TonePreset };
	}
	if (HEX_RE.test(v) || RGB_RE.test(v)) {
		return { kind: "color", value: v };
	}
	return null;
}

/** Apply tone preset class or custom --deck-tone colour to an element. */
export function applyTone(el: HTMLElement, tone: ToneValue | undefined): void {
	if (!tone) return;
	if (tone.kind === "preset") {
		el.classList.add(`visage-tone-${tone.value}`);
		return;
	}
	el.classList.add("visage-tone-color");
	el.style.setProperty("--deck-tone", tone.value);
}
