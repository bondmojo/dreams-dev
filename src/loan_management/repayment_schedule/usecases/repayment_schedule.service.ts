import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { Repository, FindOptionsWhere } from 'typeorm';
import { UpdateRepaymentScheduleDto } from '../dto';
@Injectable()
export class RepaymentScheduleService {
    private readonly log = new CustomLogger(RepaymentScheduleService.name);
    constructor(
        @InjectRepository(RepaymentSchedule)
        private readonly repaymentScheduleRepository: Repository<RepaymentSchedule>,

    ) { }
    async findOne(fields: object): Promise<any> {
        const loan = await this.repaymentScheduleRepository.findOne({
            where: fields,
            order: { ['created_at']: 'DESC' }
        });
        return loan;
    }

    async update(updateRepaymentScheduleDto: UpdateRepaymentScheduleDto) {
        this.log.log(`Updating Repayment Schedule with data ${JSON.stringify(updateRepaymentScheduleDto)}`);
        await this.repaymentScheduleRepository.update(updateRepaymentScheduleDto.id, updateRepaymentScheduleDto);
    }

    async find(fields: FindOptionsWhere<RepaymentSchedule>, relations: Array<string>): Promise<any> {
        const installments = await this.repaymentScheduleRepository.find({
            where: fields,
            relations: relations,
        });
        return installments;
    }

}
