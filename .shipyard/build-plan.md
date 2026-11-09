# Build plan

Written by Shipyard. You do every step yourself; this project has no helpers. A step is done when
you mark it "done" in `.shipyard/plan-progress.json` and the checks listed for it pass.
The founder starts each stage with one message (Build everything; later, Get ready to launch).
Work through the stage's steps in that one turn, keeping `.shipyard/plan-progress.json` up to date.

## While building

1. **Design the app and plan how it is built** (id `design`). Done when: check `design_blueprint_present` passes.
2. **The first real feature** (id `phase-1`). Done when: check `typecheck_passes` passes; check `unit_tests_pass` passes; check `style_check_passes` passes; check `pages_load` passes.
3. **The rest of the features** (id `phase-2`). Done when: check `typecheck_passes` passes; check `unit_tests_pass` passes; check `style_check_passes` passes; check `pages_load` passes.
4. **Show it to someone** (id `phase-3`). Done when: check `typecheck_passes` passes; check `unit_tests_pass` passes; check `style_check_passes` passes; check `pages_load` passes.

## Before launch

1. **Write the browser checks for the core flows** (id `tests`). Done when: check `core_flow_smoke_test` passes; check `core_flow_specs_present` passes.
2. **Walk the app in a browser** (id `browser-check`). Done when: check `core_flow_smoke_test` passes; check `core_flow_specs_present` passes.
3. **Security review** (id `security`). Done when: check `build_passes` passes.


Something broken at any step: fix it yourself, then the step's checks run again.
