import { ProcessRepaymentDto } from "../dto";
import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../custom_logger";
import { GetHandleRepaymentFactory } from "../factory/get-handle-repayment.factory";
@Injectable()
export class RepaymentService {
    private readonly logger = new CustomLogger(RepaymentService.name);

    constructor(
        private readonly getHandleRepaymentFactory: GetHandleRepaymentFactory,
    ) { }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        try {

            const handle_repayment_obj = await this.getHandleRepaymentFactory.create(processRepaymentDto);
            handle_repayment_obj.process(processRepaymentDto);

        } catch (error) {
            this.logger.error(`Error in Loan Instalment Processing for Loan ID = ${processRepaymentDto.loan_id} error:  ${error}`);
        }
    }
}
