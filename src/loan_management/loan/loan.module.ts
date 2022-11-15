
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from '../client/client.module';

import { DreamerModule } from 'src/dreamer/dreamer.module';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { GlobalModule } from "../../globals/global.module";
import { TransactionModule } from "../transaction/transaction.module";
import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { PaymentReminderService } from './notification/payment-reminder.service';
import { LoanHelperService } from './usecases/loan-helper.service';
import { LoanService } from './usecases/loan.service';
import { ZohoLoanHelperService } from './usecases/zoho-loan-helper.service';

@Module({
  imports: [forwardRef(() => ClientModule), forwardRef(() => DreamerModule), TransactionModule, TypeOrmModule.forFeature([Loan]), SendpulseModule, GlobalModule],
  controllers: [LoanController],
  providers: [
    LoanService, LoanHelperService, PaymentReminderService, ZohoLoanHelperService],
  exports: [LoanService, LoanHelperService, PaymentReminderService]
})
export class LoanModule { }
