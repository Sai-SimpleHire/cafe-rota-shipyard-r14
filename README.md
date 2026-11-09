# Café rota

One small café's weekly shifts. The manager plans and publishes the week, each
member of staff sees only their own shifts on their phone, and a swap is asked
for and approved in the app, so the manager always knows who is really working.

## What to try

1. **Set up the café.** On a fresh database, open the app, choose "Create the
   manager account" on the sign-in screen, then sign in. You are offered "Set up
   the café as its manager" — the first person to do this becomes the manager,
   so do it as soon as the app is online.
2. **Staff.** Add each person with name, email and a starting password (one is
   suggested). Tell them the password in person. Remove someone who has left:
   they can no longer sign in and their upcoming shifts come off the rota.
3. **Plan the week.** Pick the week, add shifts (day, start, end, who), then
   **Publish this week**. Staff see nothing from a week until it is published.
4. **As a member of staff,** sign in with the starting password, choose your
   own, and see your shifts, soonest first. **Ask to swap** a shift with a named
   colleague.
5. **Swap requests.** The manager approves (the shift becomes the colleague's)
   or turns down (nothing changes).

## Not in this version

Pay and hours totals, text or email reminders, clocking in, more than one café,
editing a shift in place (remove it and add it again), two-way exchanges of
shifts, and the colleague agreeing before the manager decides.

## How it is put together

[`ARCHITECTURE.md`](./ARCHITECTURE.md) is the rulebook; [`DESIGN.md`](./DESIGN.md)
says what every screen looks like and says.

| | |
| --- | --- |
| `src/app/(rota)/` | The signed-in screens: plan, staff, swaps, shifts, welcome. |
| `src/app/api/rota/` | The rota's routes. Every one checks who is signed in and their role. |
| `src/lib/rota/` | Dates, who-is-who checks, form rules, queries and the swap rule. |
| `prisma/schema.prisma` | Rota tables below the components' marker. |
| `src/components/` | Installed parts (sign-in, tables, dialogs, theme). Do not edit. |

Optional: set `CAFE_TIMEZONE` (for example `Europe/London`) so "today" is the
café's today rather than the server's.

## Running it

```bash
npm install
cp .env.example .env     # then fill in DATABASE_URL
npm run db:push          # create the tables
npm run dev
```

Nothing is backed up. Do not keep anything in it you cannot lose.
