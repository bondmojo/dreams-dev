import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Repository } from 'typeorm';
import { GlobalService } from "../../../globals/usecases/global.service";
import { LoanService } from "../../loan/usecases/loan.service";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { compareAsc, startOfDay, addDays } from "date-fns"
import { UpdateRepaymentScheduleDto } from '../../repayment_schedule/dto';

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
        await this.updateRepaymentSchedule(scheudle_instalment);
        await this.scheduleNextInstalment(scheudle_instalment, loan.id);
    }

    async scheduleNextInstalment(scheudle_instalment: any, loan_id: string) {
        const next_ins_number = scheudle_instalment.instalment_number + 1;
        const next_scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan_id, instalment_number: next_ins_number, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.NOT_SCHEDULED });
        if (!next_scheudle_instalment) {
            return 'No Due Instalment pending for this user.'
        }
        const updateRepaymentScheduleDto = new UpdateRepaymentScheduleDto();
        updateRepaymentScheduleDto.id = next_scheudle_instalment.id;
        updateRepaymentScheduleDto.scheduling_status = this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED;
        await this.repaymentScheduleService.update(updateRepaymentScheduleDto);
    }

    async updateRepaymentSchedule(scheudle_instalment: any) {
        const repayment_status = this.calcInsPaymentStatus(scheudle_instalment);
        const updateRepaymentScheduleDto = new UpdateRepaymentScheduleDto();
        updateRepaymentScheduleDto.id = scheudle_instalment.id;
        updateRepaymentScheduleDto.repayment_status = repayment_status;
        updateRepaymentScheduleDto.scheduling_status = this.globalService.INSTALMENT_SCHEDULING_STATUS.COMPLETED;
        updateRepaymentScheduleDto.ins_overdue_amount = 0;
        updateRepaymentScheduleDto.paid_date = new Date();

        await this.repaymentScheduleService.update(updateRepaymentScheduleDto);
    }

    calcInsPaymentStatus(scheudle_instalment: any): any {
        const first_repayment_date = (scheudle_instalment.previous_repayment_dates && scheudle_instalment.previous_repayment_dates.length) ? scheudle_instalment.previous_repayment_dates[0] : scheudle_instalment.due_date;
        const grace_repayment_date = addDays(new Date(first_repayment_date), this.globalService.INSTALMENT_GRACE_PERIOD_DAYS);
        const today = new Date();
        // if payment status is late if today is greater then grace repayment date
        if (compareAsc(startOfDay(today), grace_repayment_date) == 1) {
            return this.globalService.INSTALMENT_PAYMENT_STATUS.PAID_LATE;
        }
        return this.globalService.INSTALMENT_PAYMENT_STATUS.PAID_ON_TIME;
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
