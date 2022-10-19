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

  @Post('/calculator/loan')
  loanCalculator(@Body() calculateLoanDto: CalculateLoanDto): CalculationResultDto {
    this.log.log(`Received request to calculate loan ${JSON.stringify(calculateLoanDto)}`);
    return this.sendpulseHelperService.calculateLoan(calculateLoanDto);
  }

  @Post('/runFlowV1')
  async runFlowV1(@Body() runFlowDto: RunFlowModel) {
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
  }

  @Post('/updateApplicationStatus')
  async updateApplicationStatus(@Body() reqData: UpdateApplicationStatusRequestDto) {
    this.log.log(JSON.stringify(reqData));

    return this.sendpulseService.updateApplicationStatus(reqData);
  }
}
