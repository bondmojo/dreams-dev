import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { Repository } from 'typeorm';
@Injectable()
export class RepaymentScheduleService {
    private readonly log = new CustomLogger(RepaymentScheduleService.name);
    constructor(
        @InjectRepository(RepaymentSchedule)
        private readonly repaymentScheduleRepository: Repository<RepaymentSchedule>,

    ) { }
    //

}
