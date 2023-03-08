
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from '../client/client.module';

import { DreamerModule } from 'src/external/zoho/dreams/dreamer.module';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { GlobalModule } from "../../globals/global.module";
import { TransactionModule } from "../transaction/transaction.module";
import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { PaymentReminderService } from './notification/payment-reminder.service';
import { LoanHelperService } from './usecases/loan-helper.service';
import { LoanService } from './usecases/loan.service';
import { LoanMigrationService } from './data-migration/loan-migration.service';
import { ZohoLoanHelperService } from './usecases/zoho-loan-helper.service';
import { SendpulseLoanHelperService } from './usecases/sendpulse-loan-helper.service';
import { HandleLatePaymentService } from './usecases/handle-late-payment.service';
import { UpdateRepaymentDateUsecase } from './usecases/update-repayment-date.usecase';
import { RepaymentScheduleModule } from '../repayment_schedule/repayment_schedule.module';

@Module({
  imports: [forwardRef(() => ClientModule), forwardRef(() => DreamerModule), forwardRef(() => RepaymentScheduleModule), TransactionModule,
  TypeOrmModule.forFeature([Loan]), SendpulseModule, GlobalModule,],
  controllers: [LoanController],
  providers: [
    LoanService, LoanMigrationService, LoanHelperService, HandleLatePaymentService, PaymentReminderService, ZohoLoanHelperService, SendpulseLoanHelperService, UpdateRepaymentDateUsecase],
  exports: [LoanService, LoanHelperService, PaymentReminderService, HandleLatePaymentService]
})
export class LoanModule { }
