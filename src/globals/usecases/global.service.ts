import { Injectable } from "@nestjs/common";


@Injectable()
export class GlobalService {
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
        PARTIAL_PAYMENT: 'partial_payment'
    };

    public readonly WIRE_TRANSFER_TYPES: any = {
        MOBILE: 'mobile',
        ACCOUNT: 'account'
    }

    public readonly REPAYMENT_TRANSACTION_TYPE: any = {
        CLIENT_CREDIT: 'client_credit',
        DREAM_POINT_REFUND: 'dream_point_refund'
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



}
