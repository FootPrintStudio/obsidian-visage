import { assignFillSpans, DECK_COLUMNS } from "./fillSpans";
import { applyTone, isVCardMarkerText, parseVCardMarker, type SpanValue } from "./parseMarker";
import { promoteSameLineHeading } from "./promoteHeading";
import type { VisageSettings } from "./types";

const CHROME = new Set(["list-bullet", "list-collapse-indicator", "collapse-indicator"]);

export function processVisage(root: HTMLElement, settings?: VisageSettings): void {
	applySettingsVars(root, settings);

	const listItems = root.querySelectorAll("ul > li");
	for (const li of listItems) {
		if (!(li instanceof HTMLElement)) continue;
		if (li.closest("pre")) continue;
		processListItem(li);
	}

	const lists = root.querySelectorAll("ul");
	for (const ul of lists) {
		if (!(ul instanceof HTMLElement)) continue;
		if (ul.closest("pre")) continue;
		layoutList(ul);
	}
}

function applySettingsVars(root: HTMLElement, settings?: VisageSettings): void {
	if (!settings) return;
	const preview = root.closest(".markdown-preview-view") ?? root;
	if (!(preview instanceof HTMLElement)) return;
	preview.style.setProperty("--deck-gap", settings.deckGap);
	preview.style.setProperty("--deck-padding", settings.deckPadding);
	preview.style.setProperty("--deck-image-height", settings.deckImageHeight);
}

function processListItem(li: HTMLElement): void {
	if (li.classList.contains("visage-processed")) return;

	const marker = findLeadingMarker(li);
	if (!marker) return;

	const parsed = parseVCardMarker(marker.textContent ?? "");
	if (!parsed) return;

	li.classList.add("visage-processed", "visage-card");
	const insideCard = Boolean(li.parentElement?.closest(".visage-card"));
	if (insideCard) li.classList.add("visage-subcard");

	marker.classList.add("visage-marker");
	marker.setAttribute("aria-hidden", "true");

	li.dataset.visageSpan = String(parsed.span);
	if (!insideCard && parsed.rows != null && parsed.rows > 1) {
		li.dataset.visageRows = String(parsed.rows);
	} else {
		delete li.dataset.visageRows;
	}
	applyLayout(li, parsed.layout, insideCard);
	applyTone(li, parsed.tone);
	if (parsed.border === "none") li.classList.add("visage-borderless");

	if (parsed.errors.length > 0) {
		li.classList.add("visage-has-error");
		li.setAttribute("title", parsed.errors.join(" · "));
		const badge = document.createElement("span");
		badge.className = "visage-error";
		badge.textContent = parsed.errors[0] ?? "Invalid v-card";
		marker.after(badge);
	}

	promoteSameLineHeading(marker);
}

function applyLayout(
	li: HTMLElement,
	layout: "hero" | "inline" | "footer" | undefined,
	isSubcard: boolean,
): void {
	if (!layout) return;
	if (layout === "hero") {
		li.classList.add("visage-hero");
		return;
	}
	if (!isSubcard) return;
	if (layout === "inline") li.classList.add("visage-inline");
	if (layout === "footer") li.classList.add("visage-footer");
}

function layoutList(ul: HTMLElement): void {
	const insideCard = Boolean(ul.closest(".visage-card"));
	const directCards = Array.from(ul.children).filter(
		(el): el is HTMLElement =>
			el instanceof HTMLElement &&
			el.tagName === "LI" &&
			el.classList.contains("visage-card"),
	);

	if (!insideCard && directCards.length > 0) {
		ul.classList.add("visage-deck");
		layoutDeck(ul);
		return;
	}

	if (insideCard) layoutNested(ul);
}

function layoutDeck(ul: HTMLElement): void {
	for (const br of Array.from(ul.querySelectorAll(":scope > .visage-flex-break"))) {
		br.remove();
	}

	const items: { id: HTMLElement; span: SpanValue }[] = [];
	let mosaic = false;

	for (const child of Array.from(ul.children)) {
		if (!(child instanceof HTMLElement) || child.tagName !== "LI") continue;
		if (child.classList.contains("visage-flex-break")) continue;
		if (child.classList.contains("visage-card") && !child.classList.contains("visage-subcard")) {
			child.style.gridColumn = "";
			const rows = Number(child.dataset.visageRows ?? "1");
			if (rows > 1) mosaic = true;
			items.push({ id: child, span: readSpan(child) });
		} else {
			if (items.length > 0) {
				applyAssignments(assignFillSpans(items));
				items.length = 0;
			}
			child.classList.add("visage-plain-row");
			child.style.gridColumn = "";
		}
	}

	if (items.length > 0) applyAssignments(assignFillSpans(items));

	ul.classList.toggle("visage-deck-mosaic", mosaic);
}

function layoutNested(ul: HTMLElement): void {
	const items = Array.from(ul.children).filter(
		(el): el is HTMLElement => el instanceof HTMLElement && el.tagName === "LI",
	);
	if (items.length === 0) return;

	if (items.some((li) => li.classList.contains("visage-inline"))) {
		ul.classList.add("visage-inline-host");
	}

	let tailStart = items.length;
	while (tailStart > 0 && items[tailStart - 1]!.classList.contains("visage-footer")) {
		tailStart--;
	}
	const strayFooter = items.slice(0, tailStart).some((li) => li.classList.contains("visage-footer"));
	if (strayFooter) {
		for (const li of items) li.classList.remove("visage-footer");
		return;
	}
	if (tailStart < items.length) {
		ul.classList.add("visage-footer-host");
		const parent = ul.closest(".visage-card");
		if (parent instanceof HTMLElement) {
			parent.classList.add("visage-has-footer");
			ensureCardBody(parent);
		}
		items[tailStart]!.classList.add("visage-footer-first");
		for (let i = tailStart; i < items.length; i++) {
			items[i]!.classList.add("visage-footer-tail");
		}
	}
}

/**
 * Column flex on cards with footers would put every element child (including
 * Grimoire/Dataview inline results) on its own row. Wrap non-footer content
 * into one body flex item so inlines stay inline.
 */
function ensureCardBody(card: HTMLElement): void {
	if (Array.from(card.children).some((el) => el.classList.contains("visage-card-body"))) {
		return;
	}

	const body = document.createElement("div");
	body.className = "visage-card-body";

	for (const child of Array.from(card.childNodes)) {
		if (child instanceof HTMLElement) {
			if (isChrome(child)) continue;
			if (child.classList.contains("visage-marker")) continue;
			if (child.classList.contains("visage-error")) continue;
			if (child.tagName === "UL" && child.classList.contains("visage-footer-host")) continue;
		}
		body.appendChild(child);
	}

	if (body.childNodes.length === 0) return;

	const footerHost = card.querySelector(":scope > ul.visage-footer-host");
	if (footerHost) card.insertBefore(body, footerHost);
	else card.appendChild(body);
}

function applyAssignments(assigned: { id: HTMLElement; columns: number }[]): void {
	for (const item of assigned) {
		const n = Math.min(DECK_COLUMNS, Math.max(1, item.columns));
		item.id.dataset.visageCols = String(n);
		item.id.style.gridColumn = `span ${n}`;
	}
}

function readSpan(li: HTMLElement): SpanValue {
	const raw = li.dataset.visageSpan ?? "1";
	if (raw === "full" || raw === "fill") return raw;
	const n = Number(raw);
	if (n >= 1 && n <= 7) return n as SpanValue;
	return 1;
}

function findLeadingMarker(li: HTMLElement): HTMLElement | null {
	return findIn(li);
}

function findIn(root: HTMLElement): HTMLElement | null {
	for (const child of Array.from(root.childNodes)) {
		if (child instanceof Text) {
			if ((child.textContent ?? "").trim()) return null;
			continue;
		}
		if (!(child instanceof HTMLElement)) continue;
		if (isChrome(child)) continue;
		if (child.tagName === "CODE") {
			return isVCardMarkerText(child.textContent ?? "") ? child : null;
		}
		if (child.tagName === "P" || child.tagName === "DIV" || child.tagName === "SPAN") {
			if (child.classList.contains("internal-embed") || child.classList.contains("image-embed")) {
				return null;
			}
			return findIn(child);
		}
		if (child.tagName === "UL" || child.tagName === "OL" || child.tagName === "PRE") {
			return null;
		}
		return null;
	}
	return null;
}

function isChrome(el: HTMLElement): boolean {
	for (const cls of CHROME) {
		if (el.classList.contains(cls)) return true;
	}
	return false;
}
