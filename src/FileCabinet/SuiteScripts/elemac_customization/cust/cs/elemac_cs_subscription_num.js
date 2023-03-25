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
    const checkSubscriptionNumber = (contNum) => {
        let contNumSearchObj = search.create({
            type: "customrecord_elem_contract_subscriptions",
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
        log.debug('checkSubscriptionNumber', 'searchResultCount: ' + searchResultCount);
        return searchResultCount > 0;
    }
    const saveRecord = (context) => {
        let currentRecord = context.currentRecord;
        let newSubNum = currentRecord.getValue({fieldId: 'name'});
        log.debug('saveRecord', 'newSubNum: ' + newSubNum);
        try {
            if (checkSubscriptionNumber(newSubNum)) {
                dialog.alert({
                    title: 'Subscription Number ' + newSubNum + ' already exist',
                    message: 'Please use another number or pickup the existing one from the list'
                });
                return false;
            }
        } catch (e) {
            dialog.alert({
                title: 'Cannot save ' + newSubNum,
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
