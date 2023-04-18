/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record"], function(record) {
    function beforeLoad(context) {
        var contractRecord = context.newRecord;
        log.debug('test', contractRecord );

        var url = contractRecord.getField({
            fieldId: "entryformquerystring"
        });
        var urls = contractRecord.getValue({fieldId: 'entryformquerystring'});

        log.debug('urls', urls );

        var cust = JSON.stringify(urls);
        log.debug('cust', cust);

        var entity = urls.split('entity=')[1];
        log.debug('entity', entity );

        var customerField = contractRecord.getField({
            fieldId: "custrecord_elem_cont_num_customer"
        });
        log.debug('customerField', customerField );
        contractRecord.setValue({
            fieldId: 'custrecord_elem_sub_num_customer',
            value: entity,
            ignoreFieldChange: true
        });

        // set the default value of the customer field to a specific customer
        //  customerField.defaultValue = entity;
        log.debug('default set' );
    }

    return {
        beforeLoad: beforeLoad
    };
});