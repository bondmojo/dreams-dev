import { CreateRepaymentScheduleDto, UpdateRepaymentDateDto } from './dto';
import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { CustomLogger } from "../../custom_logger";
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
import { RepaymentScheduleService } from './usecases/repayment_schedule.service';
import { MethodParamsRespLogger } from 'src/decorator';
import { GlobalService } from 'src/globals/usecases/global.service';
import { GetInstalmentDto } from './dto';
import { UpdateRepaymentDateUsecase } from './usecases/update-repayment-date.usecase.service';
@Controller('repaymentSchedule')
export class RepaymentScheduleController {
  private readonly logger = new CustomLogger(RepaymentScheduleController.name);
  constructor(
    private readonly createRepaymentScheduleUsecase: CreateRepaymentScheduleUsecase,
    private readonly repaymentScheduleService: RepaymentScheduleService,
    private readonly globalService: GlobalService,
    private readonly updateRepaymentDateUsecase: UpdateRepaymentDateUsecase,
  ) {
  }
  @Post()
  @MethodParamsRespLogger(new CustomLogger(RepaymentScheduleController.name))
  async create(@Body() createRepaymentScheduleDto: CreateRepaymentScheduleDto) {
    return await this.createRepaymentScheduleUsecase.create(createRepaymentScheduleDto);
  }

  @Get('/:loan_id/paymentPlanMsg')
  @MethodParamsRespLogger(new CustomLogger(RepaymentScheduleController.name))
  async getPaymentPlanMsg(@Param('loan_id') loan_id: string) {
    return await this.repaymentScheduleService.getPaymentPlanMsg(loan_id);
  }

  @Post('get/instalment')
  @MethodParamsRespLogger(new CustomLogger(RepaymentScheduleController.name))
  async getInstalment(@Body() getInstalmentDto: GetInstalmentDto) {
    return await this.repaymentScheduleService.getInstalment(getInstalmentDto);
  }

  @Post('updateRepaymentDate')
  async updateRepaymentDate(@Body() updateRepaymentDateDto: UpdateRepaymentDateDto) {
    return await this.updateRepaymentDateUsecase.updateRepaymentDate(updateRepaymentDateDto);
  }
}
