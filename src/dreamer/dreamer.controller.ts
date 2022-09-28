import {CreateDreamerDto} from './dto/create-dreamer.dto';
import {Body, Controller, Param, Post} from '@nestjs/common';
import {AdditionalDetailsRequestDto} from "./dto/additional-details-request.dto";
import {CreateDreamerUsecase} from "./usecases/create-dreamer.usecase";
import {PaymentDetailsRequestDto} from "./dto/payment-details-request.dto";
import {UpdatePaymentDetailsUsecase} from "./usecases/update-payment-details.usecase";
import {UpdateAdditionalDetailsUsecase} from "./usecases/update-additional-details.usecase";
import {InitiateKycUsecase} from "./usecases/initiate-kyc.usecase";
import {CustomLogger} from "../custom_logger";
import { CreateTaskUsecase } from './usecases/create-task.usecase';

@Controller('dreamers')
export class DreamerController {
  private readonly logger = new CustomLogger(DreamerController.name);
  constructor(
    private readonly createDreamerUsecase: CreateDreamerUsecase,
    private readonly createTaskUsecase: CreateTaskUsecase,  
      private readonly updatePaymentDetailsUsecase: UpdatePaymentDetailsUsecase,
      private readonly updateAdditionalDetailsUsecase: UpdateAdditionalDetailsUsecase,
      private readonly initateKycUsecase: InitiateKycUsecase
  ) {}

  @Post()
  async createDreamer(@Body() createDreamerRequestDto: CreateDreamerDto) {
    this.logger.log(`Creating dreamers with request ${JSON.stringify(createDreamerRequestDto)}`);
    return await this.createDreamerUsecase.create(createDreamerRequestDto);
  }

  @Post('task')
  async createTask(@Body() body:any) {
    this.logger.log(`Creating task with request `);
    return await this.createTaskUsecase.create();
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
