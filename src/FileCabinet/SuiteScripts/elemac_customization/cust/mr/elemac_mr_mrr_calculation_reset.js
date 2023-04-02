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

            var _currentScript = runtime.getCurrentScript();
            var _contractNumber = _currentScript.getParameter({name: 'custscript_contractparam'});
            log.debug("contract", _contractNumber);

            var _createdFrom = _currentScript.getParameter({name: 'custscript_createdfromparam'});
            log.debug("Created From", _createdFrom);

            var _period = "";


            var _documentNumber = "";


            let contractSearch = search.create({
                type: elemac_const.CustRecords.ELEM_CONTRACT,
                filters:
                    [
                        //["name","is",_contractNumber]

                        search.createFilter({
                            name: 'name',
                            join: 'custrecord_elem_cont_number',
                            operator: search.Operator.IS,
                            values: [_contractNumber]
                        })//,
                        // search.createFilter({
                        //     name: 'number',
                        //     join: 'custrecord_elem_cont_so_number',
                        //     //operator: search.Operator.ISEMPTY
                        //     operator: search.Operator.ANYOF,
                        //     values: [_documentNumber]
                        // })
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
                        }),
                        search.createColumn({name: elemac_const.ContCustFields.CONTRACT_CREATED_FROM, label: "Created From"})

                    ]
            });

            log.debug("past the search", "");

            log.debug(("search"), contractSearch);

            return contractSearch;

        }

        function map (context) {

            const title = "elemac_mr_reset_contracts.map";
            //log.debug(title, "context: " + context);

            var _currentScript = runtime.getCurrentScript();
            var _contractNumber = _currentScript.getParameter({name: 'custscript_contractparam'});
            log.debug("contract", _contractNumber);

            var _createdFrom = _currentScript.getParameter({name: 'custscript_createdfromparam'});
            log.debug("Created From", _createdFrom);


            let value = JSON.parse(context.value);

            let contextvalues = JSON.stringify(context.value);
            log.debug("contextvalues", contextvalues);

            let _documentNumber = value.values.custrecord_elem_cont_so_number.text;
            log.debug("_documentNumber", '|' + _documentNumber + '|');

            let _targetDocumentNumber = _createdFrom; //"" //"Invoice #INV-1397";
            log.debug("_targetDocumentNumber", _targetDocumentNumber);

            if(_documentNumber == null) {

                log.debug("EMPTY VERIFICATION");

            }

            if (_documentNumber == _targetDocumentNumber || (_documentNumber == null && _targetDocumentNumber == null)){

                try {

                    //let _obj = JSON.parse(contextvalues);
                    //log.debug("_obj", _obj);

                    let _contract = value.values.custrecord_elem_cont_number.text;
                    log.debug("_contract", _contract);

                    let _period = value.values.custrecord_elem_cont_period.text;
                    log.debug("_period", _period);

                    let _customer = value.values.custrecord_elem_cont_number.text;
                    log.debug("_customer", _customer);


                    //log.debug(title, "values: " + value);
                    let contId = value.id;
                    log.debug(title, "deleting contract " + contId);

                    // record.delete({
                    //     type: 'customrecord_elem_contracts_data',
                    //     id: contId
                    // });
                } catch (e) {
                    log.error(title, "error: " + e);
                }

            }


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
