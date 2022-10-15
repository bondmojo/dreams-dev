import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { SendpluseService } from './sendpluse.service';
import { RunFlowRequestDto } from './dto/run-flow-request.dto';
import { CustomLogger } from "../../custom_logger";
import { DreamerModel } from '../../dreamer/usecases/model/dreamer.model';
import { UpdateApplicationStatusRequestDto } from './dto/update-application-status-request.dto';
import { SetVariableRequestDto } from './dto/set-variable-request.dto';
import { CalculateLoanDto } from './dto/calculate-loan.dto';
import { CalculationDto } from './dto/calculation.dto';
import { SendpulseHelperService } from './sendpulse-helper.service';
import { CalculationResultDto } from './dto/calculation-result.dto';
import { RunFlowModel } from './model/run-flow-model';

@Controller('sendpulse')
export class SendpulseController {

  private readonly log = new CustomLogger(SendpulseController.name);
  private readonly SENDPULSE_APPSTATUS_FLOWIDs = {
    "Disbursed": "62fc9cd35c6b0b21d713cdea", "Approved": "6343f1b75eba5c54cb644455", "Not Qualified": "6343f27a0674f62c693537b5"
  };
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

  @Post('/runFlowV1')
  async runFlowV1(@Body() runFlowDto: RunFlowModel) {
    this.log.log(JSON.stringify(runFlowDto));

    let model = new DreamerModel();
    model.externalId = runFlowDto.contact_id;
    model.external_data = runFlowDto.external_data;
    return await this.sendpulseService.runFlow(model, runFlowDto.flow_id);
  }

  @Post('/updateApplicationStatus')
  async updateApplicationStatus(@Body() reqData: UpdateApplicationStatusRequestDto) {
    this.log.log(JSON.stringify(reqData));

    return this.sendpulseService.updateApplicationStatus(reqData);
  }
}
