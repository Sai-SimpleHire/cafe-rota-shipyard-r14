# Progress

## Done

- Design: DESIGN.md "Decisions made while building" (scene, frame, every screen's wording).
- Data: StaffMember, RotaWeek, Shift, SwapRequest below the schema marker (userId as a plain id).
- Helpers in src/lib/rota: dates (tested), access guards, form rules (tested), queries, swap rule.
- Phase 1: frame with role-based links and sign-out, home router, first-manager set-up, Staff screen, first-sign-in password change.
- Phase 2: Plan the week (add/remove, publish), My shifts (cards), swap ask / approve / turn down.
- Phase 3: title, no-index for the private link, README "What to try".

- Browser checks for all four core flows; phone-width fixes; security review (password change limited to the starting password).
- Fixed: suggested starting passwords could contain 1111-style digits the sign-in rules refuse.

## Next

- CAFE_TIMEZONE is read (optional) but not yet listed in .env.example (that file was off-limits to the agent).
