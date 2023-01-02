
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RepaymentController } from './repayment.controller';
import { RepaymentService } from './repayment.service';
import { LoanModule } from "../loan/loan.module";
import { RepaymentScheduleModule } from '../repayment_schedule/repayment_schedule.module';
import { TransactionModule } from "../transaction/transaction.module";
import { HandleEqualPaymentUsecase } from './usecases/handle-equal-payment.usecase';
import { HandleUnderPaymentUsecase } from './usecases/handle-under-payment.usecase';
import { HandleOverPaymentUsecase } from './usecases/handle-over-payment.usecase';
import { RepaymentHelperService } from './repayment-helper.service';
@Module({
  imports: [LoanModule, RepaymentScheduleModule, TransactionModule],
  controllers: [RepaymentController],
  providers: [
    RepaymentService, RepaymentHelperService, HandleEqualPaymentUsecase, HandleUnderPaymentUsecase, HandleOverPaymentUsecase],
  exports: [RepaymentService]
})
export class RepaymentModule { }
