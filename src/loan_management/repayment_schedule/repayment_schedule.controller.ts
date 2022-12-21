import { CreateRepaymentScheduleDto } from './dto/create-repayment-schedule.dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { CustomLogger } from "../../custom_logger";
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
@Controller('repayment_schedule')
export class RepaymentScheduleController {
  private readonly logger = new CustomLogger(RepaymentScheduleController.name);
  constructor(
    private readonly createRepaymentScheduleUsecase: CreateRepaymentScheduleUsecase
  ) {
  }
  @Post()
  async create(@Body() createRepaymentScheduleDto: CreateRepaymentScheduleDto) {
    this.logger.log(`Creating Repayment Schedule with request ${JSON.stringify(createRepaymentScheduleDto)}`);
    return await this.createRepaymentScheduleUsecase.create(createRepaymentScheduleDto);
  }

}
