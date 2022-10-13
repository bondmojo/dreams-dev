import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
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
    model.external_data = {};
    return await this.sendpulseService.runFlow(model, runFlowDto.flow_id);
  }

  @Post('/updateApplicationStatus')
  async updateApplicationStatus(@Body() reqData: UpdateApplicationStatusRequestDto) {
    this.log.log(JSON.stringify(reqData));

    let flowId;
    const applStatus = reqData.application_status;

    switch (applStatus) {
      case this.APPLICATION_STATUS[0]:
        flowId = this.SENDPULSE_APPSTATUS_FLOWIDs.Approved;
        break;
      case this.APPLICATION_STATUS[1]:
        flowId = this.SENDPULSE_APPSTATUS_FLOWIDs['Not Qualified'];
        break;
      case this.APPLICATION_STATUS[2]:
        const transfertypeDto = new SetVariableRequestDto();
        transfertypeDto.contact_id = reqData.sendpulse_user_id;
        transfertypeDto.variable_name = "activeLoanId";
        transfertypeDto.variable_id = "632ae8966a397f4a4c32c516";
        transfertypeDto.variable_value = "" + reqData.loan_id;
        await this.sendpulseService.setVariable(transfertypeDto);

        flowId = this.SENDPULSE_APPSTATUS_FLOWIDs.Disbursed;
        break;
    }
    if (flowId) {
      const model = new DreamerModel();
      model.externalId = reqData.sendpulse_user_id;
      model.external_data = {};

      this.log.log("Running " + applStatus + "Flow. FlowId =" + flowId);
      return await this.sendpulseService.runFlow(model, flowId);
    }

    return HttpStatus.NOT_FOUND;

  }
}
