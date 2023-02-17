import { Injectable } from "@nestjs/common";
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../../loan/entities/loan.entity';
import { HandleRepaymentUsecase } from "./handle-repayment.usecase";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { UpdateRepaymentScheduleDto } from '../../repayment_schedule/dto';
import { UpdateLoanDto } from "src/loan_management/loan/dto/update-loan.dto";
@Injectable()
export class HandleUnderRepaymentUsecase extends HandleRepaymentUsecase {
    private readonly logger = new CustomLogger(HandleUnderRepaymentUsecase.name);

    async process(processRepaymentDto: ProcessRepaymentDto, doCreatePartialPaymentTransaction = true, isFunctionCalledFromOverPaymentUsecase = false): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
        await this.createTransactions(processRepaymentDto, scheudle_instalment, loan, doCreatePartialPaymentTransaction);
        await this.updateRepaymentSchedule(scheudle_instalment, processRepaymentDto);
        await this.updateLoan(processRepaymentDto, loan);

        /**
         *  Do below task when function is not called from over payment usecase.
         *  Becuase these tasks are already doing in over payment usecase file.
         */
        if (!isFunctionCalledFromOverPaymentUsecase) {
            const isInstalmentFullyPaid = false;
            await this.updateIsInstalmentFullyPaidOnSendpulse(loan, isInstalmentFullyPaid);
            await this.triggerPaymentConfirmationFlow(loan);
        }
    }

    async updateLoan(processRepaymentDto: ProcessRepaymentDto, loan: Loan) {
        const outstanding_amount = loan.outstanding_amount - processRepaymentDto.amount;
        const updateLoanDto = new UpdateLoanDto();
        updateLoanDto.id = loan.id;
        updateLoanDto.outstanding_amount = outstanding_amount;
        await this.loanService.update(updateLoanDto);

        let zohoKeyValuePairs: any = {};

        zohoKeyValuePairs = {
            Outstanding_Balance: outstanding_amount,
            Loan_Status: new Choice(this.globalService.ZOHO_LOAN_STATUS.PARTIAL_PAID),
            Last_Repaid_Date: new Date(),
        };
        zohoKeyValuePairs.Paid_Amount = await this.getLoanTotalPaidAmount(loan.id);

        this.logger.log(`Updating Loan On Zoho ${loan.zoho_loan_id} ${JSON.stringify(zohoKeyValuePairs)} `);
        await this.zohoRepaymentHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);

    }

    async updateRepaymentSchedule(scheudle_instalment: any, processRepaymentDto: ProcessRepaymentDto) {
        const updateRepaymentScheduleDto = new UpdateRepaymentScheduleDto();
        updateRepaymentScheduleDto.id = scheudle_instalment.id;
        updateRepaymentScheduleDto.repayment_status = this.globalService.INSTALMENT_PAYMENT_STATUS.PARTIAL_PAID;
        updateRepaymentScheduleDto.ins_overdue_amount = scheudle_instalment.ins_overdue_amount - processRepaymentDto.amount;
        updateRepaymentScheduleDto.total_paid_amount = (Number(scheudle_instalment.total_paid_amount) + Number(processRepaymentDto.amount));
        await this.repaymentScheduleService.update(updateRepaymentScheduleDto);

        let zohoKeyValuePairs: any = {};
        zohoKeyValuePairs = {
            Repayment_Status: new Choice(this.globalService.INSTALMENT_PAYMENT_STATUS_STR[updateRepaymentScheduleDto.repayment_status]),
            Overdue_Amount: updateRepaymentScheduleDto.ins_overdue_amount,
            Last_Paid_Date: new Date(),
        };
        zohoKeyValuePairs.Paid_Amount = Number(updateRepaymentScheduleDto.total_paid_amount);
        this.logger.log(`Updating Repayment Schedule On Zoho ${updateRepaymentScheduleDto.id} ${JSON.stringify(zohoKeyValuePairs)} ${this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES}`);
        await this.zohoRepaymentHelperService.updateZohoFields(scheudle_instalment.zoho_repayment_schedule_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES);

    }

    async createTransactions(processRepaymentDto: any, scheudle_instalment: any, loan: Loan, doCreatePartialPaymentTransaction: boolean) {
        // Partial Paid Transaction
        if (doCreatePartialPaymentTransaction) {
            const createPartialPaidTxnDto = {
                loan_id: processRepaymentDto.loan_id,
                repayment_schedule_id: scheudle_instalment.id,
                client_id: loan.client_id,
                amount: processRepaymentDto.amount,
                image: processRepaymentDto.image,
                type: this.globalService.INSTALMENT_TRANSACTION_TYPE.PARTIAL_PAYMENT,
            };
            await this.transactionService.create(createPartialPaidTxnDto);
        }
    }
}
