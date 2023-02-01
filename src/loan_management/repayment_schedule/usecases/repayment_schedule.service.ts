import { ConsoleLogger, Injectable, HttpException, HttpStatus, NotFoundException, } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { Repository, FindOptionsWhere } from 'typeorm';
import { UpdateRepaymentScheduleDto, GetInstalmentDto } from '../dto';
import { GlobalService } from "src/globals/usecases/global.service";
import { differenceInCalendarDays } from 'date-fns'

@Injectable()
export class RepaymentScheduleService {
    private readonly log = new CustomLogger(RepaymentScheduleService.name);
    constructor(
        @InjectRepository(RepaymentSchedule)
        private readonly repaymentScheduleRepository: Repository<RepaymentSchedule>,
        private readonly globalService: GlobalService,
    ) { }

    async findOne(fields: FindOptionsWhere<RepaymentSchedule>): Promise<any> {
        const instalment = await this.repaymentScheduleRepository.findOne({
            where: fields,
            order: { ['created_at']: 'DESC' }
        });
        return instalment;
    }

    async update(updateRepaymentScheduleDto: UpdateRepaymentScheduleDto) {
        this.log.log(`Updating Repayment Schedule with data ${JSON.stringify(updateRepaymentScheduleDto)}`);
        await this.repaymentScheduleRepository.update(updateRepaymentScheduleDto.id, updateRepaymentScheduleDto);
    }

    async find(fields: FindOptionsWhere<RepaymentSchedule>, relations: Array<string> = []): Promise<any> {
        console
        const installments = await this.repaymentScheduleRepository.find({
            where: fields,
            relations: relations,
        });
        return installments;
    }

    async getInstalment(getInstalmentDto: GetInstalmentDto): Promise<any> {
        try {
            const today = new Date();
            const [instalment] = await this.find(getInstalmentDto);

            if (!instalment) {
                throw new NotFoundException("Instalment Not Found");
            }

            // For Reminder Message: adding overdue days to installment
            let overdue_days = differenceInCalendarDays(today, new Date(instalment.due_date))
            // Set overdue_days to 0 when value is negative (when today is greater then due date)
            overdue_days = (overdue_days < 0) ? 0 : overdue_days;

            // appending other variable in instalment response
            const response = { ...instalment, overdue_days };

            return response;
        }
        catch (error) {
            this.log.error(`ERROR OCCURED WHILE RUNNING getInstalment:  ${error}`);
            throw new HttpException({
                status: HttpStatus.EXPECTATION_FAILED,
                error: `Error in get Instalment  ${error}`,
            }, HttpStatus.EXPECTATION_FAILED);
        }
    }
}
