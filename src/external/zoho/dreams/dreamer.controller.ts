import { CreateDreamerDto } from './dreamer/dto/create-dreamer.dto';
import { Body, Controller, Param, Post } from '@nestjs/common';
import { AdditionalDetailsRequestDto } from "./dreamer/dto/additional-details-request.dto";
import { CreateDreamerUsecase } from "./dreamer/usecases/create-dreamer.usecase";
import { PaymentDetailsRequestDto } from "./dreamer/dto/payment-details-request.dto";
import { UpdatePaymentDetailsUsecase } from "./dreamer/usecases/update-payment-details.usecase";
import { UpdateAdditionalDetailsUsecase } from "./dreamer/usecases/update-additional-details.usecase";
import { InitiateKycUsecase } from "./dreamer/usecases/initiate-kyc.usecase";
import { CustomLogger } from "../../../custom_logger";
import { ZohoTaskRequest } from 'src/external/zoho/dreams/task/zoho-task-request.dto';
import { CreateZohoTaskUsecase } from './task/create-zoho-task.usecase';
import { CreateLoanApplicationUsecase } from './zoho-loans/usecases/create-loan-application.usecase';
import { CreateZohoLoanApplicationDto } from './zoho-loans/dto/create-loan-appl.dto';
import { DreamerModel } from './dreamer/usecases/model/dreamer.model';
import { MethodParamsRespLogger } from 'src/decorator';
@Controller('dreamers')
export class DreamerController {
  private readonly logger = new CustomLogger(DreamerController.name);
  constructor(
    private readonly createDreamerUsecase: CreateDreamerUsecase,
    private readonly updatePaymentDetailsUsecase: UpdatePaymentDetailsUsecase,
    private readonly updateAdditionalDetailsUsecase: UpdateAdditionalDetailsUsecase,
    private readonly initateKycUsecase: InitiateKycUsecase,
  ) { }

  @Post()
  @MethodParamsRespLogger(new CustomLogger(DreamerController.name))
  async createDreamer(@Body() createDreamerRequestDto: CreateDreamerDto) {
    return await this.createDreamerUsecase.create(createDreamerRequestDto);
  }

  @Post(':dreamerId/additional_details')
  @MethodParamsRespLogger(new CustomLogger(DreamerController.name))
  async updateAdditionalDetails(
    @Param() params: any,
    @Body() request: AdditionalDetailsRequestDto,
  ) {
    const updatedUserId = await this.updateAdditionalDetailsUsecase.update(params.dreamerId, request);
    return {
      id: updatedUserId,
    };
  }

  @Post(':dreamerId/payment_details')
  @MethodParamsRespLogger(new CustomLogger(DreamerController.name))
  async updatePaymentDetails(
    @Param() params: any,
    @Body() request: PaymentDetailsRequestDto,
  ) {
    //FIXME: Update Module name from GlobalService
    const updatedUserId = await this.updatePaymentDetailsUsecase.update(params.dreamerId, request);
    return {
      id: updatedUserId,
    };
  }

  @Post(':dreamerId/kyc')
  @MethodParamsRespLogger(new CustomLogger(DreamerController.name))
  async initiateKyc(@Param() params: any) {
    return await this.initateKycUsecase.initiate(params.dreamerId);
  }

  @Post(':dreamerId/update_status')
  async update_status(@Param() params: any) {
    //TODO
  }

}
