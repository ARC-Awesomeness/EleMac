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
 * 1.0.0      29 Mar 2023     Adam McComber    Initial version
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define(['N/error', 'N/record', 'N/redirect', 'N/search', 'N/task', 'N/ui/message', 'N/ui/serverWidget', 'N/url'],
    (error, record, redirect, search, task, message, ui, url) => {
        const onRequest = (context) => {
            const title = 'onRequest';
            try {
                if(context.request.method === 'GET') {
                    try {
                        let form = ui.createForm({
                            title: 'Trigger MRR/ARR Data Reset script'  //Trigger Scheduled JOB manually
                        });
                        form.addSubmitButton({label: 'Run MRR/ARR Reset script 2'});
                        context.response.writePage(form);
                    } catch (e) {
                        log.error(title, 'Error while initiating form due to: ' + e.message);
                    }
                } else {
                    try {

                        let _contract = "2019-555";

                        log.debug("contract", _contract);

                        let mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                        mrTask.scriptId = 'customscript_elemac_mrr_mr_contr_reset';
                        mrTask.deploymentId = 'customdeploy_elemac_mrr_mr_contr_reset';
                        mrTask.params = {
                            custscript_contractparam : _contract
                        };

                        log.debug("task", mrTask);

                        let mrTaskId = mrTask.submit();
                        let taskStatus = task.checkStatus(mrTaskId);
                        log.debug(title, "taskStatus: " + taskStatus);
                    } catch (e) {
                        log.error(title, 'Error in triggering the script' + e);
                        context.response.write('Unable to trigger the script due to :' + e.message);
                    }
                }
            } catch (e) {
                log.error(title, 'Error while creating screen: ' + e);
                context.response.write('Error while creating screen due to: ' + e.message);
            }
        }
        return {
            onRequest: onRequest
        };
    });
