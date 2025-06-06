import { Body, Controller, Param, Post } from '@nestjs/common';
import { CustomLogger } from "../../../custom_logger";
import { ZohoHelperService } from './utility/zoho-helper.service';
import { CreateZohoLoanApplicationDto } from './zoho-loans/dto/create-loan-appl.dto';
import { PaymentDetailsRequestDto } from "./zoho-loans/dto/payment-details-request.dto";
import { CreateLoanApplicationUsecase } from './zoho-loans/usecases/create-loan-application.usecase';
import { UpdateLoanPaymentDetailsUsecase } from './zoho-loans/usecases/update-loan-payment-details.usecase';

import { MethodParamsRespLogger } from 'src/decorator';
//FIXME: This file can be deleted in future. Kept it to create zoho loan using restAPI

@Controller('dreamers/loanapplication')
export class DreamerLoanApplController {
  private readonly logger = new CustomLogger(DreamerLoanApplController.name);
  constructor(
    private readonly createLoanApplUsecase: CreateLoanApplicationUsecase,
    private readonly updateLoanPaymentDetailsUsecase: UpdateLoanPaymentDetailsUsecase,
    private readonly zohoHelper: ZohoHelperService,
  ) { }


  @Post()
  @MethodParamsRespLogger(new CustomLogger(DreamerLoanApplController.name))
  async create(@Body() loanDto: CreateZohoLoanApplicationDto) {
    return await this.createLoanApplUsecase.create(loanDto);
  }

  @Post(':loanId/payment_details')
  @MethodParamsRespLogger(new CustomLogger(DreamerLoanApplController.name))
  async updatePaymentDetails(
    @Param() params: any,
    @Body() request: PaymentDetailsRequestDto,
  ) {
    this.logger.log(`Updating payment details for request ${JSON.stringify(request)}`);
    const updatedUserId = await this.updateLoanPaymentDetailsUsecase.update(params.loanId, request);
    return {
      id: updatedUserId,
    };
  }
}
