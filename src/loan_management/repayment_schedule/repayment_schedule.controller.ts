import { CreateRepaymentScheduleDto, GetRepaymentScheduleDto } from './dto';
import { Body, Controller, Post, } from '@nestjs/common';
import { CustomLogger } from "../../custom_logger";
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
import { RepaymentScheduleService } from './usecases/repayment_schedule.service';
import { MethodParamsRespLogger } from 'src/decorator';
import { GlobalService } from 'src/globals/usecases/global.service';
import { GetInstalmentDto } from './dto';

@Controller('repayment_schedule')
export class RepaymentScheduleController {
  private readonly logger = new CustomLogger(RepaymentScheduleController.name);
  constructor(
    private readonly createRepaymentScheduleUsecase: CreateRepaymentScheduleUsecase,
    private readonly repaymentScheduleService: RepaymentScheduleService,
    private readonly globalService: GlobalService,
  ) {
  }
  @Post()
  @MethodParamsRespLogger(new CustomLogger(RepaymentScheduleController.name))
  async create(@Body() createRepaymentScheduleDto: CreateRepaymentScheduleDto) {
    return await this.createRepaymentScheduleUsecase.create(createRepaymentScheduleDto);
  }

  @Post('get/instalment')
  @MethodParamsRespLogger(new CustomLogger(RepaymentScheduleController.name))
  async getInstalment(@Body() getInstalmentDto: GetInstalmentDto) {
    return await this.repaymentScheduleService.getInstalment(getInstalmentDto);
  }
}
