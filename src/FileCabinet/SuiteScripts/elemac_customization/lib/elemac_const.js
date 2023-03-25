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
 * 1.0.12     10 Oct 2022     Bruce Do         Initial Version
 */
/**
 * @NModuleScope public
 */
define([], function () {
    let CustRecords = {
        ELEM_CONTRACT: 'customrecord_elem_contracts_data',
        ELEM_SUBSCRIPTION: 'customrecord_elem_subscriptions_data'
    };
    let ContCustFields = {
        CONTRACT_PERIOD: 'custrecord_elem_cont_period',
        CONTRACT_CUSTOMER: 'custrecord_elem_cont_customer',
        CONTRACT_CREATED_FROM: 'custrecord_elem_cont_so_number',
        CONTRACT_NUMBER: 'custrecord_elem_cont_number',
        MRR_AMT_EOP: 'custrecord_elem_cont_eop_amount',
        MRR_AMT_OPEN: 'custrecord_elem_mrr_amount_open',
        MRR_AMT_NEW: 'custrecord_elem_mrr_amount_new',
        MRR_AMT_EXPANSION: 'custrecord_elem_mrr_amount_expansion',
        MRR_AMT_LOST: 'custrecord_elem_mrr_amount_lost',
        MRR_AMT_CONTRACTION: 'custrecord_elem_mrr_amount_contraction',
        MRR_AUDIT_REASON: 'custrecord_elem_mrr_audit_reason',
        IS_MRR_CONTRACT_LOST: 'custrecord_elem_mrr_contract_lost',
        MRR_READY_TO_REPORT: 'custrecord_elem_mrr_ready_to_report'
    };
    let SubCustFields = {
        CONTRACT: 'custrecord_elem_sub_contract',
        SUB_CUSTOMER: 'custrecord_elem_sub_customer',
        SUB_PERIOD: 'custrecord_elem_sub_period',
        SUB_NUMBER: 'custrecord_elem_sub_number',
        SUB_START_DATE: 'custrecord_elem_sub_start_date',
        SUB_END_DATE: 'custrecord_elem_sub_end_date',
        PRIOR_SUBS_NUM: 'custrecord_elem_sub_prev_subs',
        MRR_AMT_EOP: 'custrecord_elem_sub_eop_amount',
        MRR_AMT_OPEN: 'custrecord_elem_sub_mrr_amt_open',
        MRR_AMT_NEW: 'custrecord_elem_sub_mrr_amt_new',
        MRR_AMT_EXPANSION: 'custrecord_elem_sub_mrr_amt_exp',
        MRR_AMT_LOST: 'custrecord_elem_sub_mrr_amt_lost',
        MRR_AMT_CONTRACTION: 'custrecord_elem_sub_mrr_amt_cont',
        SUB_REMAINING_MONTH: 'custrecord_elem_sub_mrr_remaining_month',
        IS_RECURRING_SUB: 'custrecord_elem_sub_recurring',
        IS_MRR_SUB_LOST: 'custrecord_elem_sub_mrr_is_lost',
        IS_SUB_PROCESSED_BY_SCRIPT: 'custrecord_elem_sub_processed_by_script',
        SUB_CREATED_FROM: 'custrecord_elem_sub_created_from'
    };
    let TranCustFields = {
        TO_CREATE_CONTRACT_RECORD: 'custbody_elem_create_contract_rec',
        CONTRACT_RECORD_ALREADY_CREATED: 'custbody_elem_mrr_contract_created',
        CONTRACT_RECORD: 'custbody_elem_mrr_record_link',
        CONTRACT_NUMBER: 'custbody_elem_mrr_contract_number',
        CONTRACT_SUBSCRIPTION_NUMBER: 'custbody_elem_line_sub_number',
        PREVIOUS_CONTRACT_NUMBER: 'custbody_elem_mrr_previous_contracts',
        CONTRACT_RECORD_PERIOD: 'custbody_elem_contract_rec_period',
        CONTRACT_START_DATE: 'custbody_elem_contracts_start_date',
        CONTRACT_END_DATE: 'custbody_elem_contracts_end_date',
        IS_RECURRING_CONTRACT: 'custbody_elem_mrr_contract_reccur',
        CONTRACTED_CUSTOMER: 'custbody_elem_mrr_contract_customer'
    };
    let Fields = {
        ACCOUNT: 'account',
        ACCOUNT_NUMBER: 'number',
        ACCOUNTING_PERIOD: 'accountingperiod',
        AMOUNT: 'amount',
        CLOSED: 'closed',
        CUSTOMER: 'customer',
        CATEGORY: 'category',
        DATE_CREATED: 'datecreated',
        DEPARTMENT: 'department',
        DIVISION: 'class',
        DOCUMENT_NUMBER: 'tranid',
        LOCATION: 'location',
        MAIN_LINE: 'mainline',
        MEMO: 'memo',
        NAME: 'name',
        PARENT: 'parent',
        POSTING: 'posting',
        POSTING_PERIOD: 'postingperiod',
        STATUS: 'status',
        TAX_LINE: 'taxline',
        TRAN_DATE: 'trandate',
        TYPE: 'type',
        INTERNAL_ID: 'internalid',
        FILE_TYPE: 'filetype',
        FOLDER: 'folder',
        INACTIVE: 'isinactive',
        ENTITY_ID: 'entityid',
        EXTERNAL_ID: 'externalid'
    };

    let Values = {
        FALSE: 'false',
        TRUE: 'true'
    };

    let FieldTypeId = {
        CHECK_BOX: 11,
        CURRENCY: 6,
        DATE: 4,
        DATE_TIME: 46,
        DECIMAL: 8,
        DOCUMENT: 18,
        EMAIL: 2,
        FREE_FORM_TEXT: 1,
        HELP: 23,
        HYPERLINK: 13,
        IMAGE: 17,
        INLINE_HTML: 40,
        INTEGER: 10,
        LIST_RECORD: 12,
        LONG_TEXT: 35,
        MULTIPLE_SELECT: 16,
        PASSWORD: 20,
        PERCENT: 28,
        PHONE: 3,
        RICH_TEXT: 24,
        TEXT_AREA: 15,
        TIME_OF_DAY: 14
    };

    return {
        CustRecords: CustRecords,
        ContCustFields: ContCustFields,
        SubCustFields: SubCustFields,
        TranCustFields: TranCustFields,
        Fields: Fields,
        Values: Values,
        FieldTypeId: FieldTypeId
    };
});