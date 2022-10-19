import { Injectable } from "@nestjs/common";


@Injectable()
export class GlobalService {

    private isDev = (process.env.NODE_ENV === 'local' || 'dev');
    public readonly LOAN_FEES: number = 3;

    public readonly LOAN_STATUS: any = {
        APPROVED: 'Approved',
        DISBURSED: 'Disbursed',
        NOT_QUALIFIED: 'Not Qualified',
        FULLY_PAID: 'Fully Paid',
    }

    public readonly TRANSACTION_TYPE: any = {
        DEBIT_WING_WEI_LUY_TRANSFER_FEE: 'debit_wing_wei_luy_transfer_fee',
        CREDIT_WING_WEI_LUY_TRANSFER_FEE: 'credit_wing_wei_luy_transfer_fee',
        CREDIT_DISBURSEMENT: 'credit_disbursement',
        DREAM_POINT_COMMITMENT: 'dream_point_commitment',
        DREAM_POINT_EARNED: 'dream_point_earned',
        CREDIT_REPAYMENT: 'credit_repayment',
        FEE_PAYMENT: 'fee_payment',
        PARTIAL_PAYMENT: 'partial_payment',
        DREAM_POINT_REFUND: 'dream_point_refund',
    };

    public readonly WIRE_TRANSFER_TYPES: any = {
        MOBILE: 'mobile',
        ACCOUNT: 'account'
    }

    public readonly AWS_IMAGE_PREFIX_URLS: any = {
        PAYMENT_REPCEIPTS: 'https://dreams-dev-bucket.s3.ap-southeast-1.amazonaws.com/'
    }

    public readonly JOTFORM_CONTRACT_URL: any = {
        DEV: 'https://form.jotform.com/koh.terai/dev-loan-contract',
        PROD: 'https://form.jotform.com/koh.terai/loan-contract',
    }

    public readonly REPAYMENT_TRANSACTION_TYPE: any = {
        CLIENT_CREDIT: 'client_credit',
        DREAM_POINT_REFUND: 'dream_point_refund'
    }

    public readonly TIER_AMOUNT: any = {
        1: 50,
        2: 75,
        3: 100,
        4: 125,
        5: 200,
        6: 300,
        7: 400,
        8: 500
    }

    CALC_WING_WEI_LUY_TRANSFER_FEE(amount: number): number {
        if (amount >= 0 && amount <= 25) {
            return 0.38;
        }
        if (amount >= 25.01 && amount <= 50) {
            return 0.75;
        }
        if (amount >= 50.01 && amount <= 100) {
            return 1.00;
        }
        if (amount >= 100.01 && amount <= 500) {
            return 1.50;
        }
        // Return 2 on more then 500
        return 2.00;
    }

    public readonly BASE_RETOOL_URL = "https://gojo.retool.com/apps/ed171e5c-250d-11ed-b962-9fea298077ce/CBS?_releaseVersion=latest";

    public readonly DISBURSEMENT_TASK_ASSIGNEE = "mohit.joshi@gojo.co";
    public readonly PAYMENT_TASK_ASSIGNEE = "mohit.joshi@gojo.co";

    public readonly SENDPULSE_FLOW: any = {
        "KYC_FLOW": this.isDev ? '62be938d81768640cc494f34' : '',
        "APPLICATION_STATUS_FLOW_ID": {
            "Disbursed": this.isDev ? "62fc9cd35c6b0b21d713cdea" : '',
            "Approved": this.isDev ? "6343f1b75eba5c54cb644455" : '',
            "Not Qualified": this.isDev ? "6343f27a0674f62c693537b5" : ''
        },
        "REMINDER_FLOW_ID": {
            "23_DAYS": this.isDev ? "632c3a3f8de7ab098c2673d9" : "",
            "16_DAYS": this.isDev ? "632c3d8e123ab83d924cddc8" : "",
            "9_DAYS": this.isDev ? "632c3f04c54feb769e5a4082" : "",
            "2_DAYS": this.isDev ? "632c40021f206771792caf37" : "",
            "1_DAY": this.isDev ? "632c407d02efd900e2548dab" : "",
            "0_DAY_MORNING": this.isDev ? "632c44a770b9686d4b564a39" : "",
            "0_DAY_EVENING": this.isDev ? "632c44d8b14ebd4e7c09fd99" : "",
            "-1_DAY_MORNING": this.isDev ? "632c5a35415c9d1596763aa1" : "",
            "-1_DAY_EVENING": this.isDev ? "632c5c685033365c2a07a378" : "",
            "-2_DAYS_MORNING": this.isDev ? "632c5cf8ffd93d3a4168adb0" : "",
            "-2_DAYS_EVENING": this.isDev ? "632c5e8d5315aa0ef11404f5" : "",
            "-3_DAYS_MORNING": this.isDev ? "632c5f2e48a0b42b26095073" : "",
            "-3_DAYS_EVENING": this.isDev ? "632c615064d2872411413292" : "",
            //FIXME: UPDATE FLOW ID
            "OLDER_THAN_3DAYS": this.isDev ? "632c615064d2872411413292" : ""
        },
        //Contract_Form_Signed
        "FLOW_4.8": this.isDev ? "634cf815b9e72911917483a3" : '',
        //Verification_call
        "FLOW_4.7": this.isDev ? "6343d395bc32a404aa0f256a" : '',
        // Payment Confirmation FLow
        "FLOW_7.4": this.isDev ? "63440f377ad3c3223a5ea057" : ''

    }
    public readonly SENDPULSE_VARIABLE_ID = {
        "ACTIVE_LOAN_ID": (process.env.NODE_ENV === 'local' || 'dev') ? "632ae8966a397f4a4c32c516" : "",
        "CLIENT_ID": (process.env.NODE_ENV === 'local' || 'dev') ? "6347ecf0ad118c34872233f6" : "",
    }

}
