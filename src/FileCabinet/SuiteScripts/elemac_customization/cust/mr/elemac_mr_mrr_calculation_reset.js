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
 * Version    Date            Author            Remarks
 * 1.0.1      29 Mar 2023     Adam McComber     Initial version
 */

/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/format', 'N/record', 'N/runtime', 'N/search', "../../lib/elemac_common_lib", '../../lib/elemac_const'],
    (email, format, record, runtime, search, common_lib, elemac_const) => {

        function getInputData (context) {


            log.debug("starting", "");

            log.debug("context", context);

            var _currentScript = runtime.getCurrentScript();

            log.debug("getCurrentScript()", _currentScript);

            var _contractNumber = _currentScript.getParameter({name: 'custscript_contractparam'});

            log.debug("contract", _contractNumber);

            _contractNumber = "2019-555";

            log.debug("contract-manual", _contractNumber);

            let contractSearch = search.create({
                type: elemac_const.CustRecords.ELEM_CONTRACT,
                filters:
                    [
                        ["name","is",_contractNumber]
                    ],
                columns:
                    [
                        search.createColumn({name: elemac_const.ContCustFields.CONTRACT_PERIOD, label: "Period"}),
                        search.createColumn({
                            name: elemac_const.ContCustFields.CONTRACT_CUSTOMER,
                            sort: search.Sort.ASC,
                            label: "Customer"
                        }),
                        search.createColumn({name: elemac_const.ContCustFields.CONTRACT_NUMBER, label: "Contract #"}),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_ELEM_CONT_PERIOD",
                            sort: search.Sort.ASC,
                            label: "Period Internal ID"
                        })
                    ]
            });

            log.debug("past the search", "");

            log.debug(("search"), contractSearch);

            return contractSearch;

        }

        function map (context) {

            const title = "elemac_mr_reset_contracts.map";
            log.debug(title, "context: " +context);


            // try {
            //     let value = JSON.parse(context.value);
            //     log.debug(title, "values: " + value);
            //     let contId = value.id;
            //     log.debug(title, "deleting contract " + contId);
            //     record.delete({
            //         type: 'customrecord_elem_contracts_data',
            //         id: contId
            //     });
            // } catch (e) {
            //     log.error(title, "error: " + e);
            // }

        }

        function reduce () {

        }


        function summarize (context)  {

        }

        return {
            getInputData:  getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize}

    });
