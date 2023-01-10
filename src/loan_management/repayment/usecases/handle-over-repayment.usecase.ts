import { Injectable } from "@nestjs/common";
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { LoanService } from "../../loan/usecases/loan.service";
import { HandleRepaymentUsecase } from "./handle-repayment.usecase";
import { GlobalService } from "../../../globals/usecases/global.service";
import { HandleEqualRepaymentUsecase } from "./handle-equal-repayment.usecase";
import { HandleUnderRepaymentUsecase } from "./handle-under-repayment.usecase";
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { ZohoRepaymentHelperService } from "../services/zoho-repayment-helper.service";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
@Injectable()
export class HandleOverRepaymentUsecase extends HandleRepaymentUsecase {
    private readonly logger = new CustomLogger(HandleOverRepaymentUsecase.name);

    constructor(
        public readonly loanService: LoanService,
        public readonly globalService: GlobalService,
        public readonly transactionService: TransactionService,
        public readonly repaymentScheduleService: RepaymentScheduleService,
        public readonly zohoRepaymentHelperService: ZohoRepaymentHelperService,
        private readonly handleEqualPaymentUsecase: HandleEqualRepaymentUsecase,
        private readonly handleUnderRepaymentUsecase: HandleUnderRepaymentUsecase,
    ) {
        super(loanService, globalService, transactionService, repaymentScheduleService, zohoRepaymentHelperService);
    }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        while (processRepaymentDto.amount > 0) {
            const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
            if (processRepaymentDto.amount >= scheudle_instalment.ins_overdue_amount) {
                const equalPaymentProcessDto = new ProcessRepaymentDto();
                equalPaymentProcessDto.loan_id = loan.id;
                equalPaymentProcessDto.amount = scheudle_instalment.ins_overdue_amount;
                equalPaymentProcessDto.image = processRepaymentDto.image;
                equalPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleEqualPaymentUsecase.process(equalPaymentProcessDto);
                processRepaymentDto.amount = processRepaymentDto.amount - scheudle_instalment.ins_overdue_amount;

            } else if (processRepaymentDto.amount < scheudle_instalment.ins_overdue_amount) {
                const underPaymentProcessDto = new ProcessRepaymentDto();
                underPaymentProcessDto.loan_id = loan.id;
                underPaymentProcessDto.amount = processRepaymentDto.amount;
                underPaymentProcessDto.image = processRepaymentDto.image;
                underPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleUnderRepaymentUsecase.process(underPaymentProcessDto);
                processRepaymentDto.amount = 0;
            }
        }
    }
}
