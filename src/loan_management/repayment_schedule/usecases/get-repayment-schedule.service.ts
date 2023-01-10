import { Injectable } from "@nestjs/common";
import { GetRepaymentScheduleDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { GlobalService } from "src/globals/usecases/global.service";
import { addMonths } from 'date-fns';

@Injectable()
export class GetRepaymentScheduleUsecase {
    private readonly log = new CustomLogger(GetRepaymentScheduleUsecase.name);
    constructor(
        private readonly globalService: GlobalService
    ) { }

    async get(getRepaymentScheduleDto: GetRepaymentScheduleDto): Promise<string> {
        try {
            let tenure = Number(getRepaymentScheduleDto.loan_tenure_in_months);
            const wing_wei_luy_transfer_fee = getRepaymentScheduleDto.wing_wei_luy_transfer_fee ?? 0;
            const loan_amount = getRepaymentScheduleDto.loan_amount + wing_wei_luy_transfer_fee;
            if (tenure == null || tenure == 0) {
                tenure = 1;
            }

            const repaymentScheduleArray: any = [];
            for (let i = 0; i < tenure; i++) {
                const repaymentScheduleDto: any = {};
                repaymentScheduleDto.ins_number = i + 1;
                let principal_amount = Math.floor(loan_amount / tenure);
                //add remainder amount in last instalment.
                if (i == tenure - 1) {
                    principal_amount += loan_amount % tenure;
                }
                repaymentScheduleDto.ins_overdue_amount = Number((principal_amount + this.globalService.INSTALMENT_MEMBERSHIP_FEE).toFixed(2));
                const now = new Date();
                repaymentScheduleDto.due_date = addMonths(now, repaymentScheduleDto.ins_number);

                repaymentScheduleArray.push(repaymentScheduleDto);
            }

            this.log.debug("Repayment Schedule Plan =" + JSON.stringify(repaymentScheduleArray));
            return repaymentScheduleArray;
        }
        catch (error) {
            this.log.error(`Error in Repayment Schedule Creation ${error}`);
        }
    }

}
