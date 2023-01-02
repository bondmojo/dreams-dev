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
import { HandleEqualPaymentUsecase } from "./handle-equal-payment.usecase";
import { HandleUnderPaymentUsecase } from "./handle-under-payment.usecase";
@Injectable()
export class HandleOverPaymentUsecase {
    private readonly logger = new CustomLogger(HandleOverPaymentUsecase.name);

    constructor(
        private readonly globalService: GlobalService,
        private readonly loanService: LoanService,
        private readonly transactionService: TransactionService,
        private readonly repaymentScheduleService: RepaymentScheduleService,
        private readonly repaymentHelperService: RepaymentHelperService,
        private readonly handleEqualPaymentUsecase: HandleEqualPaymentUsecase,
        private readonly handleUnderPaymentUsecase: HandleUnderPaymentUsecase
    ) { }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        while (processRepaymentDto.amount > 0) {
            const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
            if (scheudle_instalment.ins_overdue_amount >= processRepaymentDto.amount) {
                const equalPaymentProcessDto = new ProcessRepaymentDto();
                equalPaymentProcessDto.loan_id = loan.id;
                equalPaymentProcessDto.amount = scheudle_instalment.ins_overdue_amount;
                equalPaymentProcessDto.image = processRepaymentDto.image;
                equalPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleEqualPaymentUsecase.process(equalPaymentProcessDto);

                processRepaymentDto.amount = processRepaymentDto.amount - scheudle_instalment.ins_overdue_amount;

            } else if (scheudle_instalment.ins_overdue_amount < processRepaymentDto.amount) {
                const underPaymentProcessDto = new ProcessRepaymentDto();
                underPaymentProcessDto.loan_id = loan.id;
                underPaymentProcessDto.amount = processRepaymentDto.amount;
                underPaymentProcessDto.image = processRepaymentDto.image;
                underPaymentProcessDto.note = processRepaymentDto.note;
                this.handleUnderPaymentUsecase.process(underPaymentProcessDto);

                processRepaymentDto.amount = 0;
            }
        }
    }
}
