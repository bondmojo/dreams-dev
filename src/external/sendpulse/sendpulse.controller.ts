import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import { SendpluseService } from './sendpluse.service';
import { SendMessageRequestDto } from './dto/send-message-request.dto';
import { RunFlowRequestDto } from './dto/run-flow-request.dto';
import {CustomLogger} from "../../custom_logger";
import { DreamerModel } from '../../dreamer/usecases/model/dreamer.model';
import { SendApprovalMessageRequestDto } from './dto/send-approval-message-request.dto';
import { SetVariableRequestDto } from './dto/set-variable-request.dto';
import { CalculateLoanDto } from './dto/calculate-loan.dto';
import { CalculationDto } from './dto/calculation.dto';
import { SendpulseHelperService } from './sendpulse-helper.service';
import { CalculationResultDto } from './dto/calculation-result.dto';

@Controller('sendpulse')
export class SendpulseController {

  private readonly log = new CustomLogger(SendpluseService.name);
  private readonly SENDPULSE_MESSAGING_FLOWID="62fc9cd35c6b0b21d713cdea";

  constructor(
    private readonly sendpulseService: SendpluseService,    
    private readonly sendpulseHelperServie: SendpulseHelperService

   ) {}

   @Post('/calculator')
   calculator(@Body() calculationDto: CalculationDto): CalculationResultDto {
     this.log.log(`Received request to calculate ${JSON.stringify(calculationDto)}`);
     return this.sendpulseHelperServie.calculate(calculationDto);
   }
 
   @Post('/calculator/loan')
   loanCalculator(@Body() calculateLoanDto: CalculateLoanDto): CalculationResultDto {
     this.log.log(`Received request to calculate loan ${JSON.stringify(calculateLoanDto)}`);
     return this.sendpulseHelperServie.calculateLoan(calculateLoanDto);
   }

  @Post('/sendMessage')
  async sendMessage(@Body() messageObj: SendMessageRequestDto ) {
    this.log.log(JSON.stringify(messageObj));

    let model = new DreamerModel();
    model.externalId=messageObj.contact_id;
    //runFlowObj.flow_id=this.SENDPULSE_MESSAGING_FLOWID;
    model.external_data = {"message": messageObj.message};
    await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID) ;
    return {"status": 'ok'}
  }

  @Post('/updateApplicationStatus')
  async updateApplicationStatus(@Body() reqData: SendApprovalMessageRequestDto ) {
    this.log.log(JSON.stringify(reqData));

    let appStatusDto = new SetVariableRequestDto();
    appStatusDto.contact_id=reqData.sendpulse_user_id;
    appStatusDto.variable_name="application_status";
    appStatusDto.variable_id="6319a9390219f75deb1c07d3";
    appStatusDto.variable_value= reqData.application_status;
    await this.sendpulseService.setVariable(appStatusDto);

    let amountDto = new SetVariableRequestDto();
    amountDto.contact_id=reqData.sendpulse_user_id;
    amountDto.variable_name="approved_rejected_amount";
    amountDto.variable_id="6319aa4720f4c45a1b390826";
    amountDto.variable_value= ""+ reqData.loan_amount;
    await this.sendpulseService.setVariable(amountDto);

    let model = new DreamerModel();
    model.externalId=reqData.sendpulse_user_id;
    model.external_data = {};

    await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID) ;
    return {"status": 'ok'}
  }

  @Post('/sendApprovalMessage')
  async sendApprovalMessage(@Body() reqData: SendApprovalMessageRequestDto ) {
    this.log.log(JSON.stringify(reqData));

    let appStatusDto = new SetVariableRequestDto();
    appStatusDto.contact_id=reqData.sendpulse_user_id;
    appStatusDto.variable_name="application_status";
    appStatusDto.variable_id="6319a9390219f75deb1c07d3";
    appStatusDto.variable_value= reqData.application_status;
    await this.sendpulseService.setVariable(appStatusDto);

    let amountDto = new SetVariableRequestDto();
    amountDto.contact_id=reqData.sendpulse_user_id;
    amountDto.variable_name="approved_rejected_amount";
    amountDto.variable_id="6319aa4720f4c45a1b390826";
    amountDto.variable_value= ""+ reqData.loan_amount;
    await this.sendpulseService.setVariable(amountDto);

    let model = new DreamerModel();
    model.externalId=reqData.sendpulse_user_id;

    //TODO: Language Support
    let approval_message = "There have been some issue with loan request. We will contact you soon.";
    model.external_data = {"message": approval_message};

    await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID) ;
    return {"status": 'ok'}
  }


}
