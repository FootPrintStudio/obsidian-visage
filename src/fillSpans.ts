import type { SpanValue } from "./parseMarker";

/** Authoring slots per row (`{span=2}` … `{span=7}`, wrap-at-8). */
export const DECK_SLOTS = 8;

/** CSS grid tracks per authoring slot — finer grid so odd card counts share width evenly. */
export const TRACKS_PER_SLOT = 3;

/** Total CSS grid columns (`DECK_SLOTS * TRACKS_PER_SLOT`). */
export const DECK_COLUMNS = DECK_SLOTS * TRACKS_PER_SLOT;

export interface SpanItem<T = unknown> {
	id: T;
	span: SpanValue;
}

export interface AssignedSpan<T = unknown> {
	id: T;
	/** Grid column span (1–DECK_COLUMNS) after packing default/`fill` growers. */
	columns: number;
}

/**
 * Pack items into rows of at most 8 authoring slots and assign integer grid tracks.
 *
 * Wrap rules (unchanged from flex era):
 * - Default and `fill` each count as 1 slot toward wrap-at-8
 * - `2`–`7`: that many slots; wrap when they would exceed 8
 * - `full`: owns a row
 * - `fill` closes the current row for later literals; consecutive fills stay together
 *
 * Within each row, leftover **tracks** after literal `2`–`7` are distributed among
 * default/`fill` growers. Literal N occupies `N * TRACKS_PER_SLOT` tracks.
 */
export function assignFillSpans<T>(
	items: SpanItem<T>[],
	slots = DECK_SLOTS,
	tracksPerSlot = TRACKS_PER_SLOT,
): AssignedSpan<T>[] {
	const tracks = slots * tracksPerSlot;
	const rows: SpanItem<T>[][] = [];
	let current: SpanItem<T>[] = [];
	let used = 0;
	let rowHasFill = false;
	let needBreak = false;

	const pushRow = (): void => {
		if (current.length === 0) return;
		rows.push(current);
		current = [];
		used = 0;
		rowHasFill = false;
		needBreak = false;
	};

	for (const item of items) {
		const span = item.span;

		if (span === "full") {
			pushRow();
			rows.push([item]);
			needBreak = true;
			continue;
		}

		if (span === "fill") {
			if (needBreak || used >= slots) pushRow();
			current.push(item);
			used += 1;
			rowHasFill = true;
			if (used >= slots) {
				needBreak = true;
				used = 0;
				rowHasFill = false;
			}
			continue;
		}

		const n = spanToSlots(span);
		if (needBreak || rowHasFill || used + n > slots) pushRow();
		current.push(item);
		used += n;
		if (used >= slots) {
			needBreak = true;
			used = 0;
			rowHasFill = false;
		}
	}
	pushRow();

	const out: AssignedSpan<T>[] = [];
	for (const row of rows) {
		const cols = assignRowColumns(row, tracks, tracksPerSlot);
		for (let i = 0; i < row.length; i++) {
			out.push({ id: row[i]!.id, columns: cols[i]! });
		}
	}
	return out;
}

function assignRowColumns<T>(
	row: SpanItem<T>[],
	tracks: number,
	tracksPerSlot: number,
): number[] {
	if (row.length === 1 && row[0]!.span === "full") return [tracks];

	const result = new Array<number>(row.length).fill(0);
	const growIdx: number[] = [];
	let fixed = 0;

	for (let i = 0; i < row.length; i++) {
		const span = row[i]!.span;
		if (span === "full") {
			result[i] = tracks;
			continue;
		}
		if (typeof span === "number" && span >= 2) {
			const n = span * tracksPerSlot;
			result[i] = n;
			fixed += n;
			continue;
		}
		// default (1) or fill — grow into leftover
		growIdx.push(i);
	}

	if (growIdx.length === 0) return result;

	const leftover = Math.max(0, tracks - fixed);
	const base = Math.floor(leftover / growIdx.length);
	let rem = leftover % growIdx.length;
	for (const i of growIdx) {
		const n = Math.max(1, base + (rem > 0 ? 1 : 0));
		if (rem > 0) rem--;
		result[i] = n;
	}
	return result;
}

function spanToSlots(span: SpanValue): number {
	if (span === "full") return DECK_SLOTS;
	if (span === "fill") return 1;
	return span;
}
