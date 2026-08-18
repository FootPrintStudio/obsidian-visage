export type SpanValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "full" | "fill";

export type LayoutValue = "hero" | "inline" | "footer";

export type TonePreset = "note" | "tip" | "warning" | "danger" | "success" | "neutral";

export type ToneValue =
	| { kind: "preset"; value: TonePreset }
	| { kind: "color"; value: string };

export interface ParsedVCard {
	span: SpanValue;
	layout?: LayoutValue;
	tone?: ToneValue;
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
	let layout: LayoutValue | undefined;
	let tone: ToneValue | undefined;

	if (!rest) {
		return { span, errors };
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
		} else if (key === "layout") {
			const parsed = parseLayout(value);
			if (parsed === null) errors.push(`Invalid layout “${value}”`);
			else layout = parsed;
		} else if (key === "tone") {
			const parsed = parseTone(value);
			if (parsed === null) errors.push(`Invalid tone “${value}”`);
			else tone = parsed;
		} else {
			errors.push(`Unknown key “${key}”`);
		}
	}

	const trailing = rest.slice(cursor).trim();
	if (trailing) {
		errors.push(`Unexpected text “${trailing}”`);
	}

	return { span, layout, tone, errors };
}

function parseSpan(value: string): SpanValue | null {
	const v = value.toLowerCase();
	if (v === "full" || v === "fill") return v;
	if (/^[2-7]$/.test(v)) return Number(v) as SpanValue;
	if (v === "1") return 1;
	return null;
}

function parseLayout(value: string): LayoutValue | null {
	const v = value.toLowerCase();
	if (v === "hero" || v === "inline" || v === "footer") return v;
	return null;
}

function parseTone(value: string): ToneValue | null {
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
