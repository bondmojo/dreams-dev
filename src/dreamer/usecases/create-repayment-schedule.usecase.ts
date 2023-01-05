import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../custom_logger";
import { DreamerRepository } from "../repository/dreamer.repository";
import { CreateRepaymentScheduleDto } from "./dto/create-repayment-schedule.dto";


@Injectable()
export class CreateZohoRepaymentScheduleUsecase {
    private readonly log = new CustomLogger(CreateZohoRepaymentScheduleUsecase.name);
    constructor(private readonly repository: DreamerRepository,
    ) { }

    async create(recordPairArray: []) {

        return await this.repository.createBulkRecordOnZoho(recordPairArray, 'repayment_schedules');

        //return await this.repository.createLoanApplication(createLoanDto.dreamerId, createLoanDto);
    }

}
