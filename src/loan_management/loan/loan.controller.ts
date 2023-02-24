import { DisbursedLoanDto, CreateLoanDto, CreateRepaymentTransactionDto, VideoReceivedCallbackDto, HandlePaymentDueLoansDto, UpdateRepaymentDateDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { LoanService } from "./usecases/loan.service";
import { LoanMigrationService } from "./data-migration/loan-migration.service";
import { CustomLogger } from "../../custom_logger";
import { PaymentReminderService } from "./notification/payment-reminder.service";
import { HandleLatePaymentService } from "./usecases/handle-late-payment.service";
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ClientService } from '../client/usecases/client.service';
import { GlobalService } from 'src/globals/usecases/global.service';
import { UpdateRepaymentDateUsecase } from "./usecases/update-repayment-date.usecase";
import { MethodParamsRespLogger } from 'src/decorator';
@Controller('loan')
export class LoanController {
  private readonly logger = new CustomLogger(LoanController.name);
  constructor(
    private readonly loanService: LoanService,
    private readonly clientService: ClientService,
    private readonly paymentReminderService: PaymentReminderService,
    private readonly globalService: GlobalService,
    private readonly loanMigrationService: LoanMigrationService,
    private readonly handleLatePaymentService: HandleLatePaymentService,
    private readonly updateRepaymentDateUsecase: UpdateRepaymentDateUsecase,
  ) { }

  @Post()
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async createLoan(@Body() createLoanDto: CreateLoanDto) {
    const client = await this.clientService.findbyId(createLoanDto.client_id);
    createLoanDto.sendpulse_id = client.sendpulse_id;
    return await this.loanService.create(createLoanDto);
  }

  @Post('status')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async updateLoanStatus(
    @Body() updateloanDto: UpdateLoanDto) {
    return await this.loanService.updateLoanStatus(updateloanDto);
  }

  @Post('disbursed')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async disbursed(@Body() disbursedLoanDto: DisbursedLoanDto) {
    return await this.loanService.disbursed(disbursedLoanDto);
  }

  @Post('repayment/transaction/create')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async createRepaymentTransaction(@Body() createRepaymentTransactionDto: CreateRepaymentTransactionDto) {
    //  FIXME:: add for transaction type dream_point_refund
    return await this.loanService.createRepaymentTransaction(createRepaymentTransactionDto);
  }

  @Get('runCronApis/:id')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async runCronApis(@Param('id') id: number) {
    return await this.paymentReminderService.runCronApis(id);
  }

  @Get(':id')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async findOne(@Param('id') id: string) {
    return await this.loanService.findOne({ id: id });
  }

  @Post('videoReceivedCallback')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async videoReceivedCallback(
    @Body() videoReceivedCallbackDto: VideoReceivedCallbackDto) {
    if (!videoReceivedCallbackDto.sendpulse_id) {
      return;
    }
    const client = await this.clientService.findbySendpulseId(videoReceivedCallbackDto.sendpulse_id);
    if (!client) {
      return;
    }
    videoReceivedCallbackDto.client_id = client.id;

    this.logger.log(`Handle Video Received Callback: request payload = ${JSON.stringify(videoReceivedCallbackDto)}`);
    return await this.loanService.videoReceivedCallback(videoReceivedCallbackDto);
  }

  @Post('migrateData')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async migrateData() {
    return await this.loanMigrationService.migrateData();
  }

  @Post('runHandlePaymentDueLoansCron')
  @MethodParamsRespLogger(new CustomLogger(LoanController.name))
  async runHandlePaymentDueLoansCron(@Body() handlePaymentDueLoansDto: HandlePaymentDueLoansDto) {
    return await this.handleLatePaymentService.runHandlePaymentDueLoansCron(handlePaymentDueLoansDto);
  }


  @Post('updateRepaymentDate')
  async updateRepaymentDate(@Body() updateRepaymentDateDto: UpdateRepaymentDateDto) {
    return await this.updateRepaymentDateUsecase.updateRepaymentDate(updateRepaymentDateDto);
  }
}
