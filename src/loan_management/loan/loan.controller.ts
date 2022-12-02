import { DisbursedLoanDto, CreateLoanDto, CreateRepaymentTransactionDto, VideoReceivedCallbackDto, HandlePaymentDueLoansDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { LoanService } from "./usecases/loan.service";
import { LoanMigrationService } from "./usecases/loan-migration.service";
import { CustomLogger } from "../../custom_logger";
import { PaymentReminderService } from "./notification/payment-reminder.service";
import { HandleLatePaymentService } from "./usecases/handle-late-payment.service";
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ClientService } from '../client/usecases/client.service';
import { GlobalService } from 'src/globals/usecases/global.service';
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
  ) { }

  @Post()
  async createLoan(@Body() createLoanDto: CreateLoanDto) {
    this.logger.log(`Creating loan with request ${JSON.stringify(createLoanDto)}`);
    const client = await this.clientService.findbyId(createLoanDto.client_id);
    createLoanDto.sendpulse_id = client.sendpulse_id;
    return await this.loanService.create(createLoanDto);
  }

  @Post('status')
  async updateLoanStatus(
    @Body() updateloanDto: UpdateLoanDto) {
    this.logger.log(`Updating loan Status. request ${JSON.stringify(updateloanDto)}`);
    return await this.loanService.updateLoanStatus(updateloanDto);
  }

  @Post('disbursed')
  async disbursed(@Body() disbursedLoanDto: DisbursedLoanDto) {
    this.logger.log(`Disbursed loan with request ${JSON.stringify(disbursedLoanDto)}`);
    return await this.loanService.disbursed(disbursedLoanDto);
  }

  @Post('repayment/transaction/create')
  async createRepaymentTransaction(@Body() createRepaymentTransactionDto: CreateRepaymentTransactionDto) {
    this.logger.log(`Creating Loan Repayment Transaction with request ${JSON.stringify(createRepaymentTransactionDto)}`);
    //  FIXME:: add for transaction type dream_point_refund
    return await this.loanService.createRepaymentTransaction(createRepaymentTransactionDto);
  }

  @Get('runCronApis/:id')
  async runCronApis(@Param('id') id: number) {
    this.logger.log('Running Cron Job Api');
    return await this.paymentReminderService.runCronApis(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log('Getting loan with request id =' + id);
    return await this.loanService.findOne({ id: id });
  }

  @Post('videoReceivedCallback')
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
  async migrateData() {
    this.logger.log(`Migrating Zoho Loan data with Database Loan Data `);
    return await this.loanMigrationService.migrateData();
  }

  @Post('runHandlePaymentDueLoansCron')
  async runHandlePaymentDueLoansCron(@Body() handlePaymentDueLoansDto: HandlePaymentDueLoansDto) {
    this.logger.log(`Marking Loan Payment Status to Payment Due  ${JSON.stringify(handlePaymentDueLoansDto)}`);
    return await this.handleLatePaymentService.runHandlePaymentDueLoansCron(handlePaymentDueLoansDto);
  }
}
