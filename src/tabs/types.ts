export type TabPosition = "top" | "bottom" | "left" | "right";

export type TabAlign = "left" | "right" | "center" | "justify";

export const TAB_POSITIONS: TabPosition[] = ["top", "bottom", "left", "right"];

export const TAB_ALIGNS: TabAlign[] = ["left", "right", "center", "justify"];

export interface ParseError {
	line: number;
	message: string;
}

export interface ParsedTab {
	title: string;
	body: string;
	line: number;
	linkSlug: string;
}

export interface ParsedVTabsBlock {
	position: TabPosition;
	align: TabAlign;
	tabs: ParsedTab[];
	errors: ParseError[];
}

export interface VTabsSettings {
	defaultPosition: TabPosition;
	defaultAlign: TabAlign;
	rememberActiveTab: boolean;
	defaultTabTitle1: string;
	defaultTabTitle2: string;
}
