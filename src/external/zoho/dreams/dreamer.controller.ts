import { Body, Controller, Param, Post } from '@nestjs/common';
import { CustomLogger } from "../../../custom_logger";
import { AdditionalDetailsRequestDto } from "./dreamer/dto/additional-details-request.dto";
import { CreateDreamerDto } from './dreamer/dto/create-dreamer.dto';
import { PaymentDetailsRequestDto } from "./dreamer/dto/payment-details-request.dto";
import { CreateDreamerUsecase } from "./dreamer/usecases/create-dreamer.usecase";
import { InitiateKycUsecase } from "./dreamer/usecases/initiate-kyc.usecase";
import { UpdateAdditionalDetailsUsecase } from "./dreamer/usecases/update-additional-details.usecase";
import { UpdatePaymentDetailsUsecase } from "./dreamer/usecases/update-payment-details.usecase";
import { ZohoHelperService } from './utility/zoho-helper.service';
import { Status } from './utility/status.dto';

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
  async createDreamer(@Body() createDreamerRequestDto: CreateDreamerDto) {
    this.logger.log(`Creating dreamers with request ${JSON.stringify(createDreamerRequestDto)}`);
    return await this.createDreamerUsecase.create(createDreamerRequestDto);
  }

  @Post(':dreamerId/additional_details')
  async updateAdditionalDetails(
    @Param() params: any,
    @Body() request: AdditionalDetailsRequestDto,
  ) {
    this.logger.log(`Updating additional details for request ${JSON.stringify(request)}`);
    const updatedUserId = await this.updateAdditionalDetailsUsecase.update(params.dreamerId, request);
    return {
      id: updatedUserId,
    };
  }

  @Post(':dreamerId/payment_details')
  async updatePaymentDetails(
    @Param() params: any,
    @Body() request: PaymentDetailsRequestDto,
  ) {
    this.logger.log(`Updating payment details for request ${JSON.stringify(request)}`);
    //FIXME: Update Module name from GlobalService
    const updatedUserId = await this.updatePaymentDetailsUsecase.update(params.dreamerId, request);
    return {
      id: updatedUserId,
    };
  }

  @Post(':dreamerId/kyc')
  async initiateKyc(@Param() params: any) {
    this.logger.log(`Generating KYC for dreamer ${params.dreamerId}`);
    return await this.initateKycUsecase.initiate(params.dreamerId);
  }
}
