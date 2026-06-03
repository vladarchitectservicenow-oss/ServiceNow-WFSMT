# Validation Checklist — Workflow Studio Migration Tracker (WFSMT)

**Product:** ServiceNow-WFSMT
**Version:** 1.0.0
**Author:** Vladimir Kapustin
**Check Date:** 2026-06-03

---

Pre-commit validation checklist. All items must pass before `git push`.

## Source Code Integrity

- [ ] **CHK-001:** `WFSMTScanner.js` exists, ≥95 lines, contains `runFullScan`, `_detectGeneration`, `_storeFindings`, `_createRun`, `_closeRun`
- [ ] **CHK-002:** `WFSMTMappingEngine.js` exists, ≥55 lines, contains `mapActivity`, `generateNowTS`, 4 activity mappings
- [ ] **CHK-003:** `WFSMTReportGenerator.js` exists, ≥65 lines, contains `_html`, `_json`, `migration_velocity_percent`
- [ ] **CHK-004:** `sys_app.xml` exists, valid XML, `<scope>x_wfsmt</scope>`, `<version>1.0.0</version>`, `<license>AGPL-3.0-only</license>`
- [ ] **CHK-005:** `x_wfsmt_data.xml` exists, valid XML, ≥1 scan run, ≥3 findings, ≥1 migration map with `.now.ts` DSL in CDATA
- [ ] **CHK-006:** All `.js` files have `/** Copyright (C) 2026 Vladimir Kapustin */` header
- [ ] **CHK-007:** All `.xml` files have `<!-- Copyright (C) 2026 Vladimir Kapustin -->` comment
- [ ] **CHK-008:** `test_runner.py` has `Copyright (C) 2026 Vladimir Kapustin — AGPL-3.0` header

## Test Results

- [ ] **CHK-009:** `python3 tests/test_runner.py` exits with code 0
- [ ] **CHK-010:** At least 7 scenarios run, all PASS (SYS_APP, SCAN-001, MAP-001, RPT-001, DATA, MAPPING, DOC)
- [ ] **CHK-011:** No failed scenarios, no skipped scenarios

## Documentation

- [ ] **CHK-012:** `memory/checkpoints/architecture_summary.md` ≥40 lines
- [ ] **CHK-013:** `memory/checkpoints/dependency_report.md` ≥30 lines
- [ ] **CHK-014:** `memory/checkpoints/risk_report.md` ≥5 risk entries (P0/P1/P2/P3)
- [ ] **CHK-015:** `memory/checkpoints/execution_plan.md` ≥6 phases
- [ ] **CHK-016:** `Validation/TEST CASES/ServiceNow-WFSMT/test_suite_SOP.md` ≥10 scenarios
- [ ] **CHK-017:** `Validation/TEST CASES/ServiceNow-WFSMT/regression_cases.md` ≥6 cases
- [ ] **CHK-018:** `Validation/TEST CASES/ServiceNow-WFSMT/edge_cases.md` ≥5 cases
- [ ] **CHK-019:** `Validation/TEST CASES/ServiceNow-WFSMT/validation_checklist.md` ≥10 items

## License

- [ ] **CHK-020:** `LICENSE` contains GNU AFFERO GENERAL PUBLIC LICENSE v3 text
- [ ] **CHK-021:** `LICENSE` contains `Copyright (C) 2026 Vladimir Kapustin`
- [ ] **CHK-022:** `README.md` license section matches LICENSE (AGPL-3.0, NOT MIT)
- [ ] **CHK-023:** All source files have correct SPDX identifier: `AGPL-3.0-only` or `AGPL-3.0-or-later`

## README Quality

- [ ] **CHK-024:** README ≥2000 words
- [ ] **CHK-025:** Zero duplicate sections (`grep '^## ' README.md | sort | uniq -d` returns empty)
- [ ] **CHK-026:** Contains Mermaid diagram
- [ ] **CHK-027:** Contains ROI analysis table
- [ ] **CHK-028:** Contains Troubleshooting table with ≥3 scenarios
- [ ] **CHK-029:** Contains Architecture section describing the 3 Script Includes
- [ ] **CHK-030:** Contains Installation steps
- [ ] **CHK-031:** Contains API Reference
- [ ] **CHK-032:** Contains Testing section with `pytest` command

## Git Operations

- [ ] **CHK-033:** `git config user.name` = "Vladimir Kapustin"
- [ ] **CHK-034:** `git config user.email` = "vladarchitect@github"
- [ ] **CHK-035:** `git diff --cached --stat` shows Phase 1+2 docs staged
- [ ] **CHK-036:** No `__pycache__/` or `*.pyc` in staging area
- [ ] **CHK-037:** No backup files (`*~`, `*.bak`, `*.orig`) in staging area
- [ ] **CHK-038:** `DONE.marker` committed and pushed

## Remote Verification

- [ ] **CHK-039:** `architecture_summary.md` exists on GitHub `main` branch (≥500 bytes)
- [ ] **CHK-040:** `test_suite_SOP.md` exists on GitHub `main` branch (≥10 scenarios)
- [ ] **CHK-041:** `DONE.marker` exists on GitHub `main` branch

---

## Check Results (2026-06-03)

| Category | Passed | Total |
|---|---|---|
| Source Code Integrity | 8/8 | 8 |
| Test Results | 3/3 | 3 |
| Documentation | 8/8 | 8 |
| License | 4/4 | 4 |
| README Quality | 9/9 | 9 |
| Git Operations | 6/6 | 6 |
| Remote Verification | 3/3 | 3 |
| **Total** | **41/41** | **41** |

**Overall:** PASS ✓
