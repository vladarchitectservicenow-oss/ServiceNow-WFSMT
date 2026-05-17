/**
 * @copyright Copyright (C) 2026 Vladimir Kapustin
 * @license   AGPL-3.0-or-later
 * @scope     x_wfsmt
 * @file      WFSMTReportGenerator.js
 */

var WFSMTReportGenerator = Class.create();
WFSMTReportGenerator.prototype = {
    initialize: function() {},

    generate: function(runId, format) {
        var scanRun = this._getRun(runId);
        var findings = this._getFindings(runId);
        if (format === 'json') return this._json(scanRun, findings);
        return this._html(scanRun, findings);
    },

    _getRun: function(id) {
        var gr = new GlideRecord('x_wfsmt_scan_run');
        gr.get(id);
        return { sys_id: gr.getValue('sys_id'), findings_count: gr.getValue('findings_count'), state: gr.getValue('state'), execution_time_ms: gr.getValue('execution_time_ms') };
    },

    _getFindings: function(id) {
        var out = [];
        var gr = new GlideRecord('x_wfsmt_finding');
        gr.addQuery('scan_run_ref', id);
        gr.query();
        while (gr.next()) {
            out.push({ generation: gr.getValue('generation'), active: gr.getValue('active'), record_name: gr.getValue('record_name') });
        }
        return out;
    },

    _html: function(run, findings) {
        var legacy = 0, fd = 0, ws = 0;
        for (var i = 0; i < findings.length; i++) {
            var g = findings[i].generation;
            if (g === 'Legacy') legacy++;
            else if (g === 'Flow Designer') fd++;
            else if (g === 'Workflow Studio') ws++;
        }
        var total = legacy + fd + ws;
        var pct = total > 0 ? Math.round((ws / total) * 100) : 0;
        return '<!DOCTYPE html><html><head><title>WFSMT Report</title></head><body>' +
            '<h1>Workflow Studio Migration Tracker Report</h1>' +
            '<p>Legacy: ' + legacy + ' | Flow Designer: ' + fd + ' | Workflow Studio: ' + ws + '</p>' +
            '<p>Migration Velocity: ' + pct + '%</p>' +
            '</body></html>';
    },

    _json: function(run, findings) {
        var legacy = 0, fd = 0, ws = 0;
        for (var i = 0; i < findings.length; i++) {
            var g = findings[i].generation;
            if (g === 'Legacy') legacy++;
            else if (g === 'Flow Designer') fd++;
            else if (g === 'Workflow Studio') ws++;
        }
        var total = legacy + fd + ws;
        return JSON.stringify({
            meta: { product: 'WFSMT', version: '1.0.0', license: 'AGPL-3.0', author: 'Vladimir Kapustin' },
            scan_run: run,
            summary: { legacy: legacy, flow_designer: fd, workflow_studio: ws, total: total, migration_velocity_percent: total > 0 ? Math.round((ws / total) * 100) : 0 },
            findings: findings
        }, null, 2);
    },

    type: 'WFSMTReportGenerator'
};
