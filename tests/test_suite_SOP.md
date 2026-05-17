# WFSMT Test Suite SOP
# Copyright (C) 2026 Vladimir Kapustin
# SPDX-License-Identifier: AGPL-3.0-or-later

## Overview
Product: ServiceNow Workflow Studio Migration Tracker (WFSMT)  
Scope: x_wfsmt  
Focus: Map Legacy Workflow → Flow Designer → Workflow Studio for Australia

## Scenarios (12+)

### SCAN-001 Baseline Full Scan
**Obj:** Detect all legacy Workflow/FLOW records and map to Workflow Studio equivalents.  
**Precond:** Instance has ≥1 legacy workflow, ≥1 Flow Designer flow, ≥1 Workflow Studio flow.  
**Steps:**
1. Run `WFSMTScanner.runFullScan()` targeting tables: `wf_workflow`, `sys_hub_flow`, `sys_flow_designer`.
2. Assert `x_wfsmt_scan_run.state == 'Completed'` within 120s.
3. Assert `findings_count >= 3` (one per generation).

### MAP-001 Legacy → Flow Designer Mapping
**Obj:** Verify legacy Workflow steps correctly map to Flow Designer flow logic.  
**Precond:** Legacy workflow with `Run Script`, `Wait for condition`, `Approval` activities.  
**Steps:**
1. Create `x_wfsmt_migration_map` record for legacy workflow.
2. Assert `mapped_flow_designer_ref` is populated.
3. Assert `mapping_confidence_score >= 70`.

### MAP-002 Flow Designer → Workflow Studio Mapping
**Obj:** Verify Flow Designer flows map to new Workflow Studio `.now.ts` DSL.  
**Precond:** Flow with Decision, Loop, and Subflow actions.  
**Steps:**
1. Run migration mapping.
2. Assert `.now.ts` template generated in `x_wfsmt_migration_map.now_ts_script`.
3. Assert template contains `workflow`, `decision`, `loop` blocks.

### MIG-001 Auto-Migration with Dry-Run
**Obj:** Execute dry-run migration without modifying source records.  
**Precond:** Legacy workflow ready for migration.  
**Steps:**
1. Set `dry_run = true`.
2. Call `WFSMTMigrator.migrate()`.
3. Assert no records in `sys_hub_flow` or `sys_flow_designer` created.
4. Assert `x_wfsmt_audit_log` entry with `status = 'DryRun_Success'`.

### MIG-002 Live Migration
**Obj:** Execute actual migration and validate outcome.  
**Precond:** Dry-run passed for target workflow.  
**Steps:**
1. Set `dry_run = false`.
2. Call `WFSMTMigrator.migrate()`.
3. Assert new Workflow Studio flow created in `sys_flow_designer`.
4. Assert `x_wfsmt_migration_map.status == 'Migrated'`.

### ROLL-001 Rollback Post-Migration
**Obj:** Roll back a migrated flow to its original Legacy Workflow state.  
**Precond:** Workflow migrated in MIG-002.  
**Steps:**
1. Call `WFSMTMigrator.rollback()`.
2. Assert Workflow Studio flow is deactivated.
3. Assert Legacy Workflow restored to `published` state.

### RPT-001 HTML/JSON Migration Report
**Obj:** Generate report showing migration velocity.  
**Precond:** SCAN-001 completed with findings.  
**Steps:**
1. Call `WFSMTReportGenerator.generate()`.
2. Assert HTML contains `<table>` with `wf_workflow`, `sys_hub_flow`, `sys_flow_designer` counts.
3. Assert JSON has root key `migration_velocity_percent`.

### PERF-001 5000 Workflow Scan Performance
**Obj:** Scan completes within SLA.  
**Precond:** 5000 dummy `wf_workflow` records.  
**Steps:**
1. Run full scan.
2. Assert `execution_time_ms <= 600000`.

### SEC-001 Role-Based Access Control
**Obj:** Only `x_wfsmt.admin` can execute migration.  
**Precond:** Users with `x_wfsmt.admin` and `x_wfsmt.user` roles.  
**Steps:**
1. Admin calls `migrate()` → assert success.
2. User calls `migrate()` → assert `403`.

### SCH-001 Scheduled Migration Health Check
**Obj:** Verify scheduled job runs without error.  
**Steps:**
1. Trigger `WFSMT_Health_Check` manually.
2. Assert `x_wfsmt_scan_run` created with `scan_type = 'health'`.  
3. Assert no Error-level syslog entries.

### EDGE-001 Null Workflow Handling
**Obj:** Handle malformed null workflows gracefully.  
**Steps:**
1. Create workflow with null `variables` field.
2. Run scan.
3. Assert `skipped_count incremented`, no exceptions.

### INTEG-001 ServiceNow Docs API Integration
**Obj:** Validate mapping suggestions against official docs.  
**Steps:**
1. Mock API returning "Run Script" equivalent in Workflow Studio.
2. Assert `WFSMTMappingEngine` populates `verified_by_docs = true`.

## Exit Criteria
- All 12+ PASS
- logs in `tests/execution_history/YYYY-MM-DD_run.json`
- `x_wfsmt_test_*` records cleaned
- No ERROR syslog from WFSMT during run
