import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Repository } from 'typeorm';
import { GlobalService } from "../../../globals/usecases/global.service";
import { LoanService } from "../../loan/usecases/loan.service";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { TransactionService } from "../../transaction/usecases/transaction.service";

@Injectable()
export class HandleEqualPaymentUsecase {
    private readonly logger = new CustomLogger(HandleEqualPaymentUsecase.name);

    constructor(
        private readonly globalService: GlobalService,
        private readonly loanService: LoanService,
        private readonly transactionService: TransactionService,
        private readonly repaymentScheduleService: RepaymentScheduleService,
    ) { }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });

        await this.createTransactions(processRepaymentDto, scheudle_instalment);
    }

    async createTransactions(processRepaymentDto: any, scheudle_instalment: any) {
        // Partial Paid Transaction
        const createPartialPaidTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            scheudle_instalment_id: scheudle_instalment.id,
            amount: processRepaymentDto.amount,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.PARTIAL_PAYMENT,
        };
        await this.transactionService.create(createPartialPaidTxnDto);

        // Credit Repayment Transaction
        const createCreditRepaymentTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            scheudle_instalment_id: scheudle_instalment.id,
            amount: scheudle_instalment.ins_principal_amount,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.CREDIT_REPAYMENT,
        };
        await this.transactionService.create(createCreditRepaymentTxnDto);

        // Membership Fee Payment Transaction
        const createInstalmentFeeTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            scheudle_instalment_id: scheudle_instalment.id,
            amount: scheudle_instalment.ins_membership_fee,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.FEE_PAYMENT,
        };
        await this.transactionService.create(createInstalmentFeeTxnDto);

        // Additional Fee Payment Transaction
        if (scheudle_instalment.ins_additional_fee && scheudle_instalment.ins_additional_fee > 0) {
            const createAdditionalFeeTxnDto = {
                loan_id: processRepaymentDto.loan_id,
                scheudle_instalment_id: scheudle_instalment.id,
                amount: scheudle_instalment.ins_additional_fee,
                type: this.globalService.INSTALMENT_TRANSACTION_TYPE.ADDITIONAL_FEE,
            };
            await this.transactionService.create(createAdditionalFeeTxnDto);
        }
    }
}
