import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { SendpluseService } from './sendpluse.service';
import { CustomLogger } from "../../custom_logger";
import { DreamerModel } from '../../dreamer/usecases/model/dreamer.model';
import { UpdateApplicationStatusRequestDto } from './dto/update-application-status-request.dto';
import { CalculateLoanDto } from './dto/calculate-loan.dto';
import { CalculationDto } from './dto/calculation.dto';
import { SendpulseHelperService } from './sendpulse-helper.service';
import { CalculationResultDto } from './dto/calculation-result.dto';
import { RunFlowModel } from './model/run-flow-model';
import { GlobalService } from "../../globals/usecases/global.service";
import { SendPulseContactDto } from './dto/send-pulse-contact.dto';


@Controller('sendpulse')
export class SendpulseController {

  private readonly log = new CustomLogger(SendpulseController.name);

  constructor(
    private readonly sendpulseService: SendpluseService,
    private readonly sendpulseHelperService: SendpulseHelperService,
    private readonly globalService: GlobalService
  ) { }

  @Post('/calculator')
  calculator(@Body() calculationDto: CalculationDto): CalculationResultDto {
    this.log.log(`Received request to calculate ${JSON.stringify(calculationDto)}`);
    return this.sendpulseHelperService.calculate(calculationDto);
  }

  @Get('/convertToRomanNumber/:id')
  convertToRomanNumber(@Param('id') id: string) {
    this.log.log(`convertToRomanNumber request data ${id}`);
    return { number: this.sendpulseHelperService.convertToRomanNumber(id) };
  }

  @Get('/convertToKhmerNumber/:id')
  convertToKhmerNumber(@Param('id') id: string) {
    this.log.log(`convertToKhmerNumber request data ${id}`);
    return { number: this.sendpulseHelperService.convertToKhmerNumber(id) };
  }

  @Post('/calculator/loan')
  loanCalculator(@Body() calculateLoanDto: CalculateLoanDto): CalculationResultDto {
    this.log.log(`Received request to calculate loan ${JSON.stringify(calculateLoanDto)}`);
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
  async updateApplicationStatus(@Body() reqData: UpdateApplicationStatusRequestDto) {
    this.log.log(JSON.stringify(reqData));

    return this.sendpulseService.updateApplicationStatus(reqData);
  }

  @Get('/getContact/:id')
  async getContact(@Param('id') id: string) {
    const data: SendPulseContactDto = await this.sendpulseService.getContact(id);
    this.log.log(JSON.stringify(data as SendPulseContactDto));

    return data;
  }

}
