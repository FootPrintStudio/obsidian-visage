const OPEN_PATTERN = /^(`+|~+)v-tabs\s*$/i;

/** Sync extraction when full file text is already available. */
export function extractVTabsSourceAtLine(fileContent: string, lineStart: number): string | null {
	const lines = fileContent.split("\n");
	const openLine = lines[lineStart]?.trim() ?? "";
	const openMatch = openLine.match(OPEN_PATTERN);
	if (!openMatch) return null;

	const fenceChar = openMatch[1]![0]!;
	const fenceLen = openMatch[1]!.length;
	const closeLine = `${fenceChar.repeat(fenceLen)}`;

	for (let i = lineStart + 1; i < lines.length; i++) {
		if (lines[i]?.trim() === closeLine) {
			return lines.slice(lineStart + 1, i).join("\n");
		}
	}

	return null;
}

export interface VTabsBlockRange {
	lineStart: number;
	lineEnd: number;
	source: string;
}

/** Find all v-tabs blocks in a note (for deep-link resolution). */
export function findVTabsBlocksInFile(fileContent: string): VTabsBlockRange[] {
	const lines = fileContent.split("\n");
	const blocks: VTabsBlockRange[] = [];

	for (let i = 0; i < lines.length; i++) {
		const openMatch = lines[i]?.trim().match(OPEN_PATTERN);
		if (!openMatch) continue;

		const fenceChar = openMatch[1]![0]!;
		const fenceLen = openMatch[1]!.length;
		const closeLine = `${fenceChar.repeat(fenceLen)}`;

		for (let j = i + 1; j < lines.length; j++) {
			if (lines[j]?.trim() !== closeLine) continue;
			blocks.push({
				lineStart: i,
				lineEnd: j,
				source: lines.slice(i + 1, j).join("\n"),
			});
			i = j;
			break;
		}
	}

	return blocks;
}
