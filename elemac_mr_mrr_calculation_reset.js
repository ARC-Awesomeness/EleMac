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
                        search.createColumn({name: "internalid", label: "Internal ID"}),
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
                        search.createColumn({name: elemac_const.ContCustFields.CONTRACT_CREATED_FROM, label: "Created From"}),
                        search.createColumn({
                            name: "custrecord_elem_sub_contract",
                            join: "CUSTRECORD_ELEM_SUB_CONTRACT",
                            label: "Contract"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_ELEM_SUB_CONTRACT",
                            label: "Internal ID"
                        })

                    ]
            });

            log.debug("past the search", "");

            log.debug("search loading");
            return contractSearch;
            // return search.load({id: 'customsearch1061'});  //in ui

        }

        function map (context) {
            var contextvalues = JSON.stringify(context.value);
            log.debug("contextvalues", contextvalues);
            log.debug( "context:",  context);

            var _currentScript = runtime.getCurrentScript();
            var _contractNumber = _currentScript.getParameter({name: 'custscript_contractparam'});
            log.debug("contract", _contractNumber);
            var _createdFrom = _currentScript.getParameter({name: 'custscript_createdfromparam'});
            log.debug("Created From", _createdFrom);

            var resultValues = context.value;
            log.debug("resultValues: ", resultValues);
            var searchRes = JSON.parse(resultValues);
            log.debug("searchRes: ", searchRes);
            var testing = searchRes.values;
            log.debug("testing", testing);
            var _documentNumber = testing.custrecord_elem_cont_so_number.text;
            log.debug("_documentNumber", _documentNumber);

            var _targetDocumentNumber = _createdFrom; //"" //"Invoice #INV-1397";
            log.debug("_targetDocumentNumber", _targetDocumentNumber);

            if(_documentNumber == null) {

                log.debug("EMPTY VERIFICATION");

            }

            if (_documentNumber == _targetDocumentNumber || (_documentNumber == null && _targetDocumentNumber == null)){
                log.debug("match found in if", )
                try {

                    var _contract = testing.custrecord_elem_cont_number.text;
                    log.debug("_contract", _contract);

                    var _period = testing.custrecord_elem_cont_period.text;
                    log.debug("_period", _period);

                    var _customer = testing.custrecord_elem_cont_number.text;
                    log.debug("_customer", _customer);

                    var contId = testing.internalid.value;
                    log.debug("deleting contract id", contId);

                    //related subscription record id- multiple?
                    var subsId = testing.internalid.CUSTRECORD_ELEM_SUB_CONTRACT.text;
                    // var subsId=testing.getValue({
                    //   name: 'internalid',
                    //   join: 'CUSTRECORD_ELEM_SUB_CONTRACT'
                    //  });

                    //   var subsId = 16421;
                    log.debug("deleting subscription id", subsId);
                    //do they need to delete saas contract number record too- customrecord_elem_contract_numbers?

                    //need to delete subscription data records first to delete this contract data record

                    record.delete({
                        type: 'customrecord_elem_subscriptions_data',
                        id: subsId
                    });
                    log.debug("deleted subscrip");

                    record.delete({
                        type: 'customrecord_elem_contracts_data',
                        id: contId
                    });
                    log.debug("deleted contract");
                } catch (e) {
                    log.error("error: ", e);
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