import { Body, Controller, Param, Post } from '@nestjs/common';
import { CustomLogger } from "../custom_logger";
import { CreateLoanApplicationUsecase } from './usecases/create-loan-application.usecase';
import { CreateZohoLoanApplicationDto } from './usecases/dto/create-loan-appl.dto';
import { UpdatePaymentDetailsUsecase } from "./usecases/update-payment-details.usecase";
import { PaymentDetailsRequestDto } from "./dto/payment-details-request.dto";

//FIXME: This file can be deleted in future. Kept it to create zoho loan using restAPI

@Controller('dreamers/loanapplication')
export class DreamerLoanApplController {
  private readonly logger = new CustomLogger(DreamerLoanApplController.name);
  constructor(
    private readonly createLoanApplUsecase: CreateLoanApplicationUsecase,
    private readonly updatePaymentDetailsUsecase: UpdatePaymentDetailsUsecase,
  ) { }


  @Post()
  async create(@Body() loanDto: CreateZohoLoanApplicationDto) {
    this.logger.log(`Creating Loan for dreamer ${JSON.stringify(loanDto)}`);
    return await this.createLoanApplUsecase.create(loanDto);
  }

  @Post(':loanId/payment_details')
  async updatePaymentDetails(
    @Param() params: any,
    @Body() request: PaymentDetailsRequestDto,
  ) {
    this.logger.log(`Updating payment details for request ${JSON.stringify(request)}`);
    const updatedUserId = await this.updatePaymentDetailsUsecase.update(params.loanId, request, "Loans");
    return {
      id: updatedUserId,
    };
  }

}
