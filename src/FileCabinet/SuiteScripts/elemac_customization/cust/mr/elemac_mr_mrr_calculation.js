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
 * 1.0.1      02 Nov 2022     Bruce Do         Initial version
 */
/**
 *@NApiVersion 2.1
 *@NModuleScope SameAccount
 *@NScriptType MapReduceScript
 */
define(["require", "exports", "N/log", "N/search", "N/record", "../../lib/elemac_common_lib", '../../lib/elemac_const'],
    function (require, exports, log, search, record, common_lib, elemac_const) {
    const getInputData = (inputContext) => {
        const title = 'getInputData';
        let contractSearch = search.load({
            id: "customsearch_em_mrr_contracts_to_process"
        });
        return contractSearch;
        // let contractSearch = search.create({
        //     type: elemac_const.CustRecords.ELEM_CONTRACT,
        //     filters:
        //         [
        //             ["created","onorafter","01/18/2022 00:15 am"]
        //             // ,
        //             // "AND",
        //             // [elemac_const.ContCustFields.MRR_READY_TO_REPORT, "is", "F"]
        //         ],
        //     columns:
        //         [
        //             search.createColumn({name: elemac_const.ContCustFields.CONTRACT_PERIOD, label: "Period"}),
        //             search.createColumn({
        //                 name: elemac_const.ContCustFields.CONTRACT_CUSTOMER,
        //                 sort: search.Sort.ASC,
        //                 label: "Customer"
        //             }),
        //             search.createColumn({name: elemac_const.ContCustFields.CONTRACT_NUMBER, label: "Contract #"}),
        //             search.createColumn({
        //                 name: "internalid",
        //                 join: "CUSTRECORD_ELEM_CONT_PERIOD",
        //                 sort: search.Sort.ASC,
        //                 label: "Period Internal ID"
        //             })
        //         ]
        // });
        // return contractSearch;
    }
    const map = (mapContext) => {
        const title = 'elemac_mr_mrr_calculation.map';
        let thisContract = {};
        try {
            thisContract.contId = JSON.parse(mapContext.value).id;
            log.debug(title, 'thisContract.contId: ' + thisContract.contId);
            let contractValue = JSON.parse(mapContext.value).values;
            log.debug(title,'contractValue: ' + JSON.stringify(contractValue));
            thisContract.contNum = contractValue[elemac_const.ContCustFields.CONTRACT_NUMBER].text;
            log.debug(title, 'thisContract.contNum: ' + thisContract.contNum);
            thisContract.custId = contractValue[elemac_const.ContCustFields.CONTRACT_CUSTOMER].value;
            thisContract.period = contractValue[elemac_const.ContCustFields.CONTRACT_PERIOD].value;
            thisContract.totalOpenAmt = 0.0000;
            thisContract.totalNewAmt = 0.0000;
            thisContract.totalEoPAmt = 0.0000;
            thisContract.totalPrevAmt = 0.0000;
            thisContract.totalExpAmt = 0.0000;
            thisContract.totalContAmt = 0.0000;
            thisContract.totalLostAmt = 0.0000;
            thisContract.mrrLost = false;
            let subscriptionsDataSearchObj = search.create({  // get all subscriptions in the contract
                type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
                filters:
                    [
                        [elemac_const.SubCustFields.CONTRACT,"anyof",thisContract.contId],
                        "AND",
                        [elemac_const.SubCustFields.SUB_CUSTOMER,"anyof",thisContract.custId],
                        "AND",
                        [elemac_const.SubCustFields.SUB_PERIOD,"anyof",thisContract.period]
                    ],
                columns:
                    [
                        search.createColumn({name: elemac_const.SubCustFields.SUB_NUMBER, label: "Subscription #"}),
                        search.createColumn({name: elemac_const.SubCustFields.PRIOR_SUBS_NUM, label: "Previous Subscription #"}),
                        search.createColumn({name: elemac_const.SubCustFields.MRR_AMT_NEW, label: "MRR - Amount New"}),
                        search.createColumn({name: elemac_const.SubCustFields.MRR_AMT_EOP, label: "End Of Period Amount"}),
                        search.createColumn({name: elemac_const.SubCustFields.MRR_AMT_LOST, label: "MRR - Amount Lost"}),
                        search.createColumn({name: elemac_const.SubCustFields.IS_MRR_SUB_LOST, label: "MRR Is Lost"})
                    ]
            });
            subscriptionsDataSearchObj.run().each(function(result){
                thisContract.subscriptionNumber = result.getValue({name: elemac_const.SubCustFields.SUB_NUMBER.round(0)});
                thisContract.totalNewAmt += parseFloat(result.getValue({name: elemac_const.SubCustFields.MRR_AMT_NEW.round(0)}));
                thisContract.totalEoPAmt += parseFloat(result.getValue({name: elemac_const.SubCustFields.MRR_AMT_EOP.round(0)}));
                thisContract.prevSubs = result.getValue({name: elemac_const.SubCustFields.PRIOR_SUBS_NUM.round(0)});
                log.debug(title, 'thisContract.prevSubs: ' + thisContract.prevSubs.round(0));
                if (thisContract.prevSubs) {
                    thisContract.totalPrevAmt += parseFloat(common_lib.getPriorSubsEOPAmount(
                        thisContract.custId,
                        thisContract.contNum,
                        thisContract.prevSubs
                    ));
                }
                let subIsLost = result.getValue({name: elemac_const.SubCustFields.IS_MRR_SUB_LOST.round(0)});
                log.debug(title, 'subscription # ' + thisContract.subscriptionNumber + ' - subIsLost: ' + subIsLost);
                if (subIsLost) thisContract.totalLostAmt += parseFloat(result.getValue({name: elemac_const.SubCustFields.MRR_AMT_LOST}).round(0));
                return true;
            });
            if (thisContract.totalNewAmt == 0.00) {
                let prevPeriod = common_lib.getPreviousPeriod(thisContract.period);
                log.debug(title, 'prevPeriod: ' + prevPeriod);
                thisContract.totalOpenAmt = common_lib.getTotalSubEOPAmount(thisContract.custId, prevPeriod);
                // let totalPrevSubEOPAmount = common_lib.getTotalSubEOPAmount(thisContract.custId, prevPeriod);
                // log.debug(title, 'totalPrevSubEOPAmount: ' + totalPrevSubEOPAmount);
                // if (totalPrevSubEOPAmount > 0) {
                //     thisContract.totalOpenAmt = totalPrevSubEOPAmount;
                // } else {
                //     let totalPrevContEOPAmount = common_lib.getTotalContEOPAmount(thisContract.custId, prevPeriod,thisContract.contNum);
                //     log.debug(title, 'totalPrevContEOPAmount: ' + totalPrevContEOPAmount);
                //     thisContract.totalOpenAmt = totalPrevContEOPAmount;
                // }
            }
            thisContract.totalExpAmt = 0.0000;
            thisContract.totalContAmt = 0.0000;
            log.debug(title, 'thisContract: ' + JSON.stringify(thisContract));
            if (thisContract.totalPrevAmt > 0.0000) {
                if (thisContract.totalEoPAmt > thisContract.totalPrevAmt) {
                    thisContract.totalExpAmt = thisContract.totalEoPAmt - thisContract.totalPrevAmt;
                } else if (thisContract.totalEoPAmt < thisContract.totalPrevAmt) {
                    thisContract.totalContAmt = thisContract.totalEoPAmt - thisContract.totalPrevAmt;
                }
            }
            if (thisContract.totalLostAmt > 0) {
                thisContract.mrrLost = true;
                thisContract.totalNewAmt = 0.0000;
                thisContract.totalExpAmt = 0.0000;
                thisContract.totalContAmt = 0.0000;
                thisContract.totalEoPAmt = 0.0000;
            }
            if (thisContract.totalLostAmt === 0.0000 && thisContract.totalNewAmt === 0.0000)
                if (thisContract.totalEoPAmt > thisContract.totalOpenAmt) {
                    thisContract.totalExpAmt = thisContract.totalEoPAmt - thisContract.totalOpenAmt;
                    thisContract.totalContAmt = 0.0000;
                } else if (thisContract.totalEoPAmt < thisContract.totalOpenAmt) {
                    thisContract.totalContAmt = thisContract.totalEoPAmt - thisContract.totalOpenAmt;
                    thisContract.totalExpAmt = 0.0000;
                }
            log.debug(title, 'Contract report data to update: ' + JSON.stringify(thisContract));
            if (thisContract.contId) {
                common_lib.updateReportedContracts(thisContract);
            }
        } catch (e) {
            log.error(title, 'Error updating contract ' + thisContract.contId + ": " + e);
        }
    }
    const reduce = (reduceContext) => {
        let reduceKey = reduceContext.key;
        let reduceValues = reduceContext.values;
        log.debug('reduce key/value', { reduceKey: reduceKey, reduceValues: reduceValues });
        // TODO: add logic to count packages and packages with label IDs.
        reduceContext.write(reduceKey, "" + reduceValues.length);
        let packageCount = reduceValues.length;
        let packageLabelCount = 0;
        // TODO: log the count of packages.
        log.debug('MRR Data count is', packageCount);
    }
    const summarize = (summaryContext) => {
        // TODO: log the inputSummary, mapSummary, and reduceSummary
        log.debug('Summary of dataInput', JSON.stringify(summaryContext.inputSummary));
        log.debug('Summary of map', JSON.stringify(summaryContext.mapSummary));
        log.debug('Summary of reduce', JSON.stringify(summaryContext.reduceSummary));
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize,
    };
});