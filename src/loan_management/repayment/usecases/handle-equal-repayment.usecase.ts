import { Injectable } from "@nestjs/common";
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../../loan/entities/loan.entity';
import { differenceInCalendarDays, compareAsc, startOfDay, addDays } from "date-fns"
import { HandleRepaymentUsecase } from './handle-repayment.usecase';
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { UpdateRepaymentScheduleDto } from '../../repayment_schedule/dto';
import { UpdateLoanDto } from "src/loan_management/loan/dto/update-loan.dto";
import { UpdateClientDto } from "src/loan_management/client/dto";
@Injectable()
export class HandleEqualRepaymentUsecase extends HandleRepaymentUsecase {
    private readonly logger = new CustomLogger(HandleEqualRepaymentUsecase.name);

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
        await this.createTransactions(processRepaymentDto, scheudle_instalment);
        await this.updateRepaymentSchedule(scheudle_instalment, processRepaymentDto);
        await this.scheduleNextInstalment(scheudle_instalment, loan.id);
        await this.updateLoan(processRepaymentDto, loan);
    }

    async updateLoan(processRepaymentDto: ProcessRepaymentDto, loan: Loan) {
        // Updating data in DB
        const outstanding_amount = loan.outstanding_amount - processRepaymentDto.amount;
        const updateLoanDto = new UpdateLoanDto();
        // if outstanding balance is zero then consider as today is fully paid date
        if (outstanding_amount == 0) {
            updateLoanDto.payment_status = await this.getLoanPaymentStatus(loan);
            updateLoanDto.paid_date = new Date();
            updateLoanDto.status = this.globalService.LOAN_STATUS.FULLY_PAID;
            await this.updateClientAfterFullyPaid(processRepaymentDto, loan);
            await this.createDreamPointEarnedTransaction(processRepaymentDto, loan);
        }
        updateLoanDto.id = loan.id;
        updateLoanDto.outstanding_amount = outstanding_amount;
        await this.loanService.update(updateLoanDto);

        // Updating data in Zoho

        let zohoKeyValuePairs: any = {};
        zohoKeyValuePairs = {
            Payment_Status: new Choice(updateLoanDto.payment_status),
            Outstanding_Balance: outstanding_amount,
            Loan_Status: new Choice(this.globalService.ZOHO_LOAN_STATUS.PARTIAL_PAID),
        };
        if (outstanding_amount == 0) {
            // if outstanding balance is zero then consider as today is fully paid date
            zohoKeyValuePairs.Days_Fully_Paid = differenceInCalendarDays(new Date(), new Date(loan.disbursed_date))
            zohoKeyValuePairs.Loan_Status = new Choice(this.globalService.ZOHO_LOAN_STATUS.FULLY_PAID)
        }
        zohoKeyValuePairs.Paid_Amount = await this.getLoanTotalPaidAmount(loan.id);

        this.logger.log(`Updating Loan On Zoho ${loan.zoho_loan_id} ${JSON.stringify(zohoKeyValuePairs)} `);
        await this.zohoRepaymentHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);

    }

    async updateClientAfterFullyPaid(processRepaymentDto: ProcessRepaymentDto, loan: Loan) {
        const client_new_tier = +loan?.client?.tier + 1;
        const dream_point_earned = loan?.client?.dream_points_earned + loan?.dream_point;
        let dream_point_committed = loan?.client?.dream_points_committed - loan?.dream_point;

        // Make dream point commited to zero if its values is negative
        dream_point_committed = dream_point_committed < 0 ? 0 : dream_point_committed;
        const updateClientDto = new UpdateClientDto()
        updateClientDto.id = loan?.client?.id;
        updateClientDto.tier = '' + client_new_tier;
        updateClientDto.dream_points_earned = dream_point_earned;
        updateClientDto.dream_points_committed = dream_point_committed

        await this.clientService.update(updateClientDto);

        return;
    }

    async scheduleNextInstalment(scheudle_instalment: any, loan_id: string) {
        const next_ins_number = scheudle_instalment.ins_number + 1;
        const next_scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan_id, ins_number: next_ins_number, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.NOT_SCHEDULED });
        if (!next_scheudle_instalment) {
            return 'No Due Instalment pending for this user.'
        }
        const updateRepaymentScheduleDto = new UpdateRepaymentScheduleDto();
        updateRepaymentScheduleDto.id = next_scheudle_instalment.id;
        updateRepaymentScheduleDto.scheduling_status = this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED;
        await this.repaymentScheduleService.update(updateRepaymentScheduleDto);

        let zohoKeyValuePairs: any = {};
        zohoKeyValuePairs = {
            Installment_Status: new Choice(this.globalService.INSTALMENT_SCHEDULING_STATUS_STR[updateRepaymentScheduleDto.scheduling_status]),
        };
        await this.zohoRepaymentHelperService.updateZohoFields(next_scheudle_instalment.zoho_repayment_schedule_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES);

    }

    async updateRepaymentSchedule(scheudle_instalment: any, processRepaymentDto: ProcessRepaymentDto) {
        const repayment_status = this.calcInsPaymentStatus(scheudle_instalment);
        const updateRepaymentScheduleDto = new UpdateRepaymentScheduleDto();
        updateRepaymentScheduleDto.id = scheudle_instalment.id;
        updateRepaymentScheduleDto.repayment_status = repayment_status;
        updateRepaymentScheduleDto.scheduling_status = this.globalService.INSTALMENT_SCHEDULING_STATUS.COMPLETED;
        updateRepaymentScheduleDto.ins_overdue_amount = 0;
        updateRepaymentScheduleDto.paid_date = new Date();
        updateRepaymentScheduleDto.total_paid_amount = (Number(scheudle_instalment.total_paid_amount) + Number(processRepaymentDto.amount));
        await this.repaymentScheduleService.update(updateRepaymentScheduleDto);

        let zohoKeyValuePairs: any = {};
        zohoKeyValuePairs = {
            Repayment_Status: new Choice(this.globalService.INSTALMENT_PAYMENT_STATUS_STR[updateRepaymentScheduleDto.repayment_status]),
            Installment_Status: new Choice(this.globalService.INSTALMENT_SCHEDULING_STATUS_STR[updateRepaymentScheduleDto.scheduling_status]),
            Overdue_Amount: updateRepaymentScheduleDto.ins_overdue_amount,
            Last_Paid_Date: new Date(),
        };
        zohoKeyValuePairs.Paid_Amount = Number(updateRepaymentScheduleDto.total_paid_amount);
        this.logger.log(`Updating Repayment Schedule On Zoho ${updateRepaymentScheduleDto.id} ${JSON.stringify(zohoKeyValuePairs)} ${this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES}`);
        await this.zohoRepaymentHelperService.updateZohoFields(scheudle_instalment.zoho_repayment_schedule_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES);
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
            repayment_schedule_id: scheudle_instalment.id,
            amount: processRepaymentDto.amount,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.PARTIAL_PAYMENT,
        };
        await this.transactionService.create(createPartialPaidTxnDto);

        // Credit Repayment Transaction
        const createCreditRepaymentTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            repayment_schedule_id: scheudle_instalment.id,
            amount: scheudle_instalment.ins_principal_amount,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.CREDIT_REPAYMENT,
        };
        await this.transactionService.create(createCreditRepaymentTxnDto);

        // Membership Fee Payment Transaction
        const createInstalmentFeeTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            repayment_schedule_id: scheudle_instalment.id,
            amount: scheudle_instalment.ins_membership_fee,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.FEE_PAYMENT,
        };
        await this.transactionService.create(createInstalmentFeeTxnDto);

        // Additional Fee Payment Transaction
        if (scheudle_instalment.ins_additional_fee && scheudle_instalment.ins_additional_fee > 0) {
            const createAdditionalFeeTxnDto = {
                loan_id: processRepaymentDto.loan_id,
                repayment_schedule_id: scheudle_instalment.id,
                amount: scheudle_instalment.ins_additional_fee,
                image: processRepaymentDto.image,
                type: this.globalService.INSTALMENT_TRANSACTION_TYPE.ADDITIONAL_FEE,
            };
            await this.transactionService.create(createAdditionalFeeTxnDto);
        }
    }

    async createDreamPointEarnedTransaction(processRepaymentDto: any, loan: Loan) {
        // Additional Fee Payment Transaction
        const createAdditionalFeeTxnDto = {
            loan_id: loan.id,
            amount: loan.dream_point,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.DREAM_POINT_EARNED,
            note: processRepaymentDto.note,
        };
        await this.transactionService.create(createAdditionalFeeTxnDto);
    }
}
