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
 * 1.0.1      10 Oct 2022     Bruce Do         Bug fixing
 */
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/log' ], function (record, search, dialog, log) {
    const pageInit = (context) => {
        let currentRecord = context.currentRecord;
    }
    const checkContractNumber = (contNum) => {
        let contNumSearchObj = search.create({
            type: "customrecord_elem_contract_numbers",
            filters:
                [
                    ["name","is",contNum]
                ],
            columns:
                [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    })
                ]
        });
        let searchResultCount = contNumSearchObj.runPaged().count;
        log.debug('checkContractNumber', 'searchResultCount: ' + searchResultCount);
        return searchResultCount > 0;
    }
    const saveRecord = (context) => {
        let currentRecord = context.currentRecord;
        let newContNum = currentRecord.getValue({fieldId: 'name'});
        log.debug('saveRecord', 'newContNum: ' + newContNum);
        try {
            if (checkContractNumber(newContNum)) {
                dialog.alert({
                    title: 'Contract Number ' + newContNum + ' already exist',
                    message: 'Please use another number or pickup the existing one from the list'
                });
                return false;
            }
        } catch (e) {
            dialog.alert({
                title: 'Cannot save ' + newContNum,
                message: 'Error: ' + e
            });
            return false;
        }
        return true;
    }

    return {
        pageInit: pageInit,
        // fieldChanged: fieldChanged,
        saveRecord: saveRecord
    }

});
