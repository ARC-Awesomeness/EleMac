/**
 * CONFIDENTIAL AND PROPRIETARY SOURCE CODE.
 *
 * Use and distribution of this code is subject to applicable
 * licenses and the permission of the code owner. This notice
 * does not indicate the actual or intended publication of
 * this source code.
 *
 * Portions developed for Elemental Machines, Inc. by CBIZ ARC
 * and are the property of Elemental Machines, Inc.
 * ===================================================================
 * Version    Date            Author           Remarks
  * 1.0.1      2 Nov 2022     Bruce Do         Bug fixing
 */
/* global log */
/**
 * @NAPIVersion 2.1
 * @NScriptType MapReduceScript
 * @ModuleScope SameAccount
 */
define([
    'N/email',
    'N/record',
    'N/runtime',
    'N/format',
    'N/search'
], function (email, record, runtime, format, search) {
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    const getInputData = () => {
        let contractSearch = search.load('customsearch_em_all_contracts');
        return contractSearch;
    }
    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    const map = (context) => {
        const title = "elemac_mr_delete_contracts.map";
        log.debug(title, "context: " +context);
        try {
            let value = JSON.parse(context.value);
            log.debug(title, "values: " + value);
            let contId = value.id;
            log.debug(title, "deleting contract " + contId);
            record.delete({
                type: 'customrecord_elem_contracts_data',
                id: contId
            });
        } catch (e) {
            log.error(title, "error: " + e);
        }
    }
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    const reduce = (context) => {
    }
    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    const summarize = (summary) => {
        // const title = "elemac_mr_delete_contracts.summarize";
        // log.debug(title, "summary: " + summary);
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});