# Visage guide

Reading view only. **Cards** stay normal markdown (leading `` `v-card` `` marker). **Tabs** use a `v-tabs` fence.

## Marker

The **first** inline code on a list item must be `v-card`, optionally followed by `{key=value}` bags:

```markdown
- `v-card`
- `v-card {span=2}`
- `v-card {span=fill} {tone=#8c65e6}`
- `v-card {layout=hero} {span=full} {tone=warning}`
```

- Bags may appear in any order.
- At most one `span`, one `rows`, one `layout`, one `tone`, and one `border`.
- Unknown keys show a small error on the card.
- Other inline code (including Grimoire `` `q=` ``) is never treated as a card marker.

Do **not** wrap card bodies in fenced ` ``` ` blocks.

## Nesting

```markdown
- `v-card` Parent card
	- Ordinary nested item (bullets stay)
	- `v-card` Subcard
	- `v-card {layout=inline}` Chip
```

- Nested item **with** `` `v-card` `` → **subcard**
- Nested item **without** `` `v-card` `` → **normal nested list**
- A `ul` becomes a card deck (8 columns) when a **direct** child is a card and the list is not already inside a card
- Unmarked top-level siblings in that deck stay ordinary full-width rows

## Span (8 columns)

At normal note widths the deck wraps at **8 authoring slots**, drawn on a finer **24-track** CSS Grid (so common odd counts stay even). Default and `fill` cards share leftover tracks on that row (3 cards → three equal thirds). Literal `2`–`7` stay a fixed fraction of the row (`N/8`). Narrow panes stack to one column and ignore column spans (row spans still apply).

| Value | Width |
|-------|--------|
| *(omitted)* | Share leftover tracks with other default/`fill` cards on the row (counts as 1 slot toward wrap-at-8) |
| `2`–`7` | Fixed share of the row (`N/8`) |
| `full` | Entire row |
| `fill` | Share leftover tracks **equally** with other default/`fill` cards after siblings’ literal spans |

Example: `{span=2}` + `{span=3}` + `{span=fill}` → 2/8 + 3/8 + **3/8**.

A row of only default or `fill` cards shares the row as evenly as integer tracks allow (3 → exact thirds; 5 and 7 still have a 1-track remainder on the last card). Multiple `fill` on one row share leftover equally. `fill` also closes the row for a following literal span (`{span=fill}` then `{span=2}` → two rows).

```markdown
- `v-card` Alpha
- `v-card` Beta
- `v-card` Gamma
```

Those three share the row. You do not need `{span=fill}` just to stretch a short row.

```markdown
- `v-card {span=2}` Wide
- `v-card {span=3}` Wider
- `v-card {span=fill}` Takes the rest of the row
- `v-card {span=full}` Own row
```

## Rows (mosaic height)

`{rows=N}` (integer **1–8**, default **1**) is **top-level cards only**. Subcards ignore it.

- If **no** card in the deck uses `rows` greater than 1, row height follows **content** (tallest card in that row), same as before.
- If **any** top-level card uses `{rows=2}` or higher, the deck switches to **mosaic** mode: row tracks use a minimum height (`--deck-row-min`, default `10rem`), and `grid-auto-flow: dense` lets later cards fill holes beside tall tiles.

```markdown
- `v-card {span=4} {rows=2}` Tall half-width
- `v-card {span=4}` Short half (may sit beside or below under dense packing)
- `v-card {span=2} {rows=2}`
- `v-card {span=6}`
```

Invalid `rows` values show the same error badge as bad `span` / `tone`.

## Layout

| Value | Where | Effect |
|-------|-------|--------|
| `hero` | any card | First image bleeds to the top edge of **this** card |
| `inline` | **subcard only** | Sibling `inline` subcards form a horizontal row (space allowing) |
| `footer` | **subcard only** | Contiguous **tail** of the nested list, pinned to the bottom of the parent |

`inline` / `footer` on a top-level card are ignored.

Footer subcards must be the last nested items (no unmarked items after them). Multiple footers are allowed if they are all at the bottom. The parent uses column flex with body content wrapped so inline queries stay on one line; the footer group gets `margin-top: auto`.

```markdown
- `v-card {span=full}` Dashboard
	Intro copy.
	- `v-card {layout=inline}` Revenue
	- `v-card {layout=inline}` Users
	- `v-card {layout=footer}` Actions

- `v-card {layout=hero} {span=full}`
	![[banner.png]]
	Caption
```

## Tone

Applied as `--deck-tone` on the card, or a preset class.

```markdown
- `v-card {tone=#8c65e6}` Hex
- `v-card {tone=rgba(0,0,0,0.4)}` RGBA
- `v-card {tone=warning}` Preset
```

Presets: `note` | `tip` | `warning` | `danger` | `success` | `neutral` (theme tokens).

## Border

```markdown
- `v-card {border=none}`
- `v-card {tone=warning} {border=none}`
```

`border=none` (aliases `0`, `false`) removes the card border and shadow. Tone background tint still applies when both are set.

## Headings

CommonMark does not parse `#` after inline code on the same line as an ATX heading. Visage promotes leftover `#{1,6}` + space after hiding the marker:

```markdown
- `v-card` # Heading
- `v-card {span=2}` ## Section title
```

A heading on the **next** line of the same list item already works natively and is left alone:

```markdown
- `v-card`
	# Heading
```

Launcher-style cards (`` `- `v-card` ## Word Processing` ``) are a first-class case.

## ListDecks coexistence

Keep the ListDecks CSS snippet enabled for notes that still use `cssclasses: list-deck` and HTML `data-*` spans.

On notes that use `` `v-card` ``, **turn the ListDecks snippet off** (or drop `list-deck` from frontmatter) so both systems do not style the same lists.

Visage does not require `cssclasses: list-deck`.

## Tabs (`v-tabs`)

Reading view only. Nested `v-tabs` blocks are not supported. Nested **code** fences are, if the outer fence is longer than any inner fence. Install **Augur** — **Insert Visage tabs** uses four backticks.

`````
````v-tabs
POSITION: top
ALIGN: left

TAB: Overview {tone=warning}
## Heading
Markdown body for tab 1.

TAB: Details {tone=#8c65e6}
- `v-card` Card inside a tab
````
`````

`OPTIONS:` and `TABS:` headers are parse errors. Put every key at the top level.

### Layout keys

| Key | Values | Notes |
|-----|--------|-------|
| `POSITION` | `top`, `bottom`, `left`, `right` | Nav placement. Duplicate keys → parse error. |
| `ALIGN` | `left`, `right`, `center`, `centre`, `justify` | Top/bottom nav only. Ignored for side nav. |

Omit `POSITION` / `ALIGN` to use plugin defaults. Blank lines between layout keys and the first `TAB:` are allowed.

### TAB entries

- `TAB: Title` starts a tab; following lines until the next `TAB:` are markdown body.
- Optional bags after the title: `TAB: Overview {tone=warning}` or `TAB: Details {tone=#8c65e6}` (same Tone presets / HEX / `rgb()` as cards). Bags are stripped from the displayed title.
- Lines starting with `#` are comments **outside** tab bodies (`## Heading` inside a tab is real markdown).
- Option lines may use an optional `- ` list prefix.
- Tab body lines are literal — nested fences, colons, and `OPTIONS:` text in content are preserved.

### Deep links

`[[Note#Tab Title]]` activates that tab in Reading view. Skipped when a real markdown heading of the same name exists. Exact title match is case-sensitive; slugified forms also match (`My Tab` ↔ `my-tab`).

### Nested code

The outer fence must be longer than any fence inside tab bodies. If it is too short, Visage shows a red error with the required backtick count. The block source is re-read from the vault file so nested fences are complete.

