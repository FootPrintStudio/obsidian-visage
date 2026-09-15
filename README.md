# Visage

FootPrintStudio plugin for [Obsidian](https://obsidian.md): Reading-view **cards** and **tabs** for note layout.

- **Cards** — mark a list item with a leading `` `v-card` ``. The rest stays normal markdown (spell-check, nested fences, wikilinks, images, headings, Grimoire `` `q=` ``).
- **Tabs** — a `` v-tabs `` fence with optional `POSITION` / `ALIGN` and `TAB:` entries. Tab bodies can contain `` `v-card` `` lists.

```markdown
- `v-card` ## Word Processing
	- Normal nested list
	- `v-card` Subcard
```

`````
````v-tabs
POSITION: top
ALIGN: left

TAB: Overview
Markdown for tab 1.

TAB: Details
- `v-card` A card inside a tab
````
`````

A top-level list becomes a card deck (wraps at 8 slots) when it has at least one `v-card` child. Default cards on a short row share the width equally.

## Install (BRAT)

Not in the Obsidian Community Plugins catalog. Install via [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. Enable **BRAT** in Community Plugins.
2. **Add Beta plugin** → `FootPrintStudio/obsidian-visage`
3. Enable **Visage** and reload Obsidian. **Disable Content Tabs** if it is still enabled — tabs now live in Visage.

BRAT installs from [GitHub Releases](https://github.com/FootPrintStudio/obsidian-visage/releases). Each release attaches `main.js`, `manifest.json`, `styles.css`, and `versions.json`.

### From source

```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/FootPrintStudio/obsidian-visage.git visage
cd visage
./build.sh
```

Enable **Visage** under Community plugins and reload Obsidian.

## Quick syntax — cards

Required, first inline code on the item:

- `` `v-card` ``

Optional exclusive bags (at most one of each key; order does not matter):

- `` `v-card {span=2} {layout=hero} {tone=warning} {border=none}` ``

| Key | Values |
|-----|--------|
| `span` | `2`–`7`, `full`, `fill` (default: grow equally on the row) |
| `layout` | `hero` (any card); `inline` / `footer` (subcards only) |
| `tone` | hex (`#8c65e6`), `rgb()` / `rgba()`, or `note` `tip` `warning` `danger` `success` `neutral` |
| `border` | `none` (aliases `0`, `false`) — removes border and shadow |

Same-line headings after the marker are promoted in Reading view:

```markdown
- `v-card` # Heading
- `v-card {span=2}` ## Section title
```

## Quick syntax — tabs

Use a `v-tabs` fence. Install **Augur** and run **Insert Visage tabs** to paste a **4-backtick** outer fence so tab bodies can contain ` ``` ` code. `POSITION` and `ALIGN` are optional (plugin defaults). `OPTIONS:` / `TABS:` headers are parse errors.

| Key | Values |
|-----|--------|
| `POSITION` | `top`, `bottom`, `left`, `right` |
| `ALIGN` | `left`, `right`, `center` / `centre`, `justify` (top/bottom nav only) |
| `TAB: Title` | Starts a tab; following lines until the next `TAB:` are markdown |
| `TAB: Title {tone=…}` | Same Tone presets / HEX / `rgb()` as cards; bags stripped from the label |

Deep links: `[[Note#Tab Title]]` opens that tab (skipped if a real heading of the same name exists). Nested `v-tabs` blocks are not supported.

Full grammar: **Settings → Guide** or [docs/GUIDE.md](docs/GUIDE.md).

## ListDecks snippet

Launcher notes that still use `cssclasses: list-deck` and HTML `data-*` spans should keep the **ListDecks** CSS snippet on. **Disable that snippet on notes that use Visage cards** so styles do not double-apply.

Visage does **not** require `cssclasses: list-deck`. Live Preview is out of scope.

## Settings

Open **Settings → Community plugins → Visage** (Settings | README | Guide).

| Setting | Default |
|---------|---------|
| Card gap / padding / image height | `0.35rem` / `0.65em` / `800px` |
| Default tab position | `top` |
| Default tab align | `left` |
| Remember active tab | on (session memory) |
| Default tab 1 / 2 title | Tab 1 / Tab 2 |

## Develop / rebuild

```bash
./build.sh
./test.sh
```

## Credits

Card look is based on [kepano/obsidian-card-layout](https://github.com/kepano/obsidian-card-layout) / ListDecks (MIT). Tabs were ported from [Content Tabs](https://github.com/FootPrintStudio/obsidian-content-tabs).
