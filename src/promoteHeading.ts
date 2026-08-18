export interface AtxHeading {
	level: 1 | 2 | 3 | 4 | 5 | 6;
	title: string;
	rest: string;
}

/** Parse a same-line ATX heading leftover after the `v-card` marker is hidden. */
export function parseAtxPrefix(text: string): AtxHeading | null {
	const m = text.match(/^(\s*)(#{1,6})[ \t]+([^\n]+)(\n[\s\S]*)?$/);
	if (!m) return null;
	const hashes = m[2]!;
	const title = m[3]!.replace(/[ \t]+#+\s*$/, "").trim();
	if (!title) return null;
	return {
		level: hashes.length as AtxHeading["level"],
		title,
		rest: m[4] ?? "",
	};
}

const CHROME = new Set(["list-bullet", "list-collapse-indicator", "collapse-indicator"]);

function isChrome(el: HTMLElement): boolean {
	for (const cls of CHROME) {
		if (el.classList.contains(cls)) return true;
	}
	return false;
}

function isIgnorable(node: Node): boolean {
	if (node instanceof Text) return (node.textContent ?? "").trim() === "";
	if (node instanceof HTMLElement) {
		if (isChrome(node)) return true;
		if (node.classList.contains("visage-marker")) return true;
		if (node.tagName === "BR") return true;
	}
	return false;
}

/**
 * After the marker `code` is hidden, promote leftover `# Heading` text on the
 * same line to h1–h6 with Obsidian heading classes.
 */
export function promoteSameLineHeading(marker: HTMLElement): void {
	const parent = marker.parentElement;
	if (!parent) return;

	let node: ChildNode | null = marker.nextSibling;
	while (node && isIgnorable(node)) node = node.nextSibling;
	if (!node) return;

	if (node instanceof HTMLElement && /^H[1-6]$/.test(node.tagName)) return;

	if (!(node instanceof Text)) return;

	const parsed = parseAtxPrefix(node.textContent ?? "");
	if (!parsed) return;

	const heading = document.createElement(`h${parsed.level}`);
	heading.className = "heading";
	heading.setAttribute("data-heading", parsed.title);
	heading.textContent = parsed.title;
	node.parentNode?.insertBefore(heading, node);

	if (parsed.rest) node.textContent = parsed.rest;
	else node.remove();

	unwrapIfOnlyHeading(parent);
}

function unwrapIfOnlyHeading(container: HTMLElement): void {
	if (container.tagName !== "P") return;
	const parent = container.parentElement;
	if (!parent) return;

	const meaningful = Array.from(container.childNodes).filter((n) => !isIgnorable(n));
	if (meaningful.length !== 1) return;
	const only = meaningful[0];
	if (!(only instanceof HTMLElement) || !/^H[1-6]$/.test(only.tagName)) return;

	while (container.firstChild) {
		parent.insertBefore(container.firstChild, container);
	}
	container.remove();
}
