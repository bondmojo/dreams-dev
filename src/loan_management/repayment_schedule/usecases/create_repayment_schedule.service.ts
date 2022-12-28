import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRepaymentScheduleDto, GetRepaymentScheduleModelDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { Repository } from 'typeorm';
import { RepaymentScheduleModel } from '../model/repayment-scehdule.model';
import { GlobalService } from "src/globals/usecases/global.service";
import { addMonths } from 'date-fns';
import { ZohoRepaymentScheduleHelper } from "./ZohoRepaymentScheduleHelper";

@Injectable()
export class CreateRepaymentScheduleUsecase {
    private readonly log = new CustomLogger(CreateRepaymentScheduleUsecase.name);
    constructor(
        @InjectRepository(RepaymentSchedule)
        private readonly repaymentScheduleRepository: Repository<RepaymentSchedule>,
        private readonly zohoRepaymentScheduleHelper: ZohoRepaymentScheduleHelper,
        private readonly globalService: GlobalService
    ) { }

    async create(createRepaymentScheduleDto: CreateRepaymentScheduleDto): Promise<string> {
        try {
            // Generating client id
            let tenure = Number(createRepaymentScheduleDto.loan_tenure_in_months);
            if (tenure == null || tenure == 0) {
                tenure = 1;
            }
            this.log.log("Creating Repayment schedule with tenure =" + tenure);

            const zohoRepaymentScheduleArray: any = [];
            for (let i = 0; i < tenure; i++) {
                const getRepaymentScheduleModelDto = new GetRepaymentScheduleModelDto();
                getRepaymentScheduleModelDto.instalment_number = i + 1;
                getRepaymentScheduleModelDto.principal_amount = Math.floor(createRepaymentScheduleDto.loan_amount / tenure);
                getRepaymentScheduleModelDto.loan_id = createRepaymentScheduleDto.loan_id;
                getRepaymentScheduleModelDto.client_id = createRepaymentScheduleDto.client_id;
                getRepaymentScheduleModelDto.zoho_loan_id = createRepaymentScheduleDto.zoho_loan_id;


                //add remainder amount in last instalment.
                if (i == tenure - 1) {
                    getRepaymentScheduleModelDto.principal_amount += createRepaymentScheduleDto.loan_amount % tenure;
                }

                const repayment_schedule_model = this.getRepaymentScheduleModel(getRepaymentScheduleModelDto);
                console.log("repayment_schedule_model :: ", repayment_schedule_model);

                const savedRecord = await this.repaymentScheduleRepository.save(repayment_schedule_model);

                this.log.debug("Record saved =" + JSON.stringify(savedRecord));

                //create ZohoRepayment Payment
                const zohoReschRecord = this.zohoRepaymentScheduleHelper.getRepaymentScheduleObject(savedRecord);
                zohoRepaymentScheduleArray.push(zohoReschRecord);
                this.log.debug("Record saved =" + JSON.stringify(savedRecord));
            }

            this.log.log("Creating ZOho Schedule =" + JSON.stringify(zohoRepaymentScheduleArray));

            await this.zohoRepaymentScheduleHelper.createZohoRepaymentSchedule(zohoRepaymentScheduleArray);


            return 'Done';
        }
        catch (error) {
            this.log.error("Error in Repayment Schedule Creation" + JSON.stringify(error));
        }
    }

    getRepaymentScheduleModel(getRepaymentScheduleModelDto: GetRepaymentScheduleModelDto): RepaymentScheduleModel {
        const model = new RepaymentScheduleModel();
        const now = new Date();
        const schedule_status = (getRepaymentScheduleModelDto.instalment_number == 1) ? 'SCHEDULED' : 'NOT_SCHEDULED'

        model.id = 'RS' + Math.floor(Math.random() * 100000000);
        model.loan_id = getRepaymentScheduleModelDto.loan_id;
        model.client_id = getRepaymentScheduleModelDto.client_id;
        model.instalment_number = getRepaymentScheduleModelDto.instalment_number;
        model.zoho_loan_id = getRepaymentScheduleModelDto.zoho_loan_id;

        model.ins_principal_amount = Number(getRepaymentScheduleModelDto.principal_amount.toFixed(2));
        model.ins_membership_fee = this.globalService.INSTALMENT_MEMBERSHIP_FEE;
        model.ins_overdue_amount = Number((model.ins_principal_amount + model.ins_membership_fee).toFixed(2));
        model.ins_additional_fee = Number(0);
        model.total_paid_amount = Number(0);

        model.repayment_status = this.globalService.INSTALMENT_PAYMENT_STATUS['NOT_PAID'];
        model.scheduling_status = this.globalService.INSTALMENT_SCHEDULING_STATUS[schedule_status];
        model.grace_period = this.globalService.INSTALMENT_GRACE_PERIOD_DAYS;
        model.number_of_penalties = 0;
        model.ins_from_date = addMonths(now, getRepaymentScheduleModelDto.instalment_number - 1);
        model.ins_to_date = addMonths(now, getRepaymentScheduleModelDto.instalment_number);
        model.due_date = addMonths(now, getRepaymentScheduleModelDto.instalment_number);
        return model;
    }

}
