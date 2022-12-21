import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRepaymentScheduleDto, GetRepaymentScheduleModelDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { Repository } from 'typeorm';
import { RepaymentScheduleModel } from '../model/repayment-scehdule.model';
import { GlobalService } from "src/globals/usecases/global.service";
import { addMonths } from 'date-fns';

@Injectable()
export class CreateRepaymentScheduleUsecase {
    private readonly log = new CustomLogger(CreateRepaymentScheduleUsecase.name);
    constructor(
        @InjectRepository(RepaymentSchedule)
        private readonly repaymentScheduleRepository: Repository<RepaymentSchedule>,

        private readonly globalService: GlobalService
    ) { }

    async create(createRepaymentScheduleDto: CreateRepaymentScheduleDto): Promise<string> {
        // Generating client id
        const tenure = Number(createRepaymentScheduleDto.loan_tenure);
        for (let i = 0; i < tenure; i++) {
            const getRepaymentScheduleModelDto = new GetRepaymentScheduleModelDto();
            getRepaymentScheduleModelDto.instalment_number = i + 1;
            getRepaymentScheduleModelDto.principal_amount = createRepaymentScheduleDto.loan_amount / tenure;
            getRepaymentScheduleModelDto.loan_id = createRepaymentScheduleDto.loan_id;
            getRepaymentScheduleModelDto.client_id = createRepaymentScheduleDto.client_id;

            const repayment_schedule_model = this.getRepaymentScheduleModel(getRepaymentScheduleModelDto);
            console.log("repayment_schedule_model :: ", repayment_schedule_model);
            await this.repaymentScheduleRepository.save(repayment_schedule_model);
        }
        return 'Done';
    }

    getRepaymentScheduleModel(getRepaymentScheduleModelDto: GetRepaymentScheduleModelDto): RepaymentScheduleModel {
        const model = new RepaymentScheduleModel();
        const now = new Date();
        const repayment_status = (getRepaymentScheduleModelDto.instalment_number == 1) ? 'SCHEDULED' : 'NOT_SCHEDULD'

        model.id = 'RS' + Math.floor(Math.random() * 100000000);
        model.loan_id = getRepaymentScheduleModelDto.loan_id;
        model.client_id = getRepaymentScheduleModelDto.client_id;
        model.instalment_number = getRepaymentScheduleModelDto.instalment_number;

        model.ins_principal_amount = getRepaymentScheduleModelDto.principal_amount;
        model.ins_membership_fee = this.globalService.INSTALMENT_MEMBERSHIP_FEE;
        model.ins_overdue_amount = model.ins_principal_amount + model.ins_membership_fee;
        model.ins_additional_fee = 0;
        model.total_paid_amount = 0;

        model.repayment_status = this.globalService.INSTALMENT_PAYMENT_STATUS[repayment_status];
        model.grace_period = this.globalService.INSTALMENT_GRACE_PERIOD_DAYS;
        model.number_of_penalties = 0;
        model.ins_from_date = addMonths(now, getRepaymentScheduleModelDto.instalment_number - 1);
        model.ins_to_date = addMonths(now, getRepaymentScheduleModelDto.instalment_number);
        model.due_date = addMonths(now, getRepaymentScheduleModelDto.instalment_number);
        return model;
    }

}
