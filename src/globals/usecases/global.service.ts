import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../custom_logger";



@Injectable()
export class GlobalService {

    public isDev = (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'dev');
    private readonly log = new CustomLogger(GlobalService.name);


    public readonly LOAN_FEES: number = 3;
    public readonly LOAN_LATE_FEE_EACH_MONTH: number = 3;
    public readonly LOAN_GRACE_PERIOD_DAYS: number = 3;

    public readonly LOAN_STATUS: any = {
        APPROVED: 'Approved',
        REQUESTED: 'Requested',
        NOT_QUALIFIED: 'Not Qualified',
        DISBURSED: 'Disbursed',
        FULLY_PAID: 'Fully Paid',
    }

    public readonly ZOHO_LOAN_STATUS: any = {
        APPROVED: 'Approved',
        DISBURSED: 'Disbursed',
        NOT_QUALIFIED: 'Not Qualified',
        FULLY_PAID: 'Fully Paid',
        PARTIAL_PAID: 'Partial Paid',
        VIDEO_REQUEST_SUBMITTED: 'Video Request Submitted',
    }

    public readonly LOAN_PAYMENT_STATUS: any = {
        PENDING: 'Pending',
        PAID_ON_TIME: 'Paid On Time',
        PAID_LATE: 'Paid Late',
        PAYMENT_DUE: 'Payment Due',
        PAYMENT_RESCHEDULED: 'Payment Rescheduled'
    }

    public readonly TRANSACTION_TYPE: any = {
        DEBIT_WING_WEI_LUY_TRANSFER_FEE: 'debit_wing_wei_luy_transfer_fee',
        CREDIT_WING_WEI_LUY_TRANSFER_FEE: 'credit_wing_wei_luy_transfer_fee',
        CREDIT_DISBURSEMENT: 'credit_disbursement',
        DREAM_POINT_COMMITMENT: 'dream_point_commitment',
        DREAM_POINT_EARNED: 'dream_point_earned',
        CREDIT_REPAYMENT: 'credit_repayment',
        FEE_PAYMENT: 'fee_payment',
        LATE_FEE: 'late_fee',
        PARTIAL_PAYMENT: 'partial_payment',
        DREAM_POINT_REFUND: 'dream_point_refund',
    };

    public readonly WIRE_TRANSFER_TYPES: any = {
        MOBILE: 'mobile',
        ACCOUNT: 'account'
    }

    public readonly AWS_IMAGE_PREFIX_URLS: any = {
        PAYMENT_REPCEIPTS: this.isDev ? 'https://dreams-dev-bucket.s3.ap-southeast-1.amazonaws.com/' : 'https://dreams-prod-bucket.s3.ap-southeast-1.amazonaws.com/'
    }

    public readonly JOTFORM_CONTRACT_URL: any = {
        DEV: 'https://form.jotform.com/dreams_international/dev-loan-contract',
        PROD: 'https://form.jotform.com/dreams_international/loan-contract',
    }

    public readonly ZOHO_MODULES: any = {
        DREAMER: 'Leads',
        LOAN: 'Loans',
        TASK: 'Tasks',
        REPAYMENT_SCHEDULES: 'Repayment_Schedules',
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

    public readonly BASE_RETOOL_URL = this.isDev ? "https://gojo.retool.com/apps/ed171e5c-250d-11ed-b962-9fea298077ce/CBS?_environment=staging&_releaseVersion=latest" : "https://gojo.retool.com/apps/ed171e5c-250d-11ed-b962-9fea298077ce/CBS?_environment=production&_releaseVersion=latest";
    public readonly BASE_SENDPULSE_URL = this.isDev ? "https://login.sendpulse.com/messengers/chats/62bad9dd3ceed143a323bc5f/contacts/all/" : "https://login.sendpulse.com/messengers/chats/63087d88e330bc7fb767d166/contacts/all/";

    public readonly DISBURSEMENT_TASK_ASSIGNEE = "mohit.joshi@gojo.co";
    public readonly PAYMENT_TASK_ASSIGNEE = "mohit.joshi@gojo.co";

    public readonly SENDPULSE_FLOW: any = {
        //KYC Flow ID: Flow_4.4
        "KYC_FLOW": this.isDev ? '62be938d81768640cc494f34' : '63502d36186d03250968943d',
        "APPLICATION_STATUS_FLOW_ID": {
            "Disbursed": this.isDev ? "62fc9cd35c6b0b21d713cdea" : '63502d5e19b15a483a50d3a4',
            "Approved": this.isDev ? "6343f1b75eba5c54cb644455" : '63502d056a996b64ec62e105',
            "Not Qualified": this.isDev ? "6343f27a0674f62c693537b5" : '63502d18b91ed817db4f248c'
        },
        "REMINDER_FLOW_ID": {
            "23_DAYS": this.isDev ? "632c3a3f8de7ab098c2673d9" : "63502e395b027f7bd405be68",
            "16_DAYS": this.isDev ? "632c3d8e123ab83d924cddc8" : "63502e57f7c4133d887a03ee",
            "9_DAYS": this.isDev ? "632c3f04c54feb769e5a4082" : "63502e6d6a996b64ec62e10d",
            "2_DAYS": this.isDev ? "632c40021f206771792caf37" : "63502e816a996b64ec62e111",
            "1_DAY": this.isDev ? "632c407d02efd900e2548dab" : "63502e99e4c17d77bf04b232",
            "0_DAY_MORNING": this.isDev ? "632c44a770b9686d4b564a39" : "63502eae96540263f53be73f",
            "0_DAY_EVENING": this.isDev ? "632c44d8b14ebd4e7c09fd99" : "63502ec4b0b67d734e02b295",
            "-1_DAY_MORNING": this.isDev ? "632c5a35415c9d1596763aa1" : "63502ee01cfc4a2ec34697cf",
            "-1_DAY_EVENING": this.isDev ? "632c5c685033365c2a07a378" : "63503b74b6b4857c2358aa13",
            "-2_DAYS_MORNING": this.isDev ? "632c5cf8ffd93d3a4168adb0" : "63502ef4fefa2c383b77fca2",
            "-2_DAYS_EVENING": this.isDev ? "632c5e8d5315aa0ef11404f5" : "63502f094423e44547440afd",
            "-3_DAYS_MORNING": this.isDev ? "632c5f2e48a0b42b26095073" : "63502f1f8465d91bf91109b8",
            "-3_DAYS_EVENING": this.isDev ? "632c615064d2872411413292" : "63502f34e4c17d77bf04b239",
            //FIXME: UPDATE FLOW ID
            "OLDER_THAN_3DAYS": this.isDev ? "632c615064d2872411413292" : "63502f34e4c17d77bf04b239"
        },
        //Contract_Form_Signed
        "FLOW_4.8": this.isDev ? "634cf815b9e72911917483a3" : '63502db319b15a483a50d3aa',
        //Verification_call
        "FLOW_4.7": this.isDev ? "6343d395bc32a404aa0f256a" : '63502d953159eb63ba30bead',
        // Payment Confirmation FLow
        "FLOW_7.4": this.isDev ? "637b3068f4f6fb4873206fcb" : '63502fb40f6f1901106bde54',
        // Video Received Confirmation Flow
        "FLOW_4.9": this.isDev ? '63722b1c383fae7ce1107fa4' : '637b687dbaff8b1f2208d173',
        // Send Video Message Flow
        "FLOW_4.6": this.isDev ? '6372277f3431f37834181fcd' : '637b67e282e795597a04e5a9'


    }
    public readonly SENDPULSE_VARIABLE_ID = {
        "ACTIVE_LOAN_ID": this.isDev ? "632ae8966a397f4a4c32c516" : "635033c02f07b52f43049e30",
        "CLIENT_ID": this.isDev ? "6347ecf0ad118c34872233f6" : "6350345bd116f23137276bc6",
        "TIER": this.isDev ? "6333ce7e4abfcd3b000c14d7" : "635033fabb24cc18be46315d",
        "MAX_CREDIT_AMOUNT": this.isDev ? "630f3559fc45bf34001312c7" : "6350317bcef5586a617e2b77",
        "NEXT_LOAN_AMOUNT": this.isDev ? "6347ece53cfb19125f6d0b58" : "6350344b00bc7d0dfa140eeb",
    }

    // Repayment Schuedle Global Configurations
    public readonly INSTALMENT_MEMBERSHIP_FEE = 3;
    public readonly INSTALMENT_GRACE_PERIOD_DAYS = 3;
    public readonly INSTALMENT_PAYMENT_STATUS: any = {
        NOT_PAID: 100,
        PARTIAL_PAID: 200,
        IN_GRACE_PERIOD: 300,
        PAYMENT_DUE: 400,
        WAIVED_OFF: 500,
        PAID_ON_TIME: 600,
        PAID_LATE: 700,
    }
    public readonly INSTALMENT_PAYMENT_STATUS_STR: any = {
        100: 'Not Paid',
        200: 'Partial Paid',
        300: 'In Grace Period',
        400: 'Payment Due',
        500: 'Waived Off',
        600: 'Paid On Time',
        700: 'Paid Late',
    }

    public readonly INSTALMENT_SCHEDULING_STATUS: any = {
        NOT_SCHEDULED: 100,
        SCHEDULED: 200,
        COMPLETED: 300,
    }

    public readonly INSTALMENT_SCHEDULING_STATUS_STR: any = {
        100: 'Not Scheduled',
        200: 'Scheduled',
        300: 'Completed'
    }

    public readonly INSTALMENT_TRANSACTION_TYPE: any = {
        DEBIT_WING_WEI_LUY_TRANSFER_FEE: 'debit_wing_wei_luy_transfer_fee',
        CREDIT_WING_WEI_LUY_TRANSFER_FEE: 'credit_wing_wei_luy_transfer_fee',
        CREDIT_DISBURSEMENT: 'credit_disbursement',
        DREAM_POINT_COMMITMENT: 'dream_point_commitment',
        DREAM_POINT_EARNED: 'dream_point_earned',
        CREDIT_REPAYMENT: 'credit_repayment',
        FEE_PAYMENT: 'fee_payment',
        ADDITIONAL_FEE: 'additional_fee',
        PARTIAL_PAYMENT: 'partial_payment',
        DREAM_POINT_REFUND: 'dream_point_refund',
    };


    /* constructor(
    ) { }

    logenv() {
        this.log.log("env =" + process.env.NODE_ENV);
        this.log.log("GLOBAL Services Dev Environment =" + this.isDev);
        this.log.log("Sendpulse flow IDs =" + JSON.stringify(this.SENDPULSE_FLOW));
        this.log.log("Sendpulse Variable IDs =" + JSON.stringify(this.SENDPULSE_VARIABLE_ID));
    } */


}
