import { CreateRepaymentScheduleDto, GetRepaymentScheduleDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { CustomLogger } from "../../custom_logger";
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
import { GetRepaymentScheduleUsecase } from './usecases/get-repayment-schedule.service';
@Controller('repayment_schedule')
export class RepaymentScheduleController {
  private readonly logger = new CustomLogger(RepaymentScheduleController.name);
  constructor(
    private readonly createRepaymentScheduleUsecase: CreateRepaymentScheduleUsecase,
    private readonly getRepaymentScheduleUsecase: GetRepaymentScheduleUsecase,
  ) {
  }
  @Post()
  async create(@Body() createRepaymentScheduleDto: CreateRepaymentScheduleDto) {
    this.logger.log(`Creating Repayment Schedule with request ${JSON.stringify(createRepaymentScheduleDto)}`);
    return await this.createRepaymentScheduleUsecase.create(createRepaymentScheduleDto);
  }

  @Post('/get')
  async get(@Body() getRepaymentScheduleDto: GetRepaymentScheduleDto) {
    this.logger.log(`Get Repayment Schedule Plan with request ${JSON.stringify(getRepaymentScheduleDto)}`);
    return await this.getRepaymentScheduleUsecase.get(getRepaymentScheduleDto);
  }

}
