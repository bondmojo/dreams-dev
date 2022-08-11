import {CreateDreamerDto} from './dto/create-dreamer.dto';
import {Body, Controller, Param, Post} from '@nestjs/common';
import {AdditionalDetailsRequestDto} from "./dto/additional-details-request.dto";
import {CreateDreamerUsecase} from "./usecases/create-dreamer.usecase";
import {PaymentDetailsRequestDto} from "./dto/payment-details-request.dto";
import {UpdatePaymentDetailsUsecase} from "./usecases/update-payment-details.usecase";

@Controller('dreamers')
export class DreamerController {
  constructor(
      private readonly createDreamerUsecase: CreateDreamerUsecase,
      private readonly updatePaymentDetailsUsecase: UpdatePaymentDetailsUsecase
  ) {}

  @Post()
  async createDreamer(@Body() createDreamerRequestDto: CreateDreamerDto) {
    return await this.createDreamerUsecase.create(createDreamerRequestDto);
  }

  @Post(':dreamerId/additional_details')
  updateAdditionalDetails(
    @Param() params: any,
    @Body() request: AdditionalDetailsRequestDto,
  ) {
    return params.dreamerId;
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
}
