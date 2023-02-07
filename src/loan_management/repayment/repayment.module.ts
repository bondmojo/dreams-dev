
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RepaymentController } from './repayment.controller';
import { RepaymentService } from './services/repayment.service';
import { LoanModule } from "../loan/loan.module";
import { RepaymentScheduleModule } from '../repayment_schedule/repayment_schedule.module';
import { TransactionModule } from "../transaction/transaction.module";
import { HandleEqualRepaymentUsecase } from './usecases/handle-equal-repayment.usecase';
import { HandleUnderRepaymentUsecase } from './usecases/handle-under-repayment.usecase';
import { HandleOverRepaymentUsecase } from './usecases/handle-over-repayment.usecase';
import { ZohoRepaymentHelperService } from './services/zoho-repayment-helper.service';
import { DreamerModule } from 'src/external/zoho/dreams/dreamer.module';
import { GetHandleRepaymentFactory } from './factory/get-handle-repayment.factory';
import { ClientModule } from '../client/client.module';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
@Module({
  imports: [LoanModule, RepaymentScheduleModule, TransactionModule, forwardRef(() => DreamerModule), ClientModule, SendpulseModule],
  controllers: [RepaymentController],
  providers: [
    RepaymentService, GetHandleRepaymentFactory,
    HandleEqualRepaymentUsecase, HandleUnderRepaymentUsecase,
    HandleOverRepaymentUsecase, ZohoRepaymentHelperService,
  ],
  exports: [RepaymentService]
})
export class RepaymentModule { }
