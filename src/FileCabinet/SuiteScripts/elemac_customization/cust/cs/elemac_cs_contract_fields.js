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
 * 1.0.0                      Chris Cannata    Initial version
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

    const fieldChanged = (context) => {
      let currentRecord = context.currentRecord;
        // log.debug('fieldChanged', 'context.fieldId: ' + context.fieldId);
      if(context.fieldId == 'custbody_elem_create_contract_rec'){
        let createContractRecRequested = currentRecord.getValue({
            fieldId: 'custbody_elem_create_contract_rec'
        });
        log.debug('fieldChanged', 'createContractRecRequested: ' + createContractRecRequested);
          // let contractPeriod = context.currentRecord.getField({fieldId: 'custbody_elem_contract_rec_period'});
          let contractStartDate = context.currentRecord.getField({fieldId: 'custbody_elem_contracts_start_date'});
          let contractEndDate = context.currentRecord.getField({fieldId: 'custbody_elem_contracts_end_date'});
          let contractSubscriptionNumber = context.currentRecord.getField({fieldId: 'custbody_elem_line_sub_number'});
          let contractNumber = context.currentRecord.getField({fieldId: 'custbody_elem_mrr_contract_number'});
        if (createContractRecRequested == true) {
          // contractPeriod.isMandatory = true;
          contractStartDate.isMandatory = true;
          contractEndDate.isMandatory = true;
          contractSubscriptionNumber.isMandatory = true;
          contractNumber.isMandatory = true;
          return true;
        } else {
          // contractPeriod.isMandatory = false;
          contractStartDate.isMandatory = false;
          contractEndDate.isMandatory = false;
          contractSubscriptionNumber.isMandatory = false;
          contractNumber.isMandatory = false;
          return true;
        }
      }
    }
    const saveRecord = (context) => {
      let currentRecord = context.currentRecord;
      let mandatoryFieldsNotFound = [];
      let createContractRecRequested = currentRecord.getValue({
          fieldId: 'custbody_elem_create_contract_rec'
      });

      if (createContractRecRequested == true) {
        // let contractPeriod = currentRecord.getValue({
        //     fieldId: 'custbody_elem_contract_rec_period'
        // });
        let contractStartDate = currentRecord.getValue({
            fieldId: 'custbody_elem_contracts_start_date'
        });
        let contractEndDate = currentRecord.getValue({
            fieldId: 'custbody_elem_contracts_end_date'
        });
        let contractSubscriptionNumber = currentRecord.getValue({
            fieldId: 'custbody_elem_line_sub_number'
        });
        let contractNumber = currentRecord.getValue({
            fieldId: 'custbody_elem_mrr_contract_number'
        });

        // if (!contractPeriod) mandatoryFieldsNotFound.push('Contracts Period');
        if (!contractStartDate) mandatoryFieldsNotFound.push('Contracts Start Date');
        if (!contractEndDate) mandatoryFieldsNotFound.push('Contracts End Date');
        if (!contractSubscriptionNumber) mandatoryFieldsNotFound.push('Contracts Sub Number');
        if (!contractNumber) mandatoryFieldsNotFound.push('Contracts Number');

        if (mandatoryFieldsNotFound.length > 0) {
          let messageToDisplay = ''
          for (let i = 0; i < mandatoryFieldsNotFound.length; i++) {
            if (i == 0) messageToDisplay += mandatoryFieldsNotFound[i]
            else messageToDisplay += ", " + mandatoryFieldsNotFound[i]
          }
          dialog.alert({
        		title: 'Mandatory Field(s) Missing!',
        		message: messageToDisplay
        	})
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    }

});
