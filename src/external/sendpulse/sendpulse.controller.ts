import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { MethodParamsRespLogger } from 'src/decorator';
import { CustomLogger } from "../../custom_logger";
import { GlobalService } from "../../globals/usecases/global.service";
import { DreamerModel } from '../zoho/dreams/dreamer/usecases/model/dreamer.model';
import { CalculateLoanDto } from './dto/calculate-loan.dto';
import CalculateRepaymentScheduleDto from './dto/calculate-repayment-schedule.dto';
import { CalculationResultDto } from './dto/calculation-result.dto';
import { CalculationDto } from './dto/calculation.dto';
import RepaymentScheduleDto from './dto/repayment-schedule.dto';
import { SendPulseContactDto } from './dto/send-pulse-contact.dto';
import { UpdateApplicationStatusRequestDto } from './dto/update-application-status-request.dto';
import { RunFlowModel } from './model/run-flow-model';
import { SendpluseService } from './sendpluse.service';
import { SendpulseHelperService } from './sendpulse-helper.service';

@Controller('sendpulse')
export class SendpulseController {

  private readonly log = new CustomLogger(SendpulseController.name);

  constructor(
    private readonly sendpulseService: SendpluseService,
    private readonly sendpulseHelperService: SendpulseHelperService,
    private readonly globalService: GlobalService
  ) { }

  @Post('/calculator')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  calculator(@Body() calculationDto: CalculationDto): CalculationResultDto {
    return this.sendpulseHelperService.calculate(calculationDto);
  }

  @Get('/convertToRomanNumber/:id')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  convertToRomanNumber(@Param('id') id: string) {
    return { number: this.sendpulseHelperService.convertToRomanNumber(id) };
  }

  @Get('/convertToKhmerNumber/:id')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  convertToKhmerNumber(@Param('id') id: string) {
    return { number: this.sendpulseHelperService.convertToKhmerNumber(id) };
  }

  @Post('/calculator/loan')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  loanCalculator(@Body() calculateLoanDto: CalculateLoanDto): CalculationResultDto {
    return this.sendpulseHelperService.calculateLoan(calculateLoanDto);
  }

  @Post('/runFlowV1')
  async runFlowV1(@Body() runFlowDto: RunFlowModel) {
    try {
      //FIXME: merge Runflow and RunflowV2 methods in sendpulse service. Also mer RunflowModel and DreamerModel.
      this.log.log(JSON.stringify(runFlowDto));

      let model = new DreamerModel();
      let flow_id;
      model.externalId = runFlowDto.contact_id;
      model.external_data = runFlowDto.external_data;

      if (runFlowDto.flow_name) {
        flow_id = this.globalService.SENDPULSE_FLOW[runFlowDto.flow_name];
      }
      else if (runFlowDto.flow_id) {
        flow_id = runFlowDto.flow_id;
      }

      this.log.log("Running Sendpulse Flow " + runFlowDto.flow_id + " flow_id =" + flow_id);
      return await this.sendpulseService.runFlow(model, flow_id);
    } catch (error) {
      this.log.error(`SENDPUSLE CONTROLLER: ERROR OCCURED WHILE RUNNING runFlowV1:  ${error}`);
    }
  }

  @Post('/updateApplicationStatus')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  async updateApplicationStatus(@Body() reqData: UpdateApplicationStatusRequestDto) {
    return this.sendpulseService.updateApplicationStatus(reqData);
  }

  @Get('/getContact/:id')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  async getContact(@Param('id') id: string) {
    const data: SendPulseContactDto = await this.sendpulseService.getContact(id);
    this.log.log(JSON.stringify(data as SendPulseContactDto));

    return data;
  }


  @Post('/calculator/repaymentSchedule')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  async calculateRepaymentSchedule(@Body() calculateRepaymentScheduleDto: CalculateRepaymentScheduleDto) {
    return await this.sendpulseHelperService.caclulateRepaymentSchedule(calculateRepaymentScheduleDto);
  }

  @Post('/getRepaymentScheduleMessage')
  @MethodParamsRespLogger(new CustomLogger(SendpulseController.name))
  async getRepaymentScheduleMessage(@Headers('language') ln: string, @Body() @Body() calculateRepaymentScheduleDto: CalculateRepaymentScheduleDto) {

    if (ln != "en" && ln != "kh") {
      ln = "en";
    }
    const repaymentScheduleDto: RepaymentScheduleDto[] = this.sendpulseHelperService.caclulateRepaymentSchedule(calculateRepaymentScheduleDto);
    return this.sendpulseHelperService.getRepaymentScheduleMessage(ln, repaymentScheduleDto);
  }

}
