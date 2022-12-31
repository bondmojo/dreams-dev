import { BadRequestException, Injectable } from "@nestjs/common";
import { ProcessRepaymentDto } from "./dto";
import { CustomLogger } from "../../custom_logger";
import { GlobalService } from "../../globals/usecases/global.service";
import { LoanService } from "../loan/usecases/loan.service";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { HandleEqualPaymentUsecase } from "./usecases/handle-equal-payment.usecase";
@Injectable()
export class RepaymentService {
    private readonly logger = new CustomLogger(RepaymentService.name);

    constructor(
        private readonly globalService: GlobalService,
        private readonly loanService: LoanService,
        private readonly repaymentScheduleService: RepaymentScheduleService,
        private readonly handleEqualPaymentUsecase: HandleEqualPaymentUsecase
    ) { }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });

        if (!scheudle_instalment) {
            this.logger.log(`No Schedule Instalment Found For ${JSON.stringify(processRepaymentDto)}`);
            throw new BadRequestException('Forbidden', 'No Schedule Instalment Found!');
        }

        if (scheudle_instalment.ins_overdue_amount == processRepaymentDto.amount) {
            await this.handleEqualPaymentUsecase.process(processRepaymentDto);
        }

        return 'Done';
    }
}
