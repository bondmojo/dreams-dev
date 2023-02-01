import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { LoanService } from "../../loan/usecases/loan.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { GlobalService } from "../../../globals/usecases/global.service";
import { HandleOverRepaymentUsecase } from "../usecases/handle-over-repayment.usecase";
import { HandleEqualRepaymentUsecase } from "../usecases/handle-equal-repayment.usecase";
import { HandleUnderRepaymentUsecase } from "../usecases/handle-under-repayment.usecase";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { HandleRepaymentUsecase } from "../usecases/handle-repayment.usecase";
@Injectable()
export class GetHandleRepaymentFactory {
    private readonly logger = new CustomLogger(GetHandleRepaymentFactory.name);

    constructor(
        private readonly globalService: GlobalService,
        private readonly loanService: LoanService,
        private readonly repaymentScheduleService: RepaymentScheduleService,
        private readonly handleEqualRepaymentUsecase: HandleEqualRepaymentUsecase,
        private readonly handleUnderRepaymentUsecase: HandleUnderRepaymentUsecase,
        private readonly handleOverRepaymentUsecase: HandleOverRepaymentUsecase,
    ) { }

    async create(processRepaymentDto: ProcessRepaymentDto): Promise<HandleRepaymentUsecase> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });

        if (!scheudle_instalment) {
            this.logger.log(`No Schedule Instalment Found For ${JSON.stringify(processRepaymentDto)}`);
            throw new BadRequestException('No Schedule Instalment Found!');
        }


        if (processRepaymentDto.amount == scheudle_instalment.ins_overdue_amount) {
            return this.handleEqualRepaymentUsecase;
        }

        if (processRepaymentDto.amount < scheudle_instalment.ins_overdue_amount) {
            return this.handleUnderRepaymentUsecase;
        }
        return this.handleOverRepaymentUsecase;
    }
}
