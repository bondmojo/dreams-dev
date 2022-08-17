import {CreateDreamerDto} from './dto/create-dreamer.dto';
import {Body, Controller, Param, Post} from '@nestjs/common';
import {AdditionalDetailsRequestDto} from "./dto/additional-details-request.dto";
import {CreateDreamerUsecase} from "./usecases/create-dreamer.usecase";
import {PaymentDetailsRequestDto} from "./dto/payment-details-request.dto";
import {UpdatePaymentDetailsUsecase} from "./usecases/update-payment-details.usecase";
import {UpdateAdditionalDetailsUsecase} from "./usecases/update-additional-details.usecase";
import {InitiateKycUsecase} from "./usecases/initiate-kyc.usecase";

@Controller('dreamers')
export class DreamerController {
  constructor(
      private readonly createDreamerUsecase: CreateDreamerUsecase,
      private readonly updatePaymentDetailsUsecase: UpdatePaymentDetailsUsecase,
      private readonly updateAdditionalDetailsUsecase: UpdateAdditionalDetailsUsecase,
      private readonly initateKycUsecase: InitiateKycUsecase
  ) {}

  @Post()
  async createDreamer(@Body() createDreamerRequestDto: CreateDreamerDto) {
    return await this.createDreamerUsecase.create(createDreamerRequestDto);
  }

  @Post(':dreamerId/additional_details')
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
  async updatePaymentDetails(
      @Param() params: any,
      @Body() request: PaymentDetailsRequestDto,
  ) {
      const updatedUserId = await this.updatePaymentDetailsUsecase.update(params.dreamerId, request);
    return {
        id: updatedUserId,
    };
  }

  @Post(':dreamerId/kyc')
  async initiateKyc(@Param() params: any) {
    return await this.initateKycUsecase.initiate(params.dreamerId);
  }
}
