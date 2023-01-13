import { Injectable } from "@nestjs/common";
import { DreamerRepository } from "../dreamer/repository/dreamer.repository";
import { CreateRepaymentScheduleDto } from "./create-repayment-schedule.dto";
import { CustomLogger } from "src/custom_logger";
import { ZohoHelperService } from "../utility/zoho-helper.service";

@Injectable()
export class CreateZohoRepaymentScheduleUsecase {
    private readonly log = new CustomLogger(CreateZohoRepaymentScheduleUsecase.name);
    constructor(private readonly zohoHelperService: ZohoHelperService,
    ) { }

    async create(recordPairArray: []) {
        return await this.zohoHelperService.createBulkRecordOnZoho(recordPairArray, 'repayment_schedules');
    }

}
