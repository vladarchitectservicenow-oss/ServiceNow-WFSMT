# ServiceNow-WFSMT Risk Report

**Product:** Workflow Studio Migration Tracker (WFSMT)
**Version:** 1.0.0
**Author:** Vladimir Kapustin

---

## P0 — Critical (Must Fix Before Production)

| ID | Risk | Likelihood | Impact | Description | Mitigation |
|---|---|---|---|---|---|
| P0-01 | Missing cross-scope read access grants | High | Critical | Scanner queries `wf_workflow`, `sys_hub_flow`, `sys_flow_designer` from `x_wfsmt` scope. Without `sys_scope_privilege` records, scan returns 0 findings silently — users think migration is complete when nothing was scanned. | Pre-install verification script that probes each target table and alerts if GlideRecord returns empty. Document required privilege grants in README. |
| P0-02 | `restrict_table_access: false` in app manifest | High | Critical | Application tables are accessible from global scope. A malicious or careless global-scope script could corrupt scan runs, findings, and migration maps. | Change to `true` before store publishing. Add `x_wfsmt_admin` role with write ACLs on custom tables. |

## P1 — High (Fix Before Broad Deployment)

| ID | Risk | Likelihood | Impact | Description | Mitigation |
|---|---|---|---|---|---|
| P1-01 | No input validation on `_storeFindings` | Medium | High | Array of finding objects is iterated and inserted with no validation. Malformed data (missing `table_name`, null `record_sys_id`) creates orphaned records. | Add field validation before `g.insert()` — skip records missing required fields, log skipped count. |
| P1-02 | `mapActivity` returns `UNKNOWN` for unmapped activities | High | Medium | Only 4 activity types are mapped (Run Script, Wait, Approval, If). Any other activity type returns `UNKNOWN` with confidence 0. Large instances with custom activities get 0% migration coverage. | Expand mapping table with community-contributed activity patterns. Add `x_wfsmt_activity_map` table for user-customizable mappings. |
| P1-03 | No retry on scan failures | Low | High | `runFullScan` swallows errors per-record with `skipped++` but the `skipped_count` is only visible in scan run metadata — no alert, no notification. | Fire an event on `skipped_count > 0`. Create a sys_trigger that emails the admin when skipped records exceed threshold. |
| P1-04 | `sys_flow_designer` table may not exist on Zurich | Medium | High | Zurich instances may not have `sys_flow_designer` table. `GlideRecord` on a non-existent table throws, crashing the entire scan. | Wrap each table query in a try/catch. Skip tables that don't exist, log to `sys_log`, continue to next table. |
| P1-05 | Hardcoded activity mappings prevent customization | Medium | Medium | Mapping engine has 4 hardcoded entries in `this.mappings`. Customers with custom activity names get `UNKNOWN` for everything. | Replace hardcoded object with `x_wfsmt_activity_map` table reads. Ship default 4 mappings as seed data. |

## P2 — Medium (Address in Next Release)

| ID | Risk | Likelihood | Impact | Description | Mitigation |
|---|---|---|---|---|---|
| P2-01 | No performance guard on full scan | Medium | Medium | `runFullScan` queries all 4 tables without `setLimit()`. Instances with 10,000+ workflow records may time out or OOM. | Add `setLimit(5000)` with pagination. Add execution_time_ms threshold that auto-cancels after configurable timeout. |
| P2-02 | Single-run `_storeFindings` with individual inserts | High | Medium | Each finding calls `g.insert()` individually. 1,000 findings = 1,000 INSERT operations = slow. | Batch insert via `GlideMultipleInsert` or REST bulk endpoint. |
| P2-03 | No versioning on migration maps | Low | Medium | `x_wfsmt_migration_map` is a single flat record per mapping. If user re-maps to a different target, original mapping is lost. | Add `x_wfsmt_migration_map_version` child table for audit trail. |
| P2-04 | Report HTML is concatenated string, not template | Medium | Low | `_html()` builds HTML with string concatenation. Escaping issues (record names with `<`, `>`, `&`) cause broken HTML. | Use `GlideHTMLSanitizer` or switch to a proper templating approach. |
| P2-05 | `GlideRecord.get()` without null check | Low | Medium | `_closeRun` calls `gr.get(runId)` without checking return. If `runId` is invalid, `gr.getValue()` returns empty strings — scan appears to close normally with corrupted data. | Check `gr.isValidRecord()` after `get()`. If false, log error and abort close. |

## P3 — Low (Monitor)

| ID | Risk | Likelihood | Impact | Description | Mitigation |
|---|---|---|---|---|---|
| P3-01 | `active` field is boolean-as-string comparison | Low | Low | Scanner checks `gr.getValue('active') === 'true' || gr.getValue('active') == 1`. Different GlideRecord versions return `true`/`false` vs `1`/`0`. May misclassify active/inactive. | Use `gr.active` boolean property instead of string comparison. |
| P3-02 | No internationalization | Low | Low | All UI strings, report labels, and error messages are hardcoded English. | Future: extract to `sys_ui_message` records. |
| P3-03 | `helsinki_es5` JS level limits ES6+ | Low | Low | App manifest sets `js_level: helsinki_es5`. No arrow functions, template literals, or `let`/`const`. | Upgrade to `helsinki_es6` when Australia ES6 baseline is confirmed. |

---

## Risk Summary

| Level | Count | % |
|---|---|---|
| P0 (Critical) | 2 | 12% |
| P1 (High) | 5 | 29% |
| P2 (Medium) | 5 | 29% |
| P3 (Low) | 3 | 18% |
| **Total** | **17** | **100%** |

## Mitigation Priority

1. **Immediate:** Add cross-scope read access documentation + pre-install verification (P0-01)
2. **Before deployment:** Restrict table access to scoped roles (P0-02), add table existence checks (P1-04)
3. **Q3 2026:** Expand activity map to user-customizable table (P1-02), add retry/alerting (P1-03)
4. **Q4 2026:** Performance guards (P2-01), batch inserts (P2-02)
