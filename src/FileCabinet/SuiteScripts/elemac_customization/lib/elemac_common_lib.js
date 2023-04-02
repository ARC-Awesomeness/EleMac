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
 * 1.0.0      03 Nov 2022     Bruce Do         Initial version
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/record", "N/log", "N/search", "N/ui/serverWidget", "N/url", "N/redirect", "./elemac_const"],
    function (require, exports, record, log, search, ui, url, redirect, elemac_const) {
    // Object.defineProperty(exports, "__esModule", { value: true });
    const getNewPeriodMonth = (monthStr) => {
        return new Date(monthStr + '-1-01').getMonth() + 1;
    }
    const isEmpty = (nValue) => {
        return (
            nValue === "" ||
            nValue == null ||
            nValue == undefined ||
            nValue == "undefined" ||
            nValue == "null" ||
            (nValue.constructor === Array && nValue.length == 0) ||
            (nValue.constructor === Object &&
                (function (v) {
                    for (var k in v) return false;
                    return true;
                })(nValue))
        );
    }
    const getMaxDate = (dateArray) => {
        if (isEmpty(dateArray) || dateArray.length == 0) return null;
        return dateArray.reduce((first,second) => first > second ? first : second);
    }
    const getMinDate = (dateArray) => {
        if (isEmpty(dateArray) || dateArray.length == 0) return null;
        return dateArray.reduce((first,second) => first < second ? first : second);
    }
    const getTranData = (loadedTransactionRecord) => {
        const title = 'getTranData';
        let data = {};
        let invoiceLinesCount = loadedTransactionRecord.getLineCount({ sublistId: 'item' });
        data.tranTotalAmount = 0.0000;
        let allRevStartDate = [];
        let allRevEndDate = [];
        if (invoiceLinesCount > 0) {
            for (let i = 0; i < invoiceLinesCount; i++) {
                loadedTransactionRecord.selectLine({
                    sublistId: "item",
                    line: i
                });
                let recurring = loadedTransactionRecord.getCurrentSublistText({
                    sublistId: "item",
                    fieldId: "custcol_em_mrr_recurring"
                });
                log.debug(title, 'recurring: ' + recurring);
                if (recurring === 'F') {
                    let itemText = loadedTransactionRecord.getCurrentSublistText({
                        sublistId: "item",
                        fieldId: "item"
                    });
                    log.debug(title, 'itemText: ' + itemText);
                    if (itemText.indexOf('Insights') > -1) recurring = 'T';
                }
                if (recurring === 'T') {
                    let amount = loadedTransactionRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount"
                    });
                    data.tranTotalAmount += amount;
                    let starDate = loadedTransactionRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol1"
                    });
                    let endDate = loadedTransactionRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol2"
                    });
                    log.debug(title, 'starDate: ' + starDate);
                    log.debug(title, 'endDate: ' + endDate);
                    if (starDate && endDate) {
                        // allRevStartDate.push(new Date(starDate));
                        // allRevEndDate.push(new Date (endDate));
                        allRevStartDate.push(starDate);
                        allRevEndDate.push(endDate);
                    }
                    loadedTransactionRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_em_mrr_recurring",
                        value: true,
                        ignoreFieldChange: true
                    });
                }
            }
            data.allRevStartDate = allRevStartDate;
            log.debug(title, 'data.allRevStartDate: ' + data.allRevStartDate);
            data.allRevEndDate = allRevEndDate;
            log.debug(title, 'data.allRevEndDate: ' + data.allRevEndDate);
            data.revStartDate = getMinDate(allRevStartDate);
            data.revEndDate = getMaxDate(allRevEndDate);
        }
        return data;
    }
    const checkExistingMRRContracts = (contractNum, beforeDate) => {
        const title = 'checkExistingMRRContracts';
        let filters = [
            [elemac_const.ContCustFields.CONTRACT_NUMBER,"anyof",contractNum],
            "AND",
            ["isinactive","is","F"]
        ];
        if (beforeDate) {
            filters.push("AND");
            filters.push([elemac_const.ContCustFields.CONTRACT_PERIOD + ".startdate", "before", beforeDate]);
        }
        try {
            let dataSearchObj = search.create({
                type: elemac_const.CustRecords.ELEM_CONTRACT,
                filters: filters,
                columns:
                    [
                        search.createColumn({name: elemac_const.ContCustFields.CONTRACT_NUMBER, label: "Contract #"})
                    ]
            });
            let searchResultCount = dataSearchObj.runPaged().count;
            log.debug(title, "Found " + searchResultCount + ' existing contracts with contract number ' + contractNum + ' before date ' + beforeDate);
            if (searchResultCount && searchResultCount > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            log.error(title, 'Error searching for existing contracts for ' + contractNum + ' and before date ' + beforeDate + ': ' + error);
        }
        return false;
    }
    const getMonthlyMRRContract = (contractNum, period) => {
        const title = 'getMonthlyMRRContract';
        log.debug(title, 'Searching for contract with contractNum ' + contractNum + ' period ' + period);
        let filters = [
            [elemac_const.ContCustFields.CONTRACT_NUMBER,"anyof",contractNum],
            "AND",
            ["isinactive","is","F"]
        ];
        if (period) {
            filters.push("AND");
            filters.push([elemac_const.ContCustFields.CONTRACT_PERIOD, "anyof", period]);
        }
        let contId = null;
        try {
            let dataSearchObj = search.create({
                type: elemac_const.CustRecords.ELEM_CONTRACT,
                filters: filters,
                columns:
                    [
                        // search.createColumn({name: elemac_const.ContCustFields.CONTRACT_NUMBER, label: "Contract #"})
                        search.createColumn({name: 'internalid', label: "Internal ID"})
                    ]
            });
            log.debug(title, 'dataSearchObj: ' + JSON.stringify(dataSearchObj));
            let searchResultCount = dataSearchObj.runPaged().count;
            log.debug(title, "Found " + searchResultCount + ' existing contracts with contract number ' + contractNum + ' and period ' + period);
            if (searchResultCount && searchResultCount > 0) {
                let result = dataSearchObj.run().getRange(0,1);
                log.debug(title, 'result[0]: ' +  JSON.stringify(result[0]));
                contId = result[0].getValue({name: 'internalid'});
            }
        } catch (error) {
            log.error(title, 'Error searching for existing contracts for ' + contractNum + ' and period ' + period + ': ' + error);
        }
        return contId;
    }
    const getTotalSubEOPAmount = (customerId, workingPeriod) => {
        const title = 'getTotalSubEOPAmount';
        // if (!subscriptions || subscriptions.length == 0) return 0;
        let eopAmount = 0.0000;
        let filters = [
            [elemac_const.SubCustFields.SUB_CUSTOMER,"anyof",customerId],
            "AND",
            ["isinactive","is","F"]
        ];
        if (workingPeriod) {
            filters.push("AND");
            filters.push([elemac_const.SubCustFields.SUB_PERIOD,"anyof",workingPeriod]);
        }
        let dataSearchObj = search.create({
            type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
            filters: filters,
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        join: elemac_const.SubCustFields.SUB_PERIOD,
                        summary: "GROUP",
                        sort: search.Sort.DESC,
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: elemac_const.SubCustFields.SUB_PERIOD,
                        summary: "GROUP",
                        label: "Period"
                    }),
                    search.createColumn({
                        name: elemac_const.SubCustFields.MRR_AMT_EOP,
                        summary: "SUM",
                        label: "End Of Period Amount"
                    })
                ]
        });
        let searchResultCount = dataSearchObj.runPaged().count;
        log.debug(title, "dataSearchObj result count: " + searchResultCount);
        if (searchResultCount && searchResultCount > 0) {
            let subscriptionsData = getAllResults(dataSearchObj);
            // log.debug(title, 'subscriptionsData: ' + JSON.stringify(subscriptionsData));
            subscriptionsData.every(function (result, index) {
                let eopAmt = result.getValue({
                    name: elemac_const.SubCustFields.MRR_AMT_EOP,
                    summary: 'SUM'
                }) || 0.0000;
                log.debug(title,'eopAmt: ' + eopAmt);
                eopAmount += parseFloat(eopAmt);
            });
        } else {
            return eopAmount;
        }
        return eopAmount;
    }
    const getTotalContEOPAmount = (customerId, workingPeriod, contractNumber) => {
        const title = 'getTotalContEOPAmount';
        log.debug(title, "contractNumber: " + contractNumber);
        let eopAmount = 0.0000;
        let filters = [
            [elemac_const.ContCustFields.CONTRACT_CUSTOMER,"anyof",customerId],
            "AND",
            ["isinactive","is","F"]
        ];
        if (workingPeriod) {
            filters.push("AND");
            filters.push([elemac_const.ContCustFields.CONTRACT_PERIOD,"anyof",workingPeriod]);
        }
        if (contractNumber) {
            filters.push("AND");
            // ["custrecord_elem_cont_number.name","haskeywords","2019-1262"]
            filters.push([elemac_const.ContCustFields.CONTRACT_NUMBER + ".name","haskeywords",contractNumber]);
        }
        let dataSearchObj = search.create({
            type: elemac_const.CustRecords.ELEM_CONTRACT,
            filters: filters,
            columns:
                [
                    // search.createColumn({
                    //     name: "internalid",
                    //     join: elemac_const.ContCustFields.CONTRACT_PERIOD,
                    //     summary: "GROUP",
                    //     sort: search.Sort.DESC,
                    //     label: "Internal ID"
                    // }),
                    search.createColumn({
                        name: elemac_const.ContCustFields.CONTRACT_PERIOD,
                        summary: "GROUP",
                        label: "Period"
                    }),
                    search.createColumn({
                        name: elemac_const.ContCustFields.MRR_AMT_EOP,
                        summary: "SUM",
                        label: "End Of Period Amount"
                    })
                ]
        });
        let searchResultCount = dataSearchObj.runPaged().count;
        log.debug(title, "dataSearchObj result count: " + searchResultCount);
        if (searchResultCount && searchResultCount > 0) {
            let contractData = getAllResults(dataSearchObj);
            // log.debug(title, 'subscriptionsData: ' + JSON.stringify(subscriptionsData));
            contractData.every(function (result, index) {
                let eopAmt = result.getValue({
                    name: elemac_const.ContCustFields.MRR_AMT_EOP,
                    summary: 'SUM'
                }) || 0.0000;
                log.debug(title,'eopAmt: ' + eopAmt);
                eopAmount += parseFloat(eopAmt);
            });
        } else {
            return eopAmount;
        }
        return eopAmount;
    }
    const getPriorSubsEOPAmount = (customerId, contNum, prevSubs) => {
        const title = 'getPriorSubsEOPAmount';
        // if (!subscriptions || subscriptions.length == 0) return 0;
        let eopPreviousSubAmount = 0.0000;
        let filters = [
                [elemac_const.SubCustFields.SUB_CUSTOMER,"anyof",customerId],
                "AND",
                ["isinactive","is","F"],
                // "AND",
                // ["formulanumeric: {custrecord_elem_sub_number.id}","equalto",prevSubs]
                "AND",
                [elemac_const.SubCustFields.SUB_NUMBER + ".id","anyof",prevSubs]
            ];
        if (contNum) {
            filters.push("AND");
            filters.push([elemac_const.SubCustFields.CONTRACT + '.name',"haskeywords",contNum]);
        }
        log.debug(title, 'filters: ' + filters);
        let prevSubsDataSearchObj = search.create({
            type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
            filters: filters,
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        join: elemac_const.SubCustFields.SUB_PERIOD,
                        summary: "GROUP",
                        sort: search.Sort.DESC,
                        label: "Period Internal ID"
                    }),
                    search.createColumn({
                        name: elemac_const.SubCustFields.SUB_PERIOD,
                        summary: "GROUP",
                        label: "Period"
                    }),
                    search.createColumn({
                        name: elemac_const.SubCustFields.MRR_AMT_EOP,
                        summary: "SUM",
                        label: "End Of Period"
                    })
                ]
        });
        let searchResultCount = prevSubsDataSearchObj.runPaged().count;
        log.debug(title, "prevSubsDataSearchObj result count: " + searchResultCount);
        if (searchResultCount && searchResultCount > 0) {
            let prevSubsData = getAllResults(prevSubsDataSearchObj);
            log.debug(title, 'prevSubsData: ' + JSON.stringify(prevSubsData));
            eopPreviousSubAmount = prevSubsData[0].getValue({ //only get the last Period to compare
                name: elemac_const.SubCustFields.MRR_AMT_EOP,
                summary: 'SUM'
            }) || 0.0000;
            eopPreviousSubAmount = parseFloat(eopPreviousSubAmount);
        } else {
            return eopPreviousSubAmount;
        }
        return eopPreviousSubAmount;
    }
    const generateAccountingPeriods = () => {
        let accountPeriodListArray = [];
        let accountingPeriodSearchObj = search.create({
            type: "accountingperiod",
            filters:
                [
                    ["isquarter","is","F"],
                    "AND",
                    ["isyear","is","F"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "periodname", label: "Name"}),
                    search.createColumn({name: "parent", label: "Parent"}),
                    search.createColumn({
                        name: "startdate",
                        sort: search.Sort.ASC,
                        label: "Start Date"
                    })
                ]
        });
        // let searchResultCount = accountingPeriodSearchObj.runPaged().count;
        // log.debug("Accounting Period SearchObj Result Count",searchResultCount);
        accountingPeriodSearchObj.run().each(function(result) {
            let accountPeriodInternalID = result.getValue('internalid');
            let accountPeriodQuarter = result.getText('parent');
            let accountPeriodMonth = result.getValue('periodname');
            // log.debug('Accounting Internal ID', accountPeriodInternalID);
            // log.debug('Accounting Internal Quarter', accountPeriodQuarter);
            // log.debug('Accounting Internal Month', accountPeriodMonth);
            let getYearSplit = accountPeriodMonth.split(' ')
            let getYear = getYearSplit[1]
            // log.debug('Accounting Internal Year', getYear);

            let accountFullName = 'FY ' + getYear + " : " + accountPeriodQuarter + " : " + accountPeriodMonth;
            accountPeriodListArray.push({
                name: accountFullName,
                internalid: accountPeriodInternalID
            })
            return true;
        });
        return accountPeriodListArray
    }
    const getPeriodName = (periodId) => {
        let periodName =  '';
        let parent1Name = '';
        let parent2Name = '';
        periodName = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: parseInt(periodId),
            columns: ['periodname']
        });
        periodName = periodName.periodname;
        let parent1Obj = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: parseInt(periodId),
            columns: ['parent']
        });
        if (parent1Obj) {
            parent1Name = parent1Obj.parent[0].text;
            let parent1Id = parent1Obj.parent[0].value;
            if (parent1Id) {
                let parent2Obj = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: parent1Id,
                    columns: ['parent']
                });
                if (parent2Obj) {
                    parent2Name = parent2Obj.parent[0].text;
                    return parent2Name + ' : ' + parent1Name + ' : ' + periodName;// ex. 'FY 2022 : Q4 2022 : Oct 2022'
                } else {
                    return parent1Name + ' : ' + periodName;
                }
            }
        } else {
            return periodName;
        }
        return '';
    }
    const getPeriodId = (periodName) => {
        let accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters:
                [
                    ["periodname","startswith",periodName],
                    "AND",
                    ["isquarter","is","F"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
        });
        let searchResultCount = accountingperiodSearchObj.runPaged().count;
        // log.debug("accountingperiodSearchObj result count",searchResultCount);
        let periodId = '';
        if (searchResultCount && searchResultCount > 0) {
            accountingperiodSearchObj.run().each(function(result){
                periodId = result.getValue({name: "internalid", label: "Internal ID"});
            });
        }
        return periodId;
    }
    const getSubscriptionStartPeriod = (periodStartDate) => {
        let accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters:
                [
                    ["startdate","on",periodStartDate],
                    "AND",
                    ["isquarter","is","F"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
        });
        let periodId = '';
        accountingperiodSearchObj.run().each(function(result){
            periodId = result.getValue('internalid');
            return true;
        });
        return periodId;
    }
    const getAllResults = (s) => {
        let results = s.run();
        let searchResults = [];
        let searchId = 0;
        let resultSlice = results.getRange({start:searchId,end:searchId+1000});
        do {
            resultSlice = results.getRange({start:searchId,end:searchId+1000});
            resultSlice.forEach(function(slice) {
                    searchResults.push(slice);
                    searchId++;
                }
            );
        } while (resultSlice.length >=1000);
        return searchResults;
    }
    const monthDiff = (d1, d2) => {
        let months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months <= 0 ? 0 : months;
    }
    const addSearchFilters = (dataObj, defaultPeriodFilterValue, defaultStartDateFilterValue, defaultEndDateFilterValue, defaultCustomerFilterValue) => {
        const title = 'addSearchFilters';
        if (defaultPeriodFilterValue || defaultStartDateFilterValue || defaultEndDateFilterValue || defaultCustomerFilterValue) {
            try {
                let datePeriodFilterExists = false;
                let filterArray = [];
                if (defaultPeriodFilterValue) {
                    let periodArrayToSearch = [];
                    let periodSplit = defaultPeriodFilterValue.split('\u0005')
                    for (let i = 0; i < periodSplit.length; i++) {
                        periodArrayToSearch.push(periodSplit[i]);
                    }
                    log.debug(title, 'Period Filter Array Created: ' + periodArrayToSearch);
                    filterArray.push('and');
                    filterArray.push([elemac_const.SubCustFields.CONTRACT_PERIOD, 'anyof', periodArrayToSearch]);
                    datePeriodFilterExists = true;
                }
                if (!defaultPeriodFilterValue && (defaultStartDateFilterValue || defaultEndDateFilterValue)) {
                    log.debug(title, 'Period Filter Not Found - But Date Filter');
                    if (defaultStartDateFilterValue && !defaultEndDateFilterValue) {
                        filterArray.push('and');
                        filterArray.push([elemac_const.SubCustFields.SUB_START_DATE, 'onorafter', defaultStartDateFilterValue]);
                    } else if (defaultStartDateFilterValue && defaultEndDateFilterValue) {
                        filterArray.push('and');
                        filterArray.push([elemac_const.SubCustFields.SUB_START_DATE, 'onorafter', defaultStartDateFilterValue]);
                        filterArray.push('and');
                        filterArray.push([elemac_const.SubCustFields.SUB_END_DATE, 'onorbefore', defaultEndDateFilterValue]);
                    } else if (!defaultStartDateFilterValue && defaultEndDateFilterValue) {
                        filterArray.push('and');
                        filterArray.push([elemac_const.SubCustFields.SUB_END_DATE, 'before', defaultEndDateFilterValue]);
                    }
                    datePeriodFilterExists = true;
                }
                if (datePeriodFilterExists == false && defaultCustomerFilterValue) {
                    let customerArrayToSearch = []
                    let customerSplit = defaultCustomerFilterValue.split('\u0005')
                    for (let i = 0; i < customerSplit.length; i++) {
                        customerArrayToSearch.push(customerSplit[i]);
                    }
                    log.debug(title, 'Customer Filter Array Created: ' + customerArrayToSearch);
                    filterArray.push('and');
                    filterArray.push([elemac_const.SubCustFields.SUB_CUSTOMER, 'anyof', customerArrayToSearch]);
                } else if (datePeriodFilterExists && defaultCustomerFilterValue) {
                    let customerArrayToSearch = [];
                    let customerSplit = defaultCustomerFilterValue.split('\u0005');
                    for (let i = 0; i < customerSplit.length; i++) {
                        customerArrayToSearch.push(customerSplit[i]);
                    }
                    log.debug(title, 'Customer Filter Array Created: ' + customerArrayToSearch);
                    filterArray.push('and');
                    filterArray.push([elemac_const.SubCustFields.SUB_CUSTOMER, 'anyof', customerArrayToSearch]);
                }
                dataObj.filterExpression = dataObj.filterExpression.concat(filterArray);
                let filters = dataObj.filterExpression;
                log.debug(title, 'filters: ' + filters);
                return dataObj
            } catch (error) {
                log.error(title, 'Error Adding Search Filters: ' + error);
            }
        } else {
            return dataObj;
        }
    }
    const getSearchResults = (resultsObj, sublist_field_name, columnNames, formSublistName, pageIndex, rowCounter) => {
        // This is how we add the sublist (row) data. It parses through the search based on column positions and checks for normal id and text values.
        // Also checks for any group/max functions in the saved search.
        const title = 'getSearchResults';
        // log.debug(title, 'columnNames: ' + JSON.stringify(columnNames));
        let checkJoins, checkSummary; //rowCounter = 0,
        let checkOverallResults = resultsObj.runPaged().count;
        try {
            if (checkOverallResults > 0) {
                let sublistResults = resultsObj.runPaged({pagesize: '50'}).fetch({index: pageIndex});
                // log.debug(title, 'sublistResults: ' + JSON.stringify(sublistResults));
                let searchResultCount = sublistResults.length;
                sublistResults.data.forEach(function (result) {
                    let columnCounter = 0, columnLabel, searchRowText, searchRowValues, rowValue;
                    columnNames.forEach(function () {
                        // log.debug(title, 'columnNames[columnCounter][name]: ' + columnNames[columnCounter]['name']);
                        // let customPageFieldID = 'custpage_field' + '_mrr_data_' + columnCounter;
                        let customPageFieldID = 'custpage_field' + sublist_field_name + columnCounter;
                        checkJoins = columnNames[columnCounter]['join'];
                        checkSummary = columnNames[columnCounter]['summary'];
                        columnLabel = columnNames[columnCounter]['label'];
                        if (checkJoins) {
                            checkJoins = checkJoins.toString();
                            checkJoins = checkJoins.toLowerCase();
                        }
                        if (checkSummary) {
                            checkSummary = checkSummary.toString();
                            checkSummary = checkSummary.toLowerCase();
                        }
                        if (checkJoins) {
                            if (checkSummary) {
                                searchRowText = result.getText({
                                    name: columnNames[columnCounter]['name'],
                                    join: checkJoins,
                                    summary: checkSummary
                                });
                                searchRowValues = result.getValue({
                                    name: columnNames[columnCounter]['name'],
                                    join: checkJoins,
                                    summary: checkSummary
                                });
                            }
                            else {
                                searchRowText = result.getText({
                                    name: columnNames[columnCounter]['name'],
                                    join: checkJoins
                                });
                                searchRowValues = result.getValue({
                                    name: columnNames[columnCounter]['name'],
                                    join: checkJoins
                                });
                            }
                        }
                        else {
                            if (checkSummary) {
                                searchRowText = result.getText({
                                    name: columnNames[columnCounter]['name'],
                                    summary: checkSummary
                                });
                                searchRowValues = result.getValue({
                                    name: columnNames[columnCounter]['name'],
                                    summary: checkSummary
                                });
                            }
                            else {
                                searchRowText = result.getText(columnNames[columnCounter]['name']);
                                searchRowValues = result.getValue(columnNames[columnCounter]['name']);
                            }
                        }
                        if (searchRowText || searchRowValues) {
                            if (!searchRowText) {
                                rowValue = searchRowValues;
                            }
                            else {
                                rowValue = searchRowText;
                            }
                            // log.debug(title, 'columnLabel: ' + columnLabel);
                            if (columnLabel === 'MRR - Amount Lost' && parseFloat(rowValue) > 0) {
                                rowValue = '-' + rowValue;
                                // log.debug(title, 'MRR - Amount Lost: ' + rowValue);
                            }
                            formSublistName.setSublistValue({
                                id: customPageFieldID,
                                line: rowCounter,
                                value: rowValue,
                            });
                        }
                        else {
                            formSublistName.setSublistValue({
                                id: customPageFieldID,
                                line: rowCounter,
                                value: ' ',
                            });
                        }
                        // log.debug(title, 'rowValue: ' + rowValue);
                        columnCounter++;
                        return true;
                    });
                    rowCounter++;
                    return true;
                });
            }
            return rowCounter;
        } catch (e) {
            log.error(title, 'An error occurs: ' + e);
        }
    }
    const getSearchLostResults = (resultsObj, sublist_field_name, columnNames, formSublistName, pageIndex, rowCounter) => {
        // This is how we add the sublist (row) data. It parses through the search based on column positions and checks for normal id and text values.
        // Also checks for any group/max functions in the saved search.
        const title = 'getSearchLostResults';
    }
    const getPreviousPeriod = (periodId) => {
        if (!periodId) return null;
        log.debug('getPreviousPeriod', 'periodId: ' + periodId);
        let currentPeriodStartDate = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: parseInt(periodId),
            columns: ['startdate']
        }).startdate;
        // log.debug('getPreviousPeriod', 'currentPeriodStartDate: ' + JSON.stringify(currentPeriodStartDate));
        let date = new Date(currentPeriodStartDate);
        log.debug('getPreviousPeriod', 'date: ' + date);
        let month = date.getMonth();
        log.debug('getPreviousPeriod', 'month: ' + month);
        let day = date.getDay();
        log.debug('getPreviousPeriod', 'day: ' + day);
        let year = date.getFullYear();
        log.debug('getPreviousPeriod', 'year: ' + year);
        if (month === 0) { // Jan
            month = 12; // Previous month is Dec
            year = year -1;
        }
        let previousPeriodStartDate = month + '/' + '01' + '/' + year;
        log.debug('getPreviousPeriod', 'previousPeriodStartDate: ' + previousPeriodStartDate);
        let accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters:
                [
                    ["startdate","on",previousPeriodStartDate],
                    "AND",
                    ["isquarter","is","F"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
        });
        let previousPeriodId = '';
        accountingperiodSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            previousPeriodId = result.getValue('internalid');
            return true;
        });
        // log.debug('getPreviousPeriod', 'previousPeriodId: ' + previousPeriodId);
        return previousPeriodId;
    }
    const initiateUI = (form, ctx) => {
        const title = 'initiateUI';
        let mrrMonthlyPageNumber = ctx.request.parameters.mrrMonthlyPageNumber ? ctx.request.parameters.mrrMonthlyPageNumber : 0;
        let mrrCohortPageNumber = ctx.request.parameters.mrrCohortPageNumber ? ctx.request.parameters.mrrCohortPageNumber: 0;
        let contractDetailsPageNumber = ctx.request.parameters.contractDetailsPageNumber ? ctx.request.parameters.contractDetailsPageNumber : 0;
        let arrOverallPageNumber = ctx.request.parameters.arrOverallPageNumber ? ctx.request.parameters.arrOverallPageNumber : 0;
        let arrPeriodPageNumber = ctx.request.parameters.arrPeriodPageNumber ? ctx.request.parameters.arrPeriodPageNumber : 0;
        let arrCustomerPageNumber = ctx.request.parameters.arrCustomerPageNumber ? ctx.request.parameters.arrCustomerPageNumber : 0;
        let expiringContractsPageNumber = ctx.request.parameters.expiringContractsPageNumber ? ctx.request.parameters.expiringContractsPageNumber : 0;
        let defaultPeriodFilterValue = ctx.request.parameters.custpage_period_filter ? ctx.request.parameters.custpage_period_filter : null;
        let defaultStartDateFilterValue = ctx.request.parameters.custpage_start_date_filter;
        let defaultEndDateFilterValue = ctx.request.parameters.custpage_end_date_filter;
        let defaultCustomerFilterValue = ctx.request.parameters.custpage_customer_filter;
        let defaultContractFilterValue = ctx.request.parameters.custpage_contract_num_filter;

        log.debug(title, 'Page Numbers. MRR Month Page Number: ' + mrrMonthlyPageNumber + " - MRR Cohort Page Number: " + mrrCohortPageNumber +  " - Contract Details Page Number: " + contractDetailsPageNumber);
        log.debug(title, 'Additional Page Numbers. Expiring Contracts Page Number: ' + expiringContractsPageNumber + ' - ARR Period Page Number: ' + arrPeriodPageNumber + ' - ARR Customer Page Number: ' + arrCustomerPageNumber + ' - ARR Overall Page Number: ' + arrOverallPageNumber);
        log.debug(title, 'Date Filters. Default Start Date Filter: ' + defaultStartDateFilterValue + 'Default End Date Filter: ' + defaultEndDateFilterValue);
        log.debug(title, 'Default Filters. ' + JSON.stringify(defaultPeriodFilterValue) + " - " + JSON.stringify(defaultCustomerFilterValue) + " - " + JSON.stringify(defaultContractFilterValue));

        // This is where create the form and add the Submit and MRR Period Analytics Report buttons
        let reloadMRRDataFldGrp = form.addFieldGroup({ id:'custpage_reload_contracts_mrr_arr_data', label: 'Reload MRR/ARR Tabs'});
        reloadMRRDataFldGrp.isSingleColumn = true;
        form.addFieldGroup({ id:'custpage_reload_contract_details_data', label: 'Reload Contract Detail Tab'});
        form.addSubmitButton({
            label : 'Request Data',
            container: 'custpage_submit_contracts_mrr_arr_data'
        });
        form.addButton({
            id: 'custpage_refresh_mrr_arr_button',
            label : 'Open MRR Period Report',
            functionName: "openWindow('" + 'https://5312158-sb1.app.netsuite.com/app/common/report/report.nl?workbook=7' + "')",
            container: 'custpage_reload_contracts_mrr_arr_data'
        });
        // This is where we create the various sublist tabs to display different views of the MRR/ARR data.
        form.addTab({
            id: 'custpage_mrr_monthly_tab',
            label: 'MRR By Month'
        })
        form.addTab({
            id: 'custpage_mrr_monthly_lost_tab',
            label: 'MRR Lost By Month'
        })
        form.addTab({
            id: 'custpage_mrr_cohort_tab',
            label: 'MRR Cohort'
        })
        form.addTab({
            id: 'custpage_arr_by_period_data_tab',
            label: 'ARR By Period'
        })
        form.addTab({
            id: 'custpage_arr_by_customer_data_tab',
            label: 'ARR By Customer'
        })
        form.addTab({
            id: 'custpage_arr_overall_data_tab',
            label: 'ARR By Year'
        })
        form.addTab({
            id: 'custpage_contract_details_data_tab',
            label: 'Contract Details'
        })
        form.addTab({
            id: 'custpage_expiring_contracts_data_tab',
            label: 'Expiring Contracts'
        })
        // This is where we add the different filters we will need for our MRR Data search
        let periodField = form.addField({
            id: 'custpage_period_filter',
            type: ui.FieldType.MULTISELECT,
            label: 'Period',
            // source: 'accountingperiod',
            container: 'custpage_reload_contracts_mrr_arr_data'
        })
        let periodList = generateAccountingPeriods();
        for (let i = periodList.length - 1; i > 0; i--) {
            periodField.addSelectOption({
                value: periodList[i].internalid,
                text: periodList[i].name
            });
        }
        periodField.setHelpText({
            help : "Please choose either period or Start/End Date. If values are input for both, Period will take precedence."
        });
        periodField.defaultValue = defaultPeriodFilterValue;
        let startDateField = form.addField({
            id: 'custpage_start_date_filter',
            type: ui.FieldType.DATE,
            label: 'Start Date',
            container: 'custpage_reload_contracts_mrr_arr_data'
        });
        startDateField.breakType = ui.FieldBreakType.STARTCOL;
        startDateField.defaultValue = defaultStartDateFilterValue;
        let endDateField = form.addField({
            id: 'custpage_end_date_filter',
            type: ui.FieldType.DATE,
            label: 'End Date',
            container: 'custpage_reload_contracts_mrr_arr_data'
        });
        endDateField.defaultValue = defaultEndDateFilterValue;
        let customerField = form.addField({
            id: 'custpage_customer_filter',
            type: ui.FieldType.MULTISELECT,
            label: 'Customer',
            source: 'customer',
            container: 'custpage_reload_contracts_mrr_arr_data'
        });
        customerField.breakType = ui.FieldBreakType.STARTCOL;
        customerField.defaultValue = defaultCustomerFilterValue;
        let contractField = form.addField({
            id: 'custpage_contract_num_filter',
            type: ui.FieldType.SELECT,
            label: 'Contract #',
            source: 'customlist_elem_contract_numbers',
            container: 'custpage_reload_contract_details_data'
        })
        contractField.defaultValue = defaultContractFilterValue;
        return form;
    }
    const getLostAmount = (tranPeriod, customerID) => {
        const title = 'getLostAmount';
        // let priorPeriodTotalAmt = 0;
        let eopAmt = 0;
        if (tranPeriod) {
            let previousPeriod = getPreviousPeriod(tranPeriod);
            let mrrMonthlyLostResultsObj = search.load({
                id: 'customsearch_mrr_sub_by_month'
            });
            mrrMonthlyLostResultsObj = addSearchFilters(mrrMonthlyLostResultsObj, previousPeriod, null, null, customerID);
            log.debug(title, 'mrrMonthlyLostResultsObj: ' + JSON.stringify(mrrMonthlyLostResultsObj));
            let priorPeriodData = getAllResults(mrrMonthlyLostResultsObj);
            log.debug(title, 'priorPeriodData: ' + JSON.stringify(priorPeriodData));
            priorPeriodData.every(function (result, index) {

                eopAmt += parseFloat(result.getValue({
                    name: elemac_const.SubCustFields.MRR_AMT_EOP,
                    summary: 'SUM'
                }) || 0);
            });
        }
        return eopAmt;
    }
    const createMonthlyContractRec = (dataObj,period) => {
        const title = 'createContractRec';
        if (dataObj.transactionType == 'custcred') {
            log.debug(title, 'This is Credit Memo transaction. No new contract should be created');
            return null;
        }
        let newContRecordId = null;
        try {
            let newContRecord = record.create({
                type: elemac_const.CustRecords.ELEM_CONTRACT,
                isDynamic: true
            });
            newContRecord.setValue({
                fieldId: 'name',
                value: dataObj.contractName + '_' + period,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.CONTRACT_NUMBER,
                value: dataObj.contractNumber,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.CONTRACT_PERIOD,
                value: period,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.CONTRACT_CUSTOMER,
                value: dataObj.customerID,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.CONTRACT_CREATED_FROM,
                value: dataObj.transactionRecID,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.MRR_AMT_EOP,
                value: dataObj.amtEOP,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.MRR_AMT_OPEN,
                value: dataObj.amtOpen,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.MRR_AMT_NEW,
                value: dataObj.amtNew,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.MRR_AMT_EXPANSION,
                value: dataObj.amtExpansion,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.MRR_AMT_CONTRACTION,
                value: dataObj.amtContraction,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.MRR_AMT_LOST,
                value: dataObj.amtLost,
                ignoreFieldChange: true
            });
            newContRecord.setValue({
                fieldId: elemac_const.ContCustFields.IS_MRR_CONTRACT_LOST,
                value: dataObj.mrrLost,
                ignoreFieldChange: true
            });
            newContRecordId = newContRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.audit(title, "New MRR Contract created : " + newContRecordId);
        } catch (e) {
            log.error(title, "Error creating contract: " + e);
        }
        return newContRecordId;
    }
    const createMonthlySubRec = (dataObj,period) => {
        const title = 'createMonthlySubRec';
        try {
            log.debug(title, 'Creating new Monthly Sub record for period ' + period);
            let newSubRecord = record.create({
                type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
                isDynamic: true
            });
            if (dataObj.contRecId) {
                newSubRecord.setValue({
                    fieldId: elemac_const.SubCustFields.CONTRACT,
                    value: dataObj.contRecId,
                    ignoreFieldChange: true
                });
            }
            newSubRecord.setValue({
                fieldId: 'name',
                value: dataObj.subscriptionName + '_' + period,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.SUB_NUMBER,
                value: dataObj.subscriptionNumber,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.PRIOR_SUBS_NUM,
                value: dataObj.previousSubscriptions,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.SUB_PERIOD,
                value: period,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.SUB_CUSTOMER,
                value: dataObj.customerID,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.SUB_CREATED_FROM,
                value: dataObj.transactionRecID,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.SUB_START_DATE,
                value: dataObj.contractStart,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.SUB_END_DATE,
                value: dataObj.contractEnd,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.MRR_AMT_EOP,
                value: dataObj.transactionType == 'custcred' ? dataObj.amtEOP * -1 : dataObj.amtEOP,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.MRR_AMT_OPEN,
                value: dataObj.transactionType == 'custcred' ? dataObj.amtOpen * -1 : dataObj.amtOpen,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.MRR_AMT_NEW,
                value: dataObj.transactionType == 'custcred' ? dataObj.amtNew * -1 : dataObj.amtNew,
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.MRR_AMT_EXPANSION,
                value: dataObj.amtExpansion, // dataObj.transactionType == 'custcred' ? dataObj.amtExpansion * -1 :
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.MRR_AMT_CONTRACTION,
                value: dataObj.amtContraction, // dataObj.transactionType == 'custcred' ? dataObj.amtContraction * -1 :
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.MRR_AMT_LOST,
                value: dataObj.transactionType == 'custcred' ? dataObj.amtLost * -1 : dataObj.amtLost, //
                ignoreFieldChange: true
            });
            newSubRecord.setValue({
                fieldId: elemac_const.SubCustFields.IS_MRR_SUB_LOST,
                value: dataObj.mrrLost,
                ignoreFieldChange: true
            });
            let newSubRecordId = newSubRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.audit(title, "New MRR Subscription created : " + newSubRecordId);
        } catch (e) {
            log.error(title, "Error creating subscription: " + e);
        }
    }
    const updateContractLost = (dataObj, period) => {
        const title = 'updateContractLost';
        log.debug(title, 'Searching potential lost subscription to delete. period: ' + period + ', dataObj: ' + JSON.stringify(dataObj));
        if (isEmpty(dataObj) || isEmpty(dataObj.customerID) || isEmpty(dataObj.contRecId) || isEmpty(period)) return;
        let subscriptionsDataSearchObj = search.create({
            type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
            filters:
                [
                    [elemac_const.SubCustFields.CONTRACT + '.internalid',"anyof",dataObj.contRecId],
                    "AND",
                    [elemac_const.SubCustFields.SUB_CUSTOMER,"anyof",dataObj.customerID],
                    "AND",
                    [elemac_const.SubCustFields.SUB_PERIOD,"anyof",period],
                    "AND",
                    [elemac_const.SubCustFields.IS_MRR_SUB_LOST,"is","T"],
                    "AND",
                    ["isinactive","is","F"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
        });
        let searchResultCount = subscriptionsDataSearchObj.runPaged().count;
        log.debug(title, 'Found ' + searchResultCount + ' subscriptions to delete');
        let contLost = false;
        subscriptionsDataSearchObj.run().each(function(result){
            let subId = parseFloat(result.getValue({name: "internalid"}));
            if (subId) {
                contLost = true;
                log.debug(title, "deleting potential lost subId " + subId + ' for contract ' + dataObj.contRecId);
                try {
                    record.delete({
                        type: elemac_const.CustRecords.ELEM_SUBSCRIPTION,
                        id: subId
                    })
                } catch (e) {
                    log.error(title, "Error deleting potential lost subId " + subId + ' for contract ' + dataObj.contRecId + ': ' + e);
                }
            }
            return true;
        });
        try {
            if (contLost) {
                log.debug(title, "Updating contract " + dataObj.contRecId + ' to not lost');
                let contRec = record.load({
                    type: elemac_const.CustRecords.ELEM_CONTRACT,
                    id: dataObj.contRecId
                });
                if (contRec) {
                    contRec.setValue({
                        fieldId: elemac_const.ContCustFields.IS_MRR_CONTRACT_LOST,
                        value: false
                    });
                    contRec.setValue({
                        fieldId: elemac_const.ContCustFields.MRR_AMT_LOST,
                        value: 0.00
                    });
                    contRec.setValue({
                        fieldId: elemac_const.ContCustFields.MRR_AMT_EOP,
                        value: dataObj.amtEOP
                    });
                    contRec.setValue({
                        fieldId: elemac_const.ContCustFields.CONTRACT_CREATED_FROM,
                        value: dataObj.transactionRecID
                    });
                    contRec.save();
                }
            }
        } catch (e) {
            log.error(title, 'Error changing contract ' + dataObj.contRecId + ' to not lost: ' + e);
        }
    }
    const updateReportedContracts = (dataObj) => {
        const title = 'updateReportedContracts';
        if (!dataObj.contId) return;
        try {
            let contRec = record.load({
                type: elemac_const.CustRecords.ELEM_CONTRACT,
                id: dataObj.contId
            });
            if (contRec) {
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_READY_TO_REPORT,
                    value: true
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_AMT_OPEN,
                    value: dataObj.totalOpenAmt
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_AMT_NEW,
                    value: dataObj.totalNewAmt
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_AMT_LOST,
                    value: dataObj.totalLostAmt
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_AMT_CONTRACTION,
                    value: dataObj.totalContAmt
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_AMT_EXPANSION,
                    value: dataObj.totalExpAmt
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.MRR_AMT_EOP,
                    value: dataObj.totalEoPAmt
                });
                contRec.setValue({
                    fieldId: elemac_const.ContCustFields.IS_MRR_CONTRACT_LOST,
                    value: dataObj.mrrLost
                });
                contRec.save();
                log.debug(title, 'Contract ' + dataObj.contId + ' is updated for reporting');
            }
        } catch (e) {
            log.error(title, 'An error occurs during updating reportable contract: ' + e);
        }
    }
    const getDays360 = (sd, fd) => {
        let d1 = new Date(sd);
        let d2 = new Date(fd);
        let d1_1 = d1;
        let d2_1 = d2;
        let d1_y = d1.getFullYear();
        let d2_y = d2.getFullYear();
        let dy = 0;
        let d1_m = d1.getMonth();
        let d2_m = d2.getMonth();
        let dm = 0;
        let d1_d = d1.getDate();
        let d2_d = d2.getDate();
        let dd = 0;
        if (d1_d == 31) d1_d = 30;
        if (d2_d == 31) {
            if (d1_d < 30) {
                if (d2_m == 11) {
                    d2_y = d2_y + 1;
                    d2_m = 0;
                    d2_d = 1;
                } else {
                    d2_m = d2_m + 1;
                    d2_d = 1;
                }
            } else {
                d2_d = 30;
            }
        }
        dy = d2_y - d1_y;
        dm = d2_m - d1_m;
        dd = d2_d - d1_d;
        log.debug('getDays360', 'dy: ' + dy + 'dm: ' + dm + 'dd: ' + dd);
        return parseFloat(dy * 360 + dm * 30 + dd); // return dy * 360 + dm * 30 + dd + 1;
    }
    const WeekOfYear = () => {
        var currentRecord = context.currentRecord;
        var trandate = currentRecord.getValue({ fieldId: 'trandate' });

        var target = new Date(trandate);
        var dayNr = (target.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        var firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() != 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }

        var Weeks = 1 + Math.ceil((firstThursday - target) / 604800000);

        currentRecord.setValue({
            fieldId: 'custbody101',
            value: Weeks
        });
    }
    return {
        getNewPeriodMonth: getNewPeriodMonth,
        isEmpty: isEmpty,
        getMaxDate: getMaxDate,
        getMinDate: getMinDate,
        getTranData: getTranData,
        checkExistingMRRContracts: checkExistingMRRContracts,
        getMonthlyMRRContract: getMonthlyMRRContract,
        generateAccountingPeriods: generateAccountingPeriods,
        getTotalSubEOPAmount: getTotalSubEOPAmount,
        getTotalContEOPAmount: getTotalContEOPAmount,
        getPriorSubsEOPAmount: getPriorSubsEOPAmount,
        getPeriodName: getPeriodName,
        getPeriodId: getPeriodId,
        getSubscriptionStartPeriod: getSubscriptionStartPeriod,
        getAllResults: getAllResults,
        monthDiff: monthDiff,
        addSearchFilters: addSearchFilters,
        getSearchResults: getSearchResults,
        getPreviousPeriod: getPreviousPeriod,
        initiateUI:initiateUI,
        getLostAmount: getLostAmount,
        updateContractLost: updateContractLost,
        createMonthlyContractRec: createMonthlyContractRec,
        createMonthlySubRec: createMonthlySubRec,
        updateReportedContracts: updateReportedContracts,
        getDays360: getDays360
    };
});
