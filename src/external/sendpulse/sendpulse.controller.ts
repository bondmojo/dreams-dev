import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import { SendpluseService } from './sendpluse.service';
import { SendMessageRequestDto } from './dto/send-message-request.dto';
import { RunFlowRequestDto } from './dto/run-flow-request.dto';
import {CustomLogger} from "../../custom_logger";
import { DreamerModel } from 'src/dreamer/usecases/model/dreamer.model';


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
}
