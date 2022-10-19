
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../client/entities/client.entity';
import { ClientModule } from '../client/client.module'

import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { PaymentReminderService } from './notification/payment-reminder.service';
import { LoanService } from './usecases/loan.service';
import { LoanHelperService } from './usecases/loan-helper.service';
import { TransactionModule } from "../transaction/transaction.module";
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { GlobalModule } from "../../globals/global.module";


@Module({
  imports: [forwardRef(() => ClientModule), TransactionModule, TypeOrmModule.forFeature([Loan]), SendpulseModule, GlobalModule],
  controllers: [LoanController],
  providers: [
    LoanService, LoanHelperService, PaymentReminderService],
  exports: [LoanService, LoanHelperService, PaymentReminderService]
})
export class LoanModule { }
