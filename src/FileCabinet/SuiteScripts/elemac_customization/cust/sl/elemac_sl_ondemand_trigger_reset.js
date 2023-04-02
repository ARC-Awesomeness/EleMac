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

                    build_form("");

                } else {
                    try {

                        log.debug('parameters', context.request.parameters);

                        let _contract = context.request.parameters.custpage_contract;
                        log.debug("contract", _contract);

                        let _createdFrom = context.request.parameters.custpage_createdfrom; //"Invoice #INV-1397";
                        log.debug("Created From", _createdFrom);

                        let mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                        mrTask.scriptId = 'customscript_elemac_mrr_mr_contr_reset';
                        mrTask.deploymentId = 'customdeploy_elemac_mrr_mr_contr_reset';
                        mrTask.params = {
                            custscript_contractparam : _contract,
                            custscript_createdfromparam : _createdFrom
                        };

                        log.debug("task", mrTask);

                        let mrTaskId = mrTask.submit();
                        let taskStatus = task.checkStatus(mrTaskId);
                        log.debug(title, "taskStatus: " + taskStatus);

                        build_form("RESET HAS BEEN TRIGGERED");

                    } catch (e) {
                        log.error(title, 'Error in triggering the script' + e);
                        context.response.write('Unable to trigger the script due to :' + e.message);
                    }
                }

                function build_form(infomessage) {

                    try {
                        let form = ui.createForm({
                            title: 'Trigger MRR/ARR Data Reset script' 
                        });

                        if (infomessage === "") {

                            form.addSubmitButton({label: 'Run MRR/ARR Reset script'});

                            var _contractField = form.addField({
                                id : 'custpage_contract',
                                type : ui.FieldType.TEXT,
                                source : '_contractdata',
                                label : 'Contract'
                            });

                            var _createdFromField = form.addField({
                                id : 'custpage_createdfrom',
                                type : ui.FieldType.TEXT,
                                source : '_createfromdata',
                                label : 'Created From'
                            });

                        }
                        else {

                            var _infoMessage = form.addField({
                                id : 'custpage_infomessage',
                                type : ui.FieldType.LABEL,
                                label: 'initializing'
                            });

                            _infoMessage.label = infomessage;

                        }

                        context.response.writePage(form);

                    } catch (e) {
                        log.error(title, 'Error while initiating form due to: ' + e.message);
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
