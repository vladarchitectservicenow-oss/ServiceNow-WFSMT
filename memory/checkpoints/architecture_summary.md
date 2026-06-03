# ServiceNow-WFSMT Architecture Summary

**Product:** Workflow Studio Migration Tracker (WFSMT)
**Scope:** `x_wfsmt`
**Version:** 1.0.0
**Release Target:** Zurich → Australia migration
**Author:** Vladimir Kapustin
**License:** AGPL-3.0-only

---

## 1. Overview

WFSMT is a ServiceNow scoped application that discovers, classifies, and maps workflow artifacts across three generations of ServiceNow automation: **Legacy Workflows** (`wf_workflow`, `wf_workflow_version`), **Flow Designer Flows** (`sys_hub_flow`), and **Workflow Studio** (`.now.ts` DSL). The application calculates migration velocity, generates confidence-scored DSL templates, and produces executive-ready HTML/JSON reports.

## 2. Component Architecture

### 2.1 Core Script Includes

| Script Include | File | Lines | Responsibility |
|---|---|---|---|
| `WFSMTScanner` | `WFSMTScanner.js` | 99 | Discovery engine — scans 4 workflow tables, classifies by generation, stores findings |
| `WFSMTMappingEngine` | `WFSMTMappingEngine.js` | 60 | Mapping engine — cross-generational activity map (Run Script → script, Approval → approval, Wait → wait, If → decision) with confidence scores (80-95%) |
| `WFSMTReportGenerator` | `WFSMTReportGenerator.js` | 71 | Report engine — generates HTML dashboard + JSON machine-readable export with migration velocity percentage |

### 2.2 Data Model

| Table | Purpose | Key Fields |
|---|---|---|
| `x_wfsmt_scan_run` | Tracks each scan execution | scan_type, scope, state, findings_count, skipped_count, execution_time_ms, started, ended |
| `x_wfsmt_finding` | Individual discovered workflow artifact | scan_run_ref, table_name, record_sys_id, record_name, generation, active, last_updated |
| `x_wfsmt_migration_map` | Maps legacy flows to .now.ts targets | source_table, source_record, target_generation, mapping_confidence_score, status, now_ts_script |
| `x_wfsmt_config` | Configuration parameters | (system properties, rule definitions) |

### 2.3 Generation Detection Logic

The scanner's `_detectGeneration(table)` method classifies workflows by table prefix:

```
Table starts with 'wf_'        → "Legacy"
Table contains 'sys_hub_flow'  → "Flow Designer"
Table contains 'sys_flow_designer' or 'workflow_studio' → "Workflow Studio"
Other                            → "Unknown"
```

## 3. Data Flow

```
WFSMTScanner.runFullScan()
  ├─ _createRun(type, scope)          → x_wfsmt_scan_run (state=Running)
  ├─ Query 4 target tables
  │   ├─ wf_workflow          (Legacy)
  │   ├─ wf_workflow_version  (Legacy)
  │   ├─ sys_hub_flow         (Flow Designer)
  │   └─ sys_flow_designer    (Workflow Studio)
  ├─ _detectGeneration(table) per record
  ├─ _storeFindings(findings, runId)  → x_wfsmt_finding × N
  └─ _closeRun(runId, state, count, skipped, timeMs)

WFSMTMappingEngine
  ├─ mapActivity(name, targetGen)     → {target, confidence, manual_review}
  └─ generateNowTS(mappedActivities)  → .now.ts DSL string

WFSMTReportGenerator
  ├─ _getRun(id) → scan run metadata
  ├─ _getFindings(id) → all findings for run
  ├─ _html(run, findings) → HTML dashboard with generational breakdown
  └─ _json(run, findings) → JSON export with meta, summary, findings arrays
```

## 4. Mapping Engine — Activity Map

The mapping engine translates between generations with confidence scoring:

| Activity | Legacy/Flow Designer | Workflow Studio (.now.ts) | Confidence |
|---|---|---|---|
| Run Script | Action: Run Script | `script` | 95% |
| Wait for condition | Action: Wait for a duration of time | `wait` | 80% |
| Approval | Action: Ask for Approval | `approval` | 92% |
| If / Decision | Decision | `decision` | 95% |
| Unknown | — | `UNKNOWN` | 0% (manual_review=true) |

Confidence < 85% triggers `manual_review: true` flag.

## 5. Report Format

### HTML Output
- Generational breakdown: Legacy count, Flow Designer count, Workflow Studio count
- Migration Velocity: `(WS / Total) × 100%`

### JSON Output
```json
{
  "meta": { "product": "WFSMT", "version": "1.0.0", "license": "AGPL-3.0", "author": "Vladimir Kapustin" },
  "scan_run": { "sys_id": "...", "findings_count": N, "state": "Completed", "execution_time_ms": M },
  "summary": { "legacy": L, "flow_designer": FD, "workflow_studio": WS, "total": T, "migration_velocity_percent": V },
  "findings": [ ... ]
}
```

## 6. Test Coverage

Static validation via `tests/test_runner.py` (7 scenarios):
- SYS_APP scope verification (`x_wfsmt`)
- SCAN-001: WFSMTScanner core functions present
- MAP-001: Mapping engine has `mapActivity` + `generateNowTS`
- RPT-001: Report generator produces HTML + JSON with `migration_velocity_percent`
- DATA: Tables seeded with 3 generations (Legacy, Flow Designer, Workflow Studio)
- MAPPING: `.now.ts` DSL template contains `@servicenow/sdk` import
- DOC: SOP has 12+ test scenarios

## 7. Deployment

1. Import `src/sys_app.xml` into Studio
2. Import `src/tables/x_wfsmt_data.xml` for seed data
3. Switch to `x_wfsmt` scope
4. Run `WFSMTScanner.runFullScan()` via Scripts - Background
5. View reports via `WFSMTReportGenerator.generate(runId, 'html')`

## 8. Security and Access

- Scoped application: `x_wfsmt` prefix isolates all data
- `restrict_table_access: false` in app manifest — tables accessible from global scope
- `runtime_access_tracking: permissive` — no strict ACL enforcement at runtime
- All operations use GlideRecord API within the instance boundary — no external data egress
