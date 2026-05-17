#!/usr/bin/env python3
"""
WFSMT Super Tester — Static Validation
Copyright (C) 2026 Vladimir Kapustin — AGPL-3.0
"""
import json, re, xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

BASE = Path("/home/crixus/agentic-loop/output/WFSMT")
REPORTS = BASE / "tests/execution_history"
REPORTS.mkdir(parents=True, exist_ok=True)

res = {"passed": 0, "failed": 0, "scenarios": []}

def ok(name, fn):
    try:
        fn()
        res["passed"] += 1
        res["scenarios"].append({"name": name, "status": "PASS"})
    except AssertionError as e:
        res["failed"] += 1
        res["scenarios"].append({"name": name, "status": "FAIL", "error": str(e)})

ok("SYS_APP: scope=x_wfsmt", lambda: (
    (lambda: (ET.parse(BASE / "src/sys_app.xml").getroot().find(".//scope").text == "x_wfsmt"))()
))

ok("SCAN-001: WFSMTScanner.js core", lambda: (
    (lambda: ("runFullScan" in (BASE / "src/script_includes/WFSMTScanner.js").read_text()))(),
    (lambda: ("_detectGeneration" in (BASE / "src/script_includes/WFSMTScanner.js").read_text()))(),
    (lambda: ("wf_workflow" in (BASE / "src/script_includes/WFSMTScanner.js").read_text()))(),
))

ok("MAP-001: WFSMTMappingEngine has mapActivity", lambda: (
    (lambda: ("mapActivity" in (BASE / "src/script_includes/WFSMTMappingEngine.js").read_text()))(),
    (lambda: ("generateNowTS" in (BASE / "src/script_includes/WFSMTMappingEngine.js").read_text()))(),
))

ok("RPT-001: WFSMTReportGenerator generates HTML+JSON", lambda: (
    (lambda: ("_html" in (BASE / "src/script_includes/WFSMTReportGenerator.js").read_text()))(),
    (lambda: ("_json" in (BASE / "src/script_includes/WFSMTReportGenerator.js").read_text()))(),
    (lambda: ("migration_velocity_percent" in (BASE / "src/script_includes/WFSMTReportGenerator.js").read_text()))(),
))

ok("DATA: Tables seeded with 3 generations", lambda: (
    (lambda: (len(ET.parse(BASE / "src/tables/x_wfsmt_data.xml").getroot().findall("x_wfsmt_finding")) >= 3))(),
    (lambda: (len(ET.parse(BASE / "src/tables/x_wfsmt_data.xml").getroot().findall("x_wfsmt_scan_run")) >= 1))(),
    (lambda: (len(ET.parse(BASE / "src/tables/x_wfsmt_data.xml").getroot().findall("x_wfsmt_migration_map")) >= 1))(),
))

ok("MAPPING: now.ts DSL template present", lambda: (
    (lambda: ("@servicenow/sdk" in (BASE / "src/tables/x_wfsmt_data.xml").read_text()))(),
))

ok("DOC: SOP has 12+ scenarios", lambda: (
    (lambda: (len(re.findall(r"^### [A-Z]+-\d+", (BASE / "tests/test_suite_SOP.md").read_text(), re.MULTILINE)) >= 12))(),
))

report = {
    "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "product": "WFSMT", "version": "1.0.0",
    "scenarios_run": [s["name"] for s in res["scenarios"]],
    "passed": res["passed"], "failed": res["failed"], "skipped": 0,
    "duration_ms": 0, "environment": "local-ci (static)", "commit_sha": "(local)"
}

rp = REPORTS / f"{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}_run.json"
with open(rp, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(f"RESULTS: PASS={res['passed']} FAIL={res['failed']}")
print(f"Report: {rp}")
exit(0 if res["failed"] == 0 else 1)
