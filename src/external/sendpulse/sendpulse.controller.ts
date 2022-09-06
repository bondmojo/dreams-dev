import {Body, Controller, Post} from '@nestjs/common';
import {SendpluseService} from './sendpluse.service';
import {SendMessageRequestDto} from './dto/send-message-request.dto';
import {CustomLogger} from "../../custom_logger";
import {DreamerModel} from '../../dreamer/usecases/model/dreamer.model';
import {SendApprovalMessageRequestDto} from './dto/send-approval-message-request.dto';
import {CalculationDto} from './dto/calculation.dto';
import {CalculationResultDto} from "./dto/calculation-result.dto";
import {SendpulseHelperService} from "./sendpulse-helper.service";
import {CalculateLoanDto} from "./dto/calculate-loan.dto";


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

  @Post('/sendApprovalMessage')
  async sendApprovalMessage(@Body() messageObj: SendApprovalMessageRequestDto ) {
    this.log.log(JSON.stringify(messageObj));

    let model = new DreamerModel();
    model.externalId=messageObj.contact_id;

    //TODO: Language Support
    let approval_message = "Your loan has been rejected";
    if(messageObj.approved === "Approved"){
      this.log.log(JSON.stringify("received loan is approved"));
      approval_message ="Your loan request for $" +  messageObj.loan_amount + "has been approved";
    }
    model.external_data = {"message": approval_message};

    await this.sendpulseService.runFlow(model, this.SENDPULSE_MESSAGING_FLOWID) ;
    return {"status": 'ok'}
  }


}
