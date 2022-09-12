import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import { SendpluseService } from './sendpluse.service';
import { SendMessageRequestDto } from './dto/send-message-request.dto';
import { RunFlowRequestDto } from './dto/run-flow-request.dto';
import {CustomLogger} from "../../custom_logger";
import { DreamerModel } from '../../dreamer/usecases/model/dreamer.model';
import { SendApprovalMessageRequestDto } from './dto/send-approval-message-request.dto';
import { SetVariableRequestDto } from './dto/set-variable-request.dto';


@Controller('sendpulse')
export class SendpulseController {

  private readonly log = new CustomLogger(SendpluseService.name);
  private readonly SENDPULSE_MESSAGING_FLOWID="62fc9cd35c6b0b21d713cdea";

  constructor(
    private readonly sendpulseService: SendpluseService,
   ) {}


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
    appStatusDto.contact_id=reqData.contact_id;
    appStatusDto.variable_name="application_status";
    appStatusDto.variable_id="6319a9390219f75deb1c07d3";
    appStatusDto.variable_value= reqData.application_status;
    await this.sendpulseService.setVariable(appStatusDto);

    let amountDto = new SetVariableRequestDto();
    amountDto.contact_id=reqData.contact_id;
    amountDto.variable_name="approved_rejected_amount";
    amountDto.variable_id="6319aa4720f4c45a1b390826";
    amountDto.variable_value= ""+ reqData.loan_amount;
    await this.sendpulseService.setVariable(amountDto);

    let model = new DreamerModel();
    model.externalId=reqData.contact_id;

    //TODO: Language Support
    let approval_message = "There have been some issue with loan request. We will contact you soon.";
    model.external_data = {"message": approval_message};

    await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID) ;
    return {"status": 'ok'}
  }

  @Post('/sendApprovalMessage')
  async sendApprovalMessage(@Body() reqData: SendApprovalMessageRequestDto ) {
    this.log.log(JSON.stringify(reqData));

    let appStatusDto = new SetVariableRequestDto();
    appStatusDto.contact_id=reqData.contact_id;
    appStatusDto.variable_name="application_status";
    appStatusDto.variable_id="6319a9390219f75deb1c07d3";
    appStatusDto.variable_value= reqData.application_status;
    await this.sendpulseService.setVariable(appStatusDto);

    let amountDto = new SetVariableRequestDto();
    amountDto.contact_id=reqData.contact_id;
    amountDto.variable_name="approved_rejected_amount";
    amountDto.variable_id="6319aa4720f4c45a1b390826";
    amountDto.variable_value= ""+ reqData.loan_amount;
    await this.sendpulseService.setVariable(amountDto);

    let model = new DreamerModel();
    model.externalId=reqData.contact_id;

    //TODO: Language Support
    let approval_message = "There have been some issue with loan request. We will contact you soon.";
    model.external_data = {"message": approval_message};

    await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID) ;
    return {"status": 'ok'}
  }


}
