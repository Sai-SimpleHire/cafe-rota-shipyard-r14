<!-- shipyard:design -->

# project: design blueprint

*Shipyard writes the part between the `shipyard:design` markers from the approved pages, the theme and the installed parts, and rewrites it when they change. Add your decisions below the closing marker: they are kept.*

## Purpose

Plan a small cafe's weekly shifts, show each person their own shifts, and handle swap requests.

Used by: The café manager, who plans the week, and the staff, who need to know their own shifts and sometimes swap one.

## Flows

1. The manager signs in, adds staff members (name and email, with a starting password the staff member changes when they first sign in), and removes someone who ha
2. The manager plans a week: adds shifts (day, start time, end time, who is working), and publishes the week when it is ready. Staff cannot see a week until it is 
3. A staff member signs in and sees only their own published shifts, soonest first.
4. A staff member asks to swap one of their shifts with a named colleague. The manager approves or turns down the request, and the rota changes only when it is app

## Screens

1. **Sign in** (form) — Manager and staff sign in; a staff member changes their starting password the first time.
   One task, top to bottom: labels above fields, one primary button, errors next to the field. Buttons and messages from `ui_foundation`.
2. **Plan the week** (table) — The manager adds shifts for a week and publishes it.
   A list people scan, sort and filter. Use the data table if it is installed. Built with `data_table`.
3. **Staff** (table) — The manager adds and removes staff members.
   A list people scan, sort and filter. Use the data table if it is installed. Built with `data_table`.
4. **My shifts** (cards) — A staff member's own published shifts, soonest first, with a button to ask for a swap.
   A small number of items people compare at a glance, one card each.
5. **Swap requests** (table) — The manager approves or turns down swap requests.
   A list people scan, sort and filter. Use the data table if it is installed. Built with `data_table`.

## Frame and density

- Frame: a top bar with the app's name and one link per screen above (`ui_blocks` AppShell). No sidebar for this few screens.
- Each screen starts with its title and at most one primary action; other actions are quiet buttons.
- Lists are compact: one line per record, the columns people scan first on the left, actions at the end of the row.
- Forms are one column, labels above fields, the primary button at the end; errors sit next to their field.

## Tokens

Theme: **Calm** — The default. Quiet, high contrast, no personality — it gets out of the way.

Use these values through their CSS variables. Never write a colour, a radius or a spacing step by hand.

| Role | CSS variable | Light value |
| --- | --- | --- |
| bg | `var(--bg)` | `#ffffff` |
| surface | `var(--surface)` | `#f7f8fa` |
| fg | `var(--fg)` | `#14181f` |
| muted | `var(--muted)` | `#5b6472` |
| line | `var(--line)` | `#e3e7ec` |
| accent | `var(--accent)` | `#1f5fd0` |
| accentFg | `var(--accent-fg)` | `#ffffff` |
| focus | `var(--focus)` | `#1f5fd0` |
| ok | `var(--ok)` | `#e6f4ea` |
| okFg | `var(--ok-fg)` | `#1b5e34` |
| warn | `var(--warn)` | `#fdf3e0` |
| warnFg | `var(--warn-fg)` | `#7a4f0c` |
| danger | `var(--danger)` | `#fdecec` |
| dangerFg | `var(--danger-fg)` | `#96201f` |
| radius | `var(--radius)` | from the theme |
| space | `var(--space)` | from the theme |
| fontFamily | `var(--font-family)` | from the theme |
| fontSize | `var(--font-size)` | from the theme |
| lineHeight | `var(--line-height)` | from the theme |

The theme decides light and dark (dark follows the computer's setting, with the same variables). The page is `var(--bg)`; panels, cards and quiet buttons are `var(--surface)`. Those are the pairs the theme's contrast is checked on.

## Components in use

- **How the app looks** (`ui_foundation`): import as `docs/components/ui_foundation.md` shows; do not copy or edit its files. Use it for every button (`ui-button`), status message and focus ring. Adapt it through `src/theme.ts`.
- **The screens every app starts with** (`ui_blocks`): import as `docs/components/ui_blocks.md` shows; do not copy or edit its files. Use it for the frame (AppShell), every confirm or create dialog (Dialog), and number tiles (StatGrid) only on an approved dashboard screen. Adapt it through `src/components/ui_blocks/copy.ts`.
- **The screens people sign in on** (`auth_screens`): import as `docs/components/auth_screens.md` shows; do not copy or edit its files. It ships `/sign-in`, `/register`, `/forgot-password`, `/reset-password`: link to it only if a screen above needs it. Adapt it through `src/components/auth_screens/copy.ts`, `src/components/auth_screens/auth-screens.css`.
- **A list people can sort and search** (`data_table`): import as `docs/components/data_table.md` shows; do not copy or edit its files. Use it for every list of records: sorting, paging and its own empty state; never a hand-written `<table>`. Adapt it through `src/components/data_table/presentation.tsx`, `src/components/data_table/table.css`.

## States every screen has

- **Empty**: what this is for and what to do first; never a blank panel.
- **Loading**: say what is loading; never a frozen screen.
- **Some data**: the ordinary view.
- **Too much data**: a sixty-character name and a hundred rows still read; lists page or scroll.
- **Broken**: a plain sentence and a way to try again; never a stack trace or a dead end.

## Not in this version

- pay and hours totals
- text or email reminders
- clocking in
- more than one café.

No screen, field or action beyond the flows and screens above without asking the founder first.

## Accessibility

- Text contrast at least 4.5:1 and controls at least 3:1, in both light and dark.
- Everything works with the keyboard, and the focus is always visible (`var(--focus)`).
- Every field has a label; every icon-only button has a name.
- Meaning is never carried by colour alone; respect reduced motion.

## Rules for building screens

- Build each screen in the order above, sample data first, then the real data behind it.
- One look across the app: the variables above, the installed parts, nothing else.
- Avoid the generic AI look: gradients, glows, rows of identical cards, big number tiles nobody asked for.
- Before calling a screen done, check it against this file and say which section it meets.

<!-- /shipyard:design -->

## Decisions made while building

The UI designer adds what the generated part cannot know: the details of each screen, wording, and anything decided with the founder.

### The scene

A manager on a Sunday evening at the café counter or on the sofa, laptop or phone, wanting
next week planned before the kettle boils. Staff on the bus or in the back room, on a phone,
one thumb, wanting one answer: "when am I on next?" Glanced at, a few times a day, often in a
hurry. Nobody here wants to learn software.

### What this must not look like

- Not an enterprise rostering suite: no calendars of coloured blocks, no charts, no hours
  totals, no number tiles, no settings pages.
- Not a chat app: no feeds, no avatars, no notifications bell.
- Not the "AI startup" look: no gradients, glows, hero banners or rows of identical
  marketing cards. Plain type on the Calm theme, the installed parts, nothing else.

### The frame

- App name in the top bar: **Café rota**. Next to it, who is signed in ("Signed in as Sam")
  and a quiet **Sign out** button.
- The navigation is a row of links across the top on every width (our own stylesheet turns
  the AppShell's side column into a top bar; the AppShell itself is untouched).
- Manager links: **Plan the week**, **Swap requests**, **Staff**. Staff links: **My shifts**.
  A person never sees a link to a screen they may not use.
- Times are 24-hour (`07:00`); days read as "Tue 11 Nov" in lists and "Tuesday 11 November"
  on the staff cards. A week is Monday to Sunday and is named by its Monday: "Week of 10 Nov".

### Where people land

- Not signed in: the sign-in screen (from `auth_screens`).
- Signed in for the first time with a starting password: **Choose your own password**.
- Manager: **Plan the week** for the current week. Staff: **My shifts**.
- Signed in, but not on the rota (an account made on the register screen): "You are not on
  this café's rota yet. Ask the manager to add you." plus Sign out. If the café has no manager
  yet, this screen instead offers **Set up the café as its manager** — the one way the very
  first manager account comes to exist.

### Sign in (`auth_screens`, unchanged)

- Wording through `copy.ts` only: the "No account yet?" line becomes "Setting up the café for
  the first time?" / "Create the manager account". Staff never register; the manager adds them.

### Choose your own password (first sign-in)

- Title: "Choose your own password". Lede: "Your manager gave you a starting password. Pick
  one only you know before you see your shifts."
- Fields: **New password** (hint: "At least 12 characters, with three of: small letters,
  capitals, numbers, symbols."), **Type it again**. One primary button: **Save my password**.
- Errors under the field, in the server's words ("Your password needs to be at least 12
  characters."). On success, straight to My shifts.

### Plan the week (manager)

- Title "Plan the week". Under it the week switcher: quiet buttons **← Previous week**, the
  week name ("Week of 10 Nov"), **Next week →**, and the week's state as a Status chip:
  "Draft — staff cannot see it" (warn) or "Published" (ok).
- One primary action: **Publish this week** while it is a draft. Once published, a line
  instead: "Published. Staff see changes to this week straight away."
- Quiet button **Add a shift** opens a form dialog: **Day** (the seven days of this week,
  "Tuesday 11 Nov"), **Starts** and **Ends** (time fields), **Who is working** (the current
  staff, by name). Primary **Add the shift**. Errors: "The shift has to end after it starts.",
  "Sam is already working 08:00–12:00 that day."
- The list (data table, caption "Shifts in the week of 10 Nov"): Day · Starts · Ends · Who ·
  a quiet **Remove** button. Sorted by day then start time.
- Empty: "No shifts in this week yet. Add the first one, then publish the week when it is
  ready." No staff yet: "Add your staff first, then come back to plan the week." with a link.
- Publishing an empty week is refused: "Add at least one shift before publishing."

### Staff (manager)

- Title "Staff". Primary **Add a staff member** opens a form dialog: **Name**, **Email
  address**, **Starting password** (filled with a suggestion the manager can change, shown as
  plain text, hint: "Tell them this in person. They will choose their own when they first
  sign in."). Primary **Add them**.
- The list (caption "Everyone on the rota"): Name · Email · Status ("Has their own password"
  ok / "Still on the starting password" warn) · a quiet **Remove** button.
- Remove asks first (confirm dialog): "Remove Sam?" — "Sam will not be able to sign in any
  more. Their 3 upcoming shifts come off the rota, and any swap requests they are part of are
  turned down." Buttons: **Remove Sam** (danger), **Cancel**.
- Empty: "Nobody on the rota yet. Add each member of staff with their email address and a
  starting password."
- Email already in use: "Someone already uses that email address here."

### My shifts (staff)

- Title "My shifts". One card per published shift from today on, soonest first. The first
  card is marked "Next shift". Each card: the day in full, the times large ("07:00 – 13:00"),
  and a quiet **Ask to swap** button.
- A shift with a swap waiting shows a Status chip "Swap with Alex — waiting for the manager"
  instead of the button.
- Ask to swap opens a form dialog: "Who could take this shift?" — a list of colleagues by
  name — primary **Send the request**. It says plainly: "If the manager approves, the shift
  becomes theirs."
- Below the cards, "Recent answers": the last few decided requests, one line each, e.g.
  "Tue 11 Nov 07:00–13:00 to Alex — approved".
- Empty: "No shifts coming up. When the manager publishes a week, your shifts appear here."

### Swap requests (manager)

- Title "Swap requests". The list (caption "Swap requests, waiting ones first"): Shift
  ("Tue 11 Nov 07:00–13:00") · From · To · Asked · Status (waiting warn / approved ok /
  turned down neutral) · actions **Approve** (primary) and **Turn down** (quiet), on waiting
  rows only.
- Approving moves the shift to the colleague; nothing changes on the rota before that.
  Refusals in plain words: "Alex is already working 08:00–12:00 that day.", "This shift has
  already changed hands."
- Empty: "No swap requests. When someone asks to swap a shift, it appears here for you to
  approve or turn down."

### Loading and broken

- Screens are drawn on the server with their data, so there is no loading spinner on arrival;
  buttons say what they are doing while busy ("Publishing…", "Saving…").
- Any failed save shows one sentence next to the button and leaves what was typed in place:
  "That did not save. Check your connection and try again."

### Out of this version (said, not hidden)

Editing a shift (remove it and add it again), copying last week, exchanging two shifts,
the colleague accepting before the manager, reminders, hours and pay.
