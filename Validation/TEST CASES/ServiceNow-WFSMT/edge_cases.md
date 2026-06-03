# Edge Cases — Workflow Studio Migration Tracker (WFSMT)

**Product:** ServiceNow-WFSMT
**Version:** 1.0.0
**Author:** Vladimir Kapustin

---

Edge cases test boundary conditions, unusual inputs, and extreme scenarios that may not occur in normal operation but must not cause crashes or data corruption.

---

## EDGE-001: Instance with 10,000+ Workflow Records

**Scenario:** Large enterprise instance with 10,000+ records across `wf_workflow`, `wf_workflow_version`, `sys_hub_flow`, and `sys_flow_designer`.

**Risk:** `runFullScan()` iterates all records with no `setLimit()`. Single GlideRecord query with 10,000 iterations may:
- Time out (30s platform limit)
- Exceed memory (findings array grows unbounded)
- Block other operations during scan

**Expected v1.0 behavior:** Scan may time out or OOM. **Expected v1.1:** Add `setLimit(5000)` with pagination and configurable chunk size.

**Test:** Mock 10,000 rows → verify execution time ≤ scan timeout, verify all rows processed or pagination kicks in.

**Status:** EDGE RISK — P2-01

---

## EDGE-002: Zero Active Workflows — All Inactive

**Scenario:** Instance where all workflows are inactive (retired, deprecated, archived). Active flag is false for every record.

**Risk:** Report shows 0 active workflows. User may misinterpret as "scan failed" instead of "nothing to migrate."

**Test:**
1. Seed all findings with `active = false`
2. Generate HTML report
3. Verify report explicitly states "0 active workflows found"
4. Verify JSON summary includes `active_count: 0`

**Expected v1.0:** Active flag is stored but not summarized. Report shows total counts without active/inactive breakdown. **Expected v1.1:** Add active/inactive breakdown to both HTML and JSON.

**Status:** EDGE RISK — P3

---

## EDGE-003: Workflow Name with Special HTML Characters

**Scenario:** Record name contains `<script>alert('xss')</script>`, `&amp;`, or `<b>Important</b>`.

**Risk:** `_html()` uses string concatenation without sanitization. HTML special characters break report rendering or create XSS vulnerability.

**Test:**
1. Create finding with `record_name = '<script>alert(1)</script>'`
2. Generate HTML report
3. Verify `<script>` tag is NOT executed (either escaped or stripped)
4. Verify surrounding HTML structure is intact

**Expected v1.0:** Raw string inserted into HTML — XSS possible. **Expected v1.1:** Use `GlideHTMLSanitizer` or `gs.htmlEncode()`.

**Status:** EDGE RISK — P2-04

---

## EDGE-004: 100% Migration Velocity — All Workflow Studio

**Scenario:** Instance already fully migrated to Workflow Studio — 0 Legacy, 0 Flow Designer, all Workflow Studio.

**Risk:** Report may show "Migration Velocity: 100%". Correct but may confuse users expecting a progress tracker. Should celebrate, not alarm.

**Test:**
1. Seed 10 findings, all `generation = "Workflow Studio"`
2. Generate HTML report → velocity = 100%
3. Generate JSON report → velocity = 100%
4. Verify report message is appropriate for complete migration

**Expected:** 100% velocity calculated correctly. No division by zero. No misleading message.

**Status:** PASS (calculation is `ws/total × 100`, no edge case)

---

## EDGE-005: 0% Migration Velocity — All Legacy

**Scenario:** Instance with only legacy workflows, zero Flow Designer or Workflow Studio artifacts.

**Risk:** Report shows "Migration Velocity: 0%". This is correct but the report must communicate this clearly as "migration not started" not "scan failed."

**Test:**
1. Seed 5 findings, all `generation = "Legacy"`
2. Generate HTML report → velocity = 0%
3. Verify report doesn't show division by zero or NaN
4. Verify `total > 0` guard prevents 0/0

**Expected:** 0% velocity, clean report, no NaN.

**Status:** PASS

---

## EDGE-006: Table Name Collision — Custom Table Named 'wf_custom_process'

**Scenario:** Customer has custom table starting with `wf_` that is NOT a workflow table.

**Risk:** `_detectGeneration("wf_custom_process")` returns "Legacy" because table starts with `wf_`. Scanner tries to query it → may not exist in targetTables, so this is actually fine for scan. But if someone adds it to targetTables manually, it gets misclassified.

**Test:**
1. Check `_detectGeneration("wf_custom_process")` → "Legacy"
2. Verify "wf_custom_process" is NOT in `this.targetTables`

**Expected v1.0:** Custom table not scanned (not in targetTables). If added, misclassified as Legacy. **Expected v1.1:** Add explicit allowlist check before classification.

**Status:** NO RISK (table not in targetTables; classification only matters for scanned tables)

---

## EDGE-007: Single Finding — Divide by Zero in Velocity

**Scenario:** Scan produces exactly 1 finding.

**Risk:** Velocity calculation: `Math.round((ws / total) * 100)` where total=1. If the single finding is Workflow Studio → 100%. If Legacy → 0%. Both fine. But if total=0 already handled by guard.

**Test:**
1. Seed 1 finding, generation = "Workflow Studio" → velocity = 100%
2. Seed 1 finding, generation = "Legacy" → velocity = 0%
3. Verify no rounding errors, no unexpected values

**Expected:** Correct percentages. No edge case.

**Status:** PASS

---

## EDGE-008: Concurrent Modification During Scan

**Scenario:** A workflow is created or deleted while `runFullScan()` is iterating.

**Risk:** GlideRecord cursors are snapshot-based in ServiceNow — modifications during iteration don't affect the cursor. New records not included; deleted records may show stale data.

**Test:** Mock GlideRecord to simulate concurrent insert/delete during iteration.

**Expected:** Scan produces snapshot-consistent results. This is ServiceNow platform behavior, not a WFSMT bug.

**Status:** PLATFORM BEHAVIOR — No code change needed

---

## EDGE-009: Null or Undefined GlideRecord Values

**Scenario:** `gr.getValue('active')` returns `null` or `undefined` for a record that has no active field.

**Risk:** Comparison `gr.getValue('active') === 'true'` fails when value is null. `gr.getValue('active') == 1` also fails. Finding's `active` field is set to `false` in both cases.

**Test:**
1. Mock GlideRecord where `getValue('active')` returns null
2. `var active = gr.getValue('active') === 'true' || gr.getValue('active') == 1` → evaluates to `false`
3. Finding `active: false` is stored — technically correct for null but misleading

**Expected:** Null is treated as inactive. Acceptable v1.0 behavior. **Expected v1.1:** Check `gr.active` boolean property instead of string comparison (P3-01).

**Status:** ACCEPTABLE — P3-01

---

## EDGE-010: `now_ts_script` CDATA Contains XML-Unsafe Characters

**Scenario:** `.now.ts` DSL contains `]]>` (CDATA terminator) inside generated code.

**Risk:** XML parser treats `]]>` as CDATA end. Remaining DSL is parsed as XML → XML parse error.

**Test:**
1. Generate `.now.ts` script that contains `]]>` (e.g., in a string literal or regex)
2. Verify CDATA section terminates correctly
3. Verify XML is still valid

**Expected v1.0:** `]]>` inside generated DSL breaks XML. **Expected v1.1:** Split CDATA into multiple sections (`<![CDATA[...]]]]><![CDATA[>...]]>`).

**Status:** EDGE RISK (low probability — current DSL templates don't contain `]]>`)

---

## Edge Case Summary

| Case | Severity | Status |
|---|---|---|
| EDGE-001: 10,000+ records | High | Deferred to v1.1 (P2-01) |
| EDGE-002: All inactive | Low | Deferred to v1.1 (P3) |
| EDGE-003: HTML injection | Medium | Deferred to v1.1 (P2-04) |
| EDGE-004: 100% velocity | None | PASS |
| EDGE-005: 0% velocity | None | PASS |
| EDGE-006: Custom table prefix | None | PASS (no risk) |
| EDGE-007: Single finding | None | PASS |
| EDGE-008: Concurrent modification | None | Platform behavior |
| EDGE-009: Null values | Low | ACCEPTABLE (P3-01) |
| EDGE-010: CDATA `]]>` | Low | Deferred (rare) |
