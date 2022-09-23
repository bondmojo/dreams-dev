
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../client/entities/client.entity';
import { ClientModule } from '../client/client.module'

import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { PaymentReminderService } from './notification/payment-reminder.service';
import { LoanService } from './usecases/loan.service';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';

@Module({
  imports: [ forwardRef(() => ClientModule), TypeOrmModule.forFeature([Loan]), SendpulseModule],
  controllers: [LoanController],
  providers: [
    LoanService, PaymentReminderService],
  exports: [LoanService, PaymentReminderService]
})
export class LoanModule { }
