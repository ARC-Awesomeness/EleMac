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
define(['N/record','N/search','N/ui/dialog', 'N/log'], function (record, search, dialog, log) {
    const getTimeStamp = (dateString) => {
      const date = new Date(dateString);
      const timestampInMs = date.getTime();
      const timestampInSeconds = Math.floor(date.getTime() / 1000);
      return timestampInSeconds
    }
    // function endAfterStart(start, end) {
    //   let startDate = new Date(start);
    //   let endDate   = new Date(end);
    //
    //   return endDate.getTime() >= startDate.getTime();
    // }
    const openWindow = (url) => {
      window.open(url)
    }
    const pageInit = (ctx) => {
        // console.log('init', ctx);
    }
    const fieldChanged = (ctx) => {
      try {
        console.log('Field Change Detected')
        if (ctx.fieldId == 'custpage_end_date_filter') {
          console.log('Field Changed', ctx.fieldId);
          let currentRecord = ctx.currentRecord;
          let startDateField = currentRecord.getValue({
              fieldId: 'custpage_start_date_filter'
          });
          let endDateField = currentRecord.getValue({
              fieldId: 'custpage_end_date_filter'
          });
          console.log('Start Date: ', startDateField);
          console.log('End Date: ', endDateField);
          let startTimeStamp = getTimeStamp(startDateField);
          let endTimeStamp = getTimeStamp(endDateField);
          console.log('Start Date Timestamp: ', startTimeStamp);
          console.log('End Date Timestamp: ', endTimeStamp);
          if (endTimeStamp < startTimeStamp) {
            dialog.alert({
              title: 'End Date Must Occur After the Start Date',
              message: 'Click OK to continue.'
            }).then(success).catch(failure);
          }
        }
      } catch (e) {
        log.debug('Error occurred: ', e);
      }
    }
    const saveRecord = (ctx) => {
      try {
        console.log('Save Record Detected');
        let currentRecord = ctx.currentRecord;
        let startDateField = currentRecord.getValue({
          fieldId: 'custpage_start_date_filter'
        });
        endDateField = currentRecord.getValue({
            fieldId: 'custpage_end_date_filter'
        });
        console.log('Save Record Start Date: ', startDateField);
        console.log('Save Record End Date: ', endDateField);

        let startTimeStamp = getTimeStamp(startDateField);
        let endTimeStamp = getTimeStamp(endDateField);
        console.log('Start Date Timestamp: ', startTimeStamp);
        console.log('End Date Timestamp: ', endTimeStamp);
        if (endTimeStamp < startTimeStamp) {
          dialog.alert({
            title: 'End Date Must Occur After the Start Date',
            message: 'Click OK to continue.'
          }).then(success).catch(failure);
          return false
        } else {
          return true
        }
      } catch (e) {
        log.debug('Error occurred: ', e);
        return false
      }
    }
    return {
        openWindow: openWindow,
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    }
});
