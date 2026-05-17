/**
 * @copyright Copyright (C) 2026 Vladimir Kapustin
 * @license   AGPL-3.0-or-later
 * @scope     x_wfsmt
 * @file      WFSMTMappingEngine.js
 */

var WFSMTMappingEngine = Class.create();
WFSMTMappingEngine.prototype = {
    initialize: function() {
        this.scope = 'x_wfsmt';
        this.mappings = {
            'Run Script': {
                flow_designer: 'Action: Run Script',
                workflow_studio: 'script',
                confidence: 95
            },
            'Wait for condition': {
                flow_designer: 'Action: Wait for a duration of time',
                workflow_studio: 'wait',
                confidence: 80
            },
            'Approval': {
                flow_designer: 'Action: Ask for Approval',
                workflow_studio: 'approval',
                confidence: 92
            },
            'If': {
                flow_designer: 'Decision',
                workflow_studio: 'decision',
                confidence: 95
            }
        };
    },

    mapActivity: function(activityName, targetGen) {
        var mapping = this.mappings[activityName];
        if (!mapping) return { target: 'UNKNOWN', confidence: 0, manual_review: true };
        return {
            target: targetGen === 'Flow Designer' ? mapping.flow_designer : mapping.workflow_studio,
            confidence: mapping.confidence,
            manual_review: mapping.confidence < 85
        };
    },

    generateNowTS: function(mappedActivities) {
        var lines = ['import { workflow, decision, script, wait, approval } from "@servicenow/sdk";', ''];
        lines.push('export default workflow({');
        lines.push('  id: "migrated_workflow",');
        lines.push('  name: "Migrated Workflow",');
        for (var i = 0; i < mappedActivities.length; i++) {
            var a = mappedActivities[i];
            lines.push('  ' + a.target + ': { /* confidence ' + a.confidence + '% */ },');
        }
        lines.push('});');
        return lines.join('\n');
    },

    type: 'WFSMTMappingEngine'
};
