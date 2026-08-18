import type { SpanValue } from "./parseMarker";

export const DECK_COLUMNS = 8;

export interface SpanItem<T = unknown> {
	id: T;
	span: SpanValue;
}

export interface AssignedSpan<T = unknown> {
	id: T;
	/** Insert a flex row-break before this item. */
	rowStart: boolean;
}

/**
 * Pack items into rows of at most 8 slots.
 *
 * Width is CSS flex (default/`fill` grow equally; `2`–`7` are a fixed fraction of 8;
 * `full` is 100%). This function only decides where rows wrap:
 *
 * - Default and `fill` each count as 1 slot toward wrap-at-8
 * - `2`–`7`: that many slots; wrap when they would exceed 8
 * - `full`: owns a row
 * - `fill` closes the current row for later literals; consecutive fills stay together
 */
export function assignFillSpans<T>(items: SpanItem<T>[], columns = DECK_COLUMNS): AssignedSpan<T>[] {
	const out: AssignedSpan<T>[] = items.map((item) => ({ id: item.id, rowStart: false }));

	let used = 0;
	let rowHasFill = false;
	let needBreak = false;

	const beginRow = (index: number): void => {
		if (index > 0) out[index]!.rowStart = true;
		used = 0;
		rowHasFill = false;
		needBreak = false;
	};

	for (let i = 0; i < items.length; i++) {
		const span = items[i]!.span;

		if (span === "full") {
			if (i > 0) out[i]!.rowStart = true;
			used = 0;
			rowHasFill = false;
			needBreak = true;
			continue;
		}

		if (span === "fill") {
			if (needBreak || used >= columns) beginRow(i);
			used += 1;
			rowHasFill = true;
			if (used >= columns) {
				needBreak = true;
				used = 0;
				rowHasFill = false;
			}
			continue;
		}

		const n = spanToTracks(span, columns);
		if (needBreak || rowHasFill || used + n > columns) beginRow(i);
		used += n;
		if (used >= columns) {
			needBreak = true;
			used = 0;
			rowHasFill = false;
		}
	}

	return out;
}

function spanToTracks(span: SpanValue, columns: number): number {
	if (span === "full") return columns;
	if (span === "fill") return 1;
	return span;
}
