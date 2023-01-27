import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../custom_logger";
import { GlobalService } from "../../../globals/usecases/global.service"
import { Loan } from '../entities/loan.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DreamerModel } from "src/external/zoho/dreams/dreamer/usecases/model/dreamer.model";
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
import { MethodParamsRespLogger } from "src/decorator";
@Injectable()
export class SendpulseLoanHelperService {
    private readonly log = new CustomLogger(SendpulseLoanHelperService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly globalService: GlobalService,
        private readonly sendpluseService: SendpluseService,
    ) { }

    async triggerVideoVerificationFlowIfClientHasSuccessfullyPaidLoan(createLoanDto: any): Promise<any> {
        const loan = await this.loanRepository.findOne({
            where: {
                client_id: createLoanDto.client_id,
                status: this.globalService.LOAN_STATUS.FULLY_PAID
            },
            relations: ['client'],
        });
        // If user has past full paid loan then only trigger video verification flow
        if (loan) {
            const flow_id = this.globalService.SENDPULSE_FLOW['FLOW_4.6'];
            const model = new DreamerModel();
            model.externalId = loan.client.sendpulse_id;
            return await this.sendpluseService.runFlow(model, flow_id);
        }

        return;
    }

    async triggerFlow(sendpulse_id: string, flow_id: string): Promise<any> {
        const model = new DreamerModel();
        model.externalId = sendpulse_id;
        return await this.sendpluseService.runFlow(model, flow_id);
    }


}
