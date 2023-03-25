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
 * 1.0.0      15 Nov 2022     Bruce Do         Initial version
 */
/**
 *@NApiVersion 2.1
 *@NModuleScope SameAccount
 *@NScriptType Suitelet
 */
define(['N/error', 'N/record', 'N/redirect', 'N/search', 'N/ui/message', 'N/ui/serverWidget','N/task','N/url'],
    function(error, record, redirect, search, message, ui,task,url) {
        const onRequest = (context) => {
            const title = 'onRequest';
            try {
                if(context.request.method === 'GET') {
                    try {
                        let form = ui.createForm({
                            title: 'Trigger MRR/ARR Data script'  //Trigger Scheduled JOB manually
                        });
                        form.addSubmitButton({label: 'Run MRR/ARR script'});
                        context.response.writePage(form);
                    } catch (e) {
                        log.error(title, 'Error while initiating form due to: ' + e.message);
                    }
                } else {
                    try {
                        let mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                        mrTask.scriptId = '1079';
                        mrTask.deploymentId = 'customdeploy_elemac_mr_mrr_calculation';
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