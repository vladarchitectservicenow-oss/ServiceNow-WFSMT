# ServiceNow-WFSMT Dependency Report

**Product:** Workflow Studio Migration Tracker (WFSMT)
**Version:** 1.0.0
**Author:** Vladimir Kapustin

---

## 1. Internal Dependencies (ServiceNow Platform)

| Dependency | Category | Required For | Version Constraint |
|---|---|---|---|
| GlideRecord API | Core Platform | All data operations (scan, store, report) | All releases |
| GlideDateTime API | Core Platform | Timestamp tracking on scan runs | All releases |
| `wf_workflow` table | Workflow (Legacy) | Scanning legacy workflows | Pre-Australia |
| `wf_workflow_version` table | Workflow (Legacy) | Scanning legacy workflow versions | Pre-Australia |
| `sys_hub_flow` table | Flow Designer | Scanning Flow Designer flows | Zurich+ |
| `sys_flow_designer` table | Workflow Studio | Scanning Workflow Studio artifacts | Australia+ |
| REST Message (`sys_rest_message`) | Integration | Optional CI/CD export | Zurich+ |
| `sys_properties` table | Configuration | System property storage | All releases |
| Scoped App Framework | Platform | Application isolation (`x_wfsmt`) | All releases |

## 2. External Dependencies

| Dependency | Required | Purpose | Risk if Missing |
|---|---|---|---|
| Node.js 18+ | For local testing | Static validation test runner | Tests cannot run locally (PDI still functional) |
| Python 3.10+ | For local testing | `tests/test_runner.py` | Tests cannot run locally |
| `@servicenow/sdk` npm package | Target generation | `.now.ts` DSL template generation | DSL templates reference unresolved imports |
| AI Agent Studio | Optional (v1.1+) | AI-assisted mapping suggestions | Degrades to manual mapping only |

## 3. Test Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| Python 3.10+ | any | `test_runner.py` execution |
| xml.etree.ElementTree | built-in | XML parsing for sys_app.xml + data tables |
| pathlib | built-in | Filesystem path resolution |
| json | built-in | Report serialization |
| re | built-in | Pattern matching in SOP verification |

## 4. Cross-Scope Access Requirements

| Target Scope | Table/API | Operation | Required For |
|---|---|---|---|
| Global | `wf_workflow` | Read | Scanning legacy workflows |
| Global | `wf_workflow_version` | Read | Scanning legacy workflow versions |
| Global | `sys_hub_flow` | Read | Scanning Flow Designer flows |
| Global | `sys_flow_designer` | Read | Scanning Workflow Studio artifacts |

All access is **read-only** — WFSMT never modifies source workflow tables. Cross-scope read access must be granted via `sys_scope_privilege` records.

## 5. Release Compatibility Matrix

| ServiceNow Release | wf_workflow | sys_hub_flow | sys_flow_designer | Status |
|---|---|---|---|---|
| Pre-Zurich (Yokohama) | ✓ | ✓ | ✗ | Partial |
| Zurich | ✓ | ✓ | ✗ (limited) | Supported |
| Australia | ✓ | ✓ | ✓ | **Full Support** |
| Australia Patch 1+ | ✓ | ✓ | ✓ | Full Support |

## 6. Optional Integration Points

| Integration | Protocol | Direction | Purpose |
|---|---|---|---|
| CI/CD Pipeline (GitHub Actions, Jenkins) | REST outbound (JSON) | Outbound | Export findings for pipeline gating |
| SIEM / Monitoring (Splunk, Datadog) | REST outbound (JSON) | Outbound | Alert on high-risk migration gaps |
| AI Agent Studio | Internal API (AI) | Internal | AI-assisted DSL generation |
| Power BI / Tableau | JSON export | Outbound | Executive dashboarding |

## 7. Build-Time Dependencies

| Dependency | Used By | When |
|---|---|---|
| Git | Version control | Commit + push |
| GitHub API | Repository management | Push to `vladarchitectservicenow-oss` |
| Hermes Agent (cron) | Pipeline orchestration | Autonomous mass validation |
