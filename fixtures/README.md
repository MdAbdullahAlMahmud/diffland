# fixtures

Checked-in sample repos used by unit tests, golden-file tests, and benchmarks.

Phase 1 adds:
- `tiny/` — 10 files, 2 dirs, hand-crafted diff
- `medium/` — ~2000 files for perf budget checks
- `large/` — ~20000 files for upper-bound stress test

Repos are stored as `.gitbundle` files and unpacked to a tmp dir by test helpers.
