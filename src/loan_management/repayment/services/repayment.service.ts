import { ProcessRepaymentDto } from "../dto";
import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../custom_logger";
import { GetHandleRepaymentFactory } from "../factory/get-handle-repayment.factory";
import { HandleRepaymentUsecase } from "../usecases/handle-repayment.usecase";
@Injectable()
export class RepaymentService {
    private readonly logger = new CustomLogger(RepaymentService.name);

    constructor(
        private readonly getHandleRepaymentFactory: GetHandleRepaymentFactory,
    ) { }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        try {

            const handle_repayment_obj: HandleRepaymentUsecase = await this.getHandleRepaymentFactory.create(processRepaymentDto);
            await handle_repayment_obj.process(processRepaymentDto);

        } catch (error) {
            this.logger.error(`Error in Loan Instalment Processing for Loan ID = ${processRepaymentDto.loan_id} error:  ${error}`);
        }
    }
}
