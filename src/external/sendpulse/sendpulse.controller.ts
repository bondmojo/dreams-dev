import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SendpluseService } from './sendpluse.service';
import { SendMessageRequestDto } from './dto/send-message-request.dto';
import { RunFlowRequestDto } from './dto/run-flow-request.dto';
import { CustomLogger } from "../../custom_logger";
import { DreamerModel } from '../../dreamer/usecases/model/dreamer.model';
import { UpdateApplicationStatusRequestDto } from './dto/update-application-status-request.dto';
import { SetVariableRequestDto } from './dto/set-variable-request.dto';
import { CalculateLoanDto } from './dto/calculate-loan.dto';
import { CalculationDto } from './dto/calculation.dto';
import { SendpulseHelperService } from './sendpulse-helper.service';
import { CalculationResultDto } from './dto/calculation-result.dto';
import { id } from 'date-fns/locale';

@Controller('sendpulse')
export class SendpulseController {

  private readonly log = new CustomLogger(SendpluseService.name);
  private readonly SENDPULSE_MESSAGING_FLOWID = "62fc9cd35c6b0b21d713cdea";
  private readonly APPLICATION_STATUS = ["Approved", "Not Qualified", "Disbursed"]

  constructor(
    private readonly sendpulseService: SendpluseService,
    private readonly sendpulseHelperService: SendpulseHelperService

  ) { }

  @Post('/calculator')
  calculator(@Body() calculationDto: CalculationDto): CalculationResultDto {
    this.log.log(`Received request to calculate ${JSON.stringify(calculationDto)}`);
    return this.sendpulseHelperService.calculate(calculationDto);
  }

  @Post('/calculator/loan')
  loanCalculator(@Body() calculateLoanDto: CalculateLoanDto): CalculationResultDto {
    this.log.log(`Received request to calculate loan ${JSON.stringify(calculateLoanDto)}`);
    return this.sendpulseHelperService.calculateLoan(calculateLoanDto);
  }

  @Post('/sendMessage')
  async sendMessage(@Body() messageObj: SendMessageRequestDto) {
    this.log.log(JSON.stringify(messageObj));

    let model = new DreamerModel();
    model.externalId = messageObj.contact_id;
    //runFlowObj.flow_id=this.SENDPULSE_MESSAGING_FLOWID;
    model.external_data = { "message": messageObj.message };
    return await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID);
  }

  @Post('/updateApplicationStatus')
  async updateApplicationStatus(@Body() reqData: UpdateApplicationStatusRequestDto) {
    this.log.log(JSON.stringify(reqData));

    if (reqData.application_status === this.APPLICATION_STATUS[2]) {
      const transfertypeDto = new SetVariableRequestDto();
      transfertypeDto.contact_id = reqData.sendpulse_user_id;
      transfertypeDto.variable_name = "activeLoanId";
      transfertypeDto.variable_id = "632ae8966a397f4a4c32c516";
      transfertypeDto.variable_value = "" + reqData.loan_id;
      await this.sendpulseService.setVariable(transfertypeDto);
    }
    const model = new DreamerModel();
    model.externalId = reqData.sendpulse_user_id;
    model.external_data = {};
    return await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID);
  }
}
