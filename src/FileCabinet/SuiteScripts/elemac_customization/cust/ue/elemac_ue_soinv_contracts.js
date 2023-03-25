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
 * ===================================================================
 * Version    Date            Author           Remarks
 * 1.0.0      10 Oct 2022     Bruce Do         Initial version
 */
/**
 *@NApiVersion 2.1
 *@NModuleScope SameAccount
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/currentRecord', 'N/ui/serverWidget', 'N/search', "../../lib/elemac_common_lib", "../../lib/elemac_const"],
    function (record, currentRecord, ui, search, common_lib, elemac_const) {
  const afterSubmit = (context) => {
    const title = 'afterSubmit';
    if (context.newRecord.getValue(elemac_const.TranCustFields.TO_CREATE_CONTRACT_RECORD)) {
      let transactionRec = context.newRecord;
      const tranId = transactionRec.getValue('id');
      let transactionType = transactionRec.getValue('type');
      log.debug(title, 'transactionType: ' + transactionType);
      let createdFrom = transactionRec.getValue('createdfrom');
      log.debug(title, 'createdFrom: ' + createdFrom);
      if (transactionType == 'custinvc' && createdFrom) return;
      if (transactionType == 'custcred') { // && createdFrom
        // log.debug(title, 'Credit Memo ' + tranId + ' is created from invoice ' + createdFrom + '. Deleting all subscriptions.');
        log.debug(title, 'Credit Memo ' + tranId + ' is created.');
        let creditedInvoices = [];
        creditedInvoices = getCreditedInvoices(tranId);
        log.debug(title, 'creditedInvoices: ' + JSON.stringify(creditedInvoices));
        if (!creditedInvoices || creditedInvoices.length == 0) return;
        for (let i=0; i<creditedInvoices.length;i++) {
          if (creditedInvoices[i].appliedAmount == creditedInvoices[i].invoiceAmount) {
            log.debug(title, 'Invoice ' + creditedInvoices[i].internalId + ' is fully credited. Deleting all subscriptions.');
            deleteInvoiceSubscriptions(creditedInvoices[i].internalId);
          } else {
            log.debug(title, 'Invoice ' + creditedInvoices[i].internalId + ' is partial credited. Adjust all subscriptions.');
            createContractRecordEntry(context);
          }
        }
        return;
      }
      let contractAlreadyCreated = transactionRec.getValue(elemac_const.TranCustFields.CONTRACT_RECORD_ALREADY_CREATED);
      if (context.type == context.UserEventType.EDIT && contractAlreadyCreated == false) { // User edit SO/Inv/CM to adjust amount
        deleteInvoiceSubscriptions(tranId); // Delete all Subscription lines to create it again
      }
      createContractRecordEntry(context);
    }
  }
  const getCreditedInvoices = (tranId) => {
    let creditedInvoices = [];
    let creditmemoSearchObj = search.create({
      type: "creditmemo",
      filters:
          [
            ["type","anyof","CustCred"],
            "AND",
            ["appliedtolinkamount","greaterthan","0.00"],
            "AND",
            ["internalid","anyof",tranId]
          ],
      columns:
          [
            search.createColumn({name: "appliedtotransaction", label: "Applied To Transaction"}),
            search.createColumn({name: "appliedtolinkamount", label: "Applied To Link Amount"}),
            search.createColumn({
              name: "amount",
              join: "appliedToTransaction",
              label: "Amount"
            })
          ]
    });
    let searchResultCount = creditmemoSearchObj.runPaged().count;
    if (searchResultCount == 0) return creditedInvoices;
    creditmemoSearchObj.run().each(function(result) {
      let credInv = {};
      credInv.internalId = result.getValue({name: "appliedtotransaction"});
      credInv.appliedAmount = result.getValue({name: "appliedtolinkamount"});
      credInv.invoiceAmount = result.getValue({
        name: "amount",
        join: "appliedToTransaction"
      });
      creditedInvoices.push(credInv);
      return true;
    });
    return creditedInvoices;
  }
  const deleteInvoiceSubscriptions = (tranId) => {
    const title = 'deleteInvoiceSubscriptions';
    let invSubSearchObj = search.create({
      type: "customrecord_elem_subscriptions_data",
      filters:
          [
            ["created", "onorafter", "12/06/2022 12:00 am", "12/05/2022 12:00 am"],
            "AND",
            ["custrecord_elem_sub_created_from.internalid", "anyof", tranId]
          ],
      columns:
          [
            search.createColumn({name: "id", label: "ID"})
          ]
    });
    invSubSearchObj.run().each(function(result){
      let subId = result.getValue({name: 'id'});
      log.debug(title, 'Deleting subscription ' + subId);
      try {
        record.delete({
          type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
          id: subId
        });
      } catch (e) {
        log.error(title, 'Error deleting subscription ' + subId + ': ' + e);
      }
      return true;
    });
  }
  const createContractRecordEntry = (ctx) => {
    const title = 'createContractRecordEntry';
    try {
      let transactionRec = ctx.newRecord;
      let transactionType = transactionRec.getValue('type');
      log.debug(title, "transactionType: " + transactionType);
      let contractDataObj = {};
      contractDataObj.transactionRecID = transactionRec.getValue('id');
      contractDataObj.transactionType = transactionType;
      let contractAlreadyCreated = transactionRec.getValue(elemac_const.TranCustFields.CONTRACT_RECORD_ALREADY_CREATED);
      if (contractAlreadyCreated == true) {
        log.audit(title, 'Contract Data already generated for the record.');
      } else {
        let loadedTransactionRecord = null;
        if (transactionType == 'salesord') {
          loadedTransactionRecord = record.load({
            "type": record.Type.SALES_ORDER,
            "id": contractDataObj.transactionRecID,
            "isDynamic": true
          });
        } else if (transactionType == 'custinvc') {
          loadedTransactionRecord = record.load({
            "type": record.Type.INVOICE,
            "id": contractDataObj.transactionRecID,
            "isDynamic": true
          });
        }
        else if (transactionType == 'custcred') {
          loadedTransactionRecord = record.load({
            "type": record.Type.CREDIT_MEMO,
            "id": contractDataObj.transactionRecID,
            "isDynamic": true
          });
        }
        let tranData = {};
        if (loadedTransactionRecord) {
          tranData = common_lib.getTranData(loadedTransactionRecord);
        } else {
          log.debug(title, 'loadedTransactionRecord is null');
          return;
        }
        log.debug(title, 'tranData: ' + JSON.stringify(tranData));
        if (common_lib.isEmpty(tranData)) {
          log.debug(title, 'No tranData to process!');
          return;
        }
        if (tranData.tranTotalAmount == 0.0000) {
          log.debug(title, 'tranData.tranTotalAmount == 0.0000');
          return;
        }
        // if (common_lib.isEmpty(tranData.allRevStartDate) || common_lib.isEmpty(tranData.allRevEndDate)) {
        //   log.debug(title, 'tranData.allRevStartDate: ' + tranData.allRevStartDate + ', tranData.allRevEndDate: ' + tranData.allRevEndDate);
        //   return;
        // }

        contractDataObj.customerID = transactionRec.getValue('entity');
        contractDataObj.contractNumber = transactionRec.getValue(elemac_const.TranCustFields.CONTRACT_NUMBER);
        log.debug(title, 'contractNumber: ' + contractDataObj.contractNumber);
        let contractNameObj = search.lookupFields({
          type: 'customrecord_elem_contract_numbers',
          id: contractDataObj.contractNumber,
          columns: ['name']
        });
        contractDataObj.contractName = contractNameObj.name;
        contractDataObj.subscriptionNumber = transactionRec.getValue(elemac_const.TranCustFields.CONTRACT_SUBSCRIPTION_NUMBER);
        log.debug(title, 'subscriptionNumber: ' + contractDataObj.subscriptionNumber);
        let subscriptionNameObj = search.lookupFields({
          type: 'customrecord_elem_contract_subscriptions',
          id: contractDataObj.subscriptionNumber,
          columns: ['name']
        });
        contractDataObj.subscriptionName = subscriptionNameObj.name;
        contractDataObj.previousSubscriptions = transactionRec.getValue(elemac_const.TranCustFields.PREVIOUS_CONTRACT_NUMBER);
        contractDataObj.contractStart = transactionRec.getValue(elemac_const.TranCustFields.CONTRACT_START_DATE);
        if (common_lib.isEmpty(contractDataObj.contractStart)) contractDataObj.contractStart = tranData.revStartDate;
        contractDataObj.contractEnd = transactionRec.getValue(elemac_const.TranCustFields.CONTRACT_END_DATE);
        if (common_lib.isEmpty(contractDataObj.contractEnd)) contractDataObj.contractEnd = tranData.revEndDate;
        log.debug(title, 'contractDataObj: ' + JSON.stringify(contractDataObj))
        // let contractStartDateValue = new Date(contractDataObj.contractStart);
        // let contractEndDateValue = new Date(contractDataObj.contractEnd);
        let contractStartDateValue = contractDataObj.contractStart;
        let contractEndDateValue = contractDataObj.contractEnd;
        let contractStartMonth = contractStartDateValue.getMonth();
        let contractStartYear = contractStartDateValue.getFullYear();
        let contractStartDay = contractStartDateValue.getDay();
        log.debug(title, 'Contract Start Day - Month - Year: ' + contractStartDay + " - " + contractStartMonth + " - " + contractStartYear);
        let contractEndYear = contractEndDateValue.getFullYear();
        let contractEndMonth = contractEndDateValue.getMonth();
        contractDataObj.numberOfYears = contractEndYear - contractStartYear;
        let firstSubPeriod = common_lib.getSubscriptionStartPeriod((contractStartMonth + 1) + '/01/' + contractStartYear);
        if (contractDataObj.contractStart && contractDataObj.contractEnd) {
          log.debug(title, 'contractStartDateValue: ' + contractStartDateValue);
          log.debug(title, 'contractEndDateValue: ' + contractEndDateValue);
          log.debug(title, 'contractStartMonth: ' + contractStartMonth);
          log.debug(title, 'contractEndMonth: ' + contractEndMonth);
          let days360 = common_lib.getDays360(contractDataObj.contractStart, contractDataObj.contractEnd);
          log.debug(title, 'days360: ' + days360);
          contractDataObj.numOfDays360Months = days360 / 30;
          contractDataObj.numOfMonth = (contractEndMonth - contractStartMonth) + 1 + (contractDataObj.numberOfYears * 12);
        } else {
          contractDataObj.numOfDays360Months = 0;
          contractDataObj.numOfMonth = 0;
        }

        let totalAmountPerMonth = parseFloat(tranData.tranTotalAmount + '') / (contractDataObj.numOfDays360Months);
        log.debug(title, 'totalAmountPerMonth: ' + totalAmountPerMonth);
        contractDataObj.amtOpen = 0.0000;
        contractDataObj.amtLost = 0.0000;
        contractDataObj.amtContraction = 0.0000;
        contractDataObj.amtExpansion = 0.0000;
        contractDataObj.amtEOP = totalAmountPerMonth;
        contractDataObj.mrrLost = false;
        let contractRecord = null;
        // Here is where we determine if this amount is new
        const dateFormatted = [contractStartMonth + 1, '01', contractStartYear].join('/');
        // log.debug(title, 'Contract Start Date Formatted: ' + dateFormatted);
        let MRRExists = common_lib.checkExistingMRRContracts(contractDataObj.contractNumber, null);
        contractDataObj.contRecId = null;
        contractDataObj.subRecId = null;
        if (MRRExists) {
          contractDataObj.amtNew = 0.0000;
          // if (contractDataObj.transactionType !== 'custcred') {
          //   contractDataObj.amtNew = 0.0000;
          // } else {
          //   contractDataObj.amtNew = totalAmountPerMonth;
          // }
          contractDataObj.contRecId = common_lib.getMonthlyMRRContract(contractDataObj.contractNumber, firstSubPeriod);
          if (common_lib.isEmpty(contractDataObj.contRecId)) contractDataObj.contRecId = common_lib.createMonthlyContractRec(contractDataObj, firstSubPeriod);
        } else {
          contractDataObj.amtNew = totalAmountPerMonth; // new contract -> new amount
          // Create a new Monthly Contract to make sure it has new amount
          contractDataObj.contRecId = common_lib.createMonthlyContractRec(contractDataObj, firstSubPeriod);
        }
        contractDataObj.subRecId = common_lib.createMonthlySubRec(contractDataObj, firstSubPeriod);
        log.debug(title, 'contractDataObj: ' + JSON.stringify(contractDataObj));
        contractDataObj.amtNew = 0.0000;// from next period it is no longer new
        contractDataObj.previousSubscriptions = null; // only save previous subscriptions to the first sub period
        log.debug(title, 'Start Generating/Updating remaining Monthly Contracts');
        let periodToProcess = common_lib.getPeriodName(firstSubPeriod); // ex. 'FY 2022 : Q4 2022 : Oct 2022';
        log.debug(title, 'periodToProcess: ' + periodToProcess);
        common_lib.updateContractLost(contractDataObj, firstSubPeriod);
        for (let i = 1; i < contractDataObj.numOfMonth; i++) {
          let getPeriodDetails = periodToProcess.split(":");
          let getFYString = getPeriodDetails[0].split(" ");
          let getQTString = getPeriodDetails[1].split(" ");
          let getMMString = getPeriodDetails[2].split(" ");
          let getFY = getFYString[1];
          let getMM = getMMString[1];
          let newPeriodMonth = common_lib.getNewPeriodMonth(getMM);
          log.debug(title, 'newPeriodMonth: ' + newPeriodMonth);
          const date = new Date('2009', newPeriodMonth, '10');
          let shortMonth = date.toLocaleString('en-us', {month: 'short'});
          let newMonthName = shortMonth.split(" ");
          newMonthName = newMonthName[1];
          let newQuarter = '';
          let newYear = getFY;

          if (newMonthName == "Jan" || newMonthName == "Feb" || newMonthName == "Mar") newQuarter = 'Q1';
          else if (newMonthName == "Apr" || newMonthName == "May" || newMonthName == "Jun") newQuarter = 'Q2';
          else if (newMonthName == "Jul" || newMonthName == "Aug" || newMonthName == "Sep") newQuarter = 'Q3';
          else if (newMonthName == "Oct" || newMonthName == "Nov" || newMonthName == "Dec") newQuarter = 'Q4';

          if (newMonthName == "Jan") newYear = parseInt(getFY) + 1;
          let newPeriodString = "FY " + newYear + " : " + newQuarter + " " + newYear + " : " + newMonthName + " " + newYear;
          log.debug(title, 'newPeriodString: ' + newPeriodString);
          periodToProcess = newPeriodString;
          let periodIdToProcess = common_lib.getPeriodId(newMonthName + " " + newYear);
          log.debug(title, 'periodIdToProcess: ' + periodIdToProcess);
          if (i == contractDataObj.numOfMonth - 1) {
            // potential lost if the contract is not renewed
            log.debug(title, "Add potential lost if the contract is not renewed in " + periodToProcess);
            // contractDataObj.amtEOP = 0.0000;
            contractDataObj.amtLost = totalAmountPerMonth;
            contractDataObj.mrrLost = true;
          }
          try { // for each of the remaining months, create a new contract or update existing contract with the new subscription
            contractDataObj.contRecId = common_lib.getMonthlyMRRContract(contractDataObj.contractNumber, periodIdToProcess);
            if (!contractDataObj.contRecId) {
              contractDataObj.contRecId = common_lib.createMonthlyContractRec(contractDataObj, periodIdToProcess);
            }
            // if (contractDataObj.transactionType !== 'custcred') common_lib.updateContractLost(contractDataObj, periodIdToProcess);
            contractDataObj.subRecId = common_lib.createMonthlySubRec(contractDataObj, periodIdToProcess);
          } catch (error) {
            log.error(title, 'Error Generating Next Monthly Contracts: ' + error);
          }
        }
        try {
          loadedTransactionRecord.setValue({
            fieldId: elemac_const.TranCustFields.CONTRACT_START_DATE,
            value: contractDataObj.contractStart,
            ignoreFieldChange: true
          });
          loadedTransactionRecord.setValue({
            fieldId: elemac_const.TranCustFields.CONTRACT_END_DATE,
            value: contractDataObj.contractEnd,
            ignoreFieldChange: true
          });
          loadedTransactionRecord.setValue({
            fieldId: elemac_const.TranCustFields.CONTRACT_RECORD_ALREADY_CREATED,
            value: true,
            ignoreFieldChange: true
          });
          loadedTransactionRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        } catch (error) {
          log.error(title, 'Error Updating Transaction With Contracts Data: ' + error);
        }
      }
    } catch (error) {
      log.error(title, 'Error creating contract entries: ' +  error);
    }
  }
  return {
    afterSubmit: afterSubmit
  }
});
