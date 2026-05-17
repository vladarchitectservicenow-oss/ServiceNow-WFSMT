/**
 * @copyright Copyright (C) 2026 Vladimir Kapustin
 * @license   AGPL-3.0-or-later
 * @scope     x_wfsmt
 * @file      WFSMTScanner.js
 */

var WFSMTScanner = Class.create();
WFSMTScanner.prototype = {
    initialize: function() {
        this.scope = 'x_wfsmt';
        this.version = '1.0.0';
        this.targetTables = [
            'wf_workflow',
            'sys_hub_flow',
            'sys_flow_designer',
            'wf_workflow_version'
        ];
    },

    runFullScan: function() {
        var start = new Date().getTime();
        var runId = this._createRun('full', 'global');
        var findings = [];
        var skipped = 0;

        for (var t = 0; t < this.targetTables.length; t++) {
            var tbl = this.targetTables[t];
            var gr = new GlideRecord(tbl);
            gr.query();
            while (gr.next()) {
                try {
                    var active = gr.getValue('active') === 'true' || gr.getValue('active') == 1;
                    findings.push({
                        table_name: tbl,
                        record_sys_id: gr.getValue('sys_id'),
                        record_name: gr.getDisplayValue() || gr.getValue('name') || 'unnamed',
                        generation: this._detectGeneration(tbl),
                        active: active,
                        last_updated: gr.getValue('sys_updated_on')
                    });
                } catch (e) {
                    skipped++;
                }
            }
        }

        this._storeFindings(findings, runId);
        var execTime = new Date().getTime() - start;
        this._closeRun(runId, 'Completed', findings.length, skipped, execTime);
        return runId;
    },

    _detectGeneration: function(table) {
        if (table.indexOf('wf_') === 0) return 'Legacy';
        if (table.indexOf('sys_hub_flow') >= 0) return 'Flow Designer';
        if (table.indexOf('sys_flow_designer') >= 0 || table.indexOf('workflow_studio') >= 0) return 'Workflow Studio';
        return 'Unknown';
    },

    _createRun: function(type, scope) {
        var gr = new GlideRecord('x_wfsmt_scan_run');
        gr.initialize();
        gr.scan_type = type;
        gr.scope = scope;
        gr.state = 'Running';
        gr.started = new GlideDateTime();
        return gr.insert();
    },

    _storeFindings: function(findings, runId) {
        for (var i = 0; i < findings.length; i++) {
            var f = findings[i];
            var g = new GlideRecord('x_wfsmt_finding');
            g.initialize();
            g.scan_run_ref = runId;
            g.table_name = f.table_name;
            g.record_sys_id = f.record_sys_id;
            g.record_name = f.record_name;
            g.generation = f.generation;
            g.active = f.active;
            g.last_updated = f.last_updated;
            g.insert();
        }
    },

    _closeRun: function(runId, state, count, skipped, timeMs) {
        var gr = new GlideRecord('x_wfsmt_scan_run');
        gr.get(runId);
        gr.state = state;
        gr.findings_count = count;
        gr.skipped_count = skipped;
        gr.execution_time_ms = timeMs;
        gr.ended = new GlideDateTime();
        gr.update();
    },

    type: 'WFSMTScanner'
};
