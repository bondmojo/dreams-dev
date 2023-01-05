import { Injectable } from "@nestjs/common";
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { GlobalService } from "../../../globals/usecases/global.service";
import { LoanService } from "../../loan/usecases/loan.service";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { compareAsc, startOfDay, addDays } from "date-fns"
import { UpdateRepaymentScheduleDto } from '../../repayment_schedule/dto';
import { Loan } from '../../loan/entities/loan.entity';
import { UpdateLoanDto } from "src/loan_management/loan/dto/update-loan.dto";
import { RepaymentHelperService } from "../repayment-helper.service";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { ZohoRepaymentHelperService } from "../zoho-repayment-helper.service";

@Injectable()
export class HandleUnderPaymentUsecase {
    private readonly logger = new CustomLogger(HandleUnderPaymentUsecase.name);

    constructor(
        private readonly globalService: GlobalService,
        private readonly loanService: LoanService,
        private readonly transactionService: TransactionService,
        private readonly repaymentScheduleService: RepaymentScheduleService,
        private readonly repaymentHelperService: RepaymentHelperService,
        private readonly zohoRepaymentHelperService: ZohoRepaymentHelperService,
    ) { }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
        await this.createTransactions(processRepaymentDto, scheudle_instalment);
        await this.updateRepaymentSchedule(scheudle_instalment, processRepaymentDto);
        await this.updateLoan(processRepaymentDto, loan);
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
        };
        this.logger.log(`Updating Loan On Zoho ${loan.zoho_loan_id} ${JSON.stringify(zohoKeyValuePairs)} `);
        await this.zohoRepaymentHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);

    }

    async updateRepaymentSchedule(scheudle_instalment: any, processRepaymentDto: ProcessRepaymentDto) {
        const updateRepaymentScheduleDto = new UpdateRepaymentScheduleDto();
        updateRepaymentScheduleDto.id = scheudle_instalment.id;
        updateRepaymentScheduleDto.repayment_status = this.globalService.INSTALMENT_PAYMENT_STATUS.PARTIAL_PAID;
        updateRepaymentScheduleDto.ins_overdue_amount = scheudle_instalment.ins_overdue_amount - processRepaymentDto.amount;
        await this.repaymentScheduleService.update(updateRepaymentScheduleDto);

        let zohoKeyValuePairs: any = {};
        zohoKeyValuePairs = {
            Repayment_Status: new Choice(this.globalService.INSTALMENT_PAYMENT_STATUS_STR[updateRepaymentScheduleDto.repayment_status]),
            Overdue_Amount: updateRepaymentScheduleDto.ins_overdue_amount,
            Last_Paid_Date: new Date(),
        };
        this.logger.log(`Updating Repayment Schedule On Zoho ${updateRepaymentScheduleDto.id} ${JSON.stringify(zohoKeyValuePairs)} ${this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES}`);
        await this.zohoRepaymentHelperService.updateZohoFields(scheudle_instalment.zoho_repayment_schedule_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.REPAYMENT_SCHEDULES);

    }

    async createTransactions(processRepaymentDto: any, scheudle_instalment: any) {
        // Partial Paid Transaction
        const createPartialPaidTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            scheudle_instalment_id: scheudle_instalment.id,
            amount: processRepaymentDto.amount,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.PARTIAL_PAYMENT,
        };
        await this.transactionService.create(createPartialPaidTxnDto);
    }
}
