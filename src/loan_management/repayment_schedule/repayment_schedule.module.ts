import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { RepaymentScheduleController } from './repayment_schedule.controller';
import { RepaymentSchedule } from './entities/repayment_schedule.entity';
import { RepaymentScheduleService } from './usecases/repayment_schedule.service';
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
import { GlobalModule } from '../../globals/global.module';
import { DreamerModule } from 'src/external/zoho/dreams/dreamer.module';
import { ZohoRepaymentScheduleHelper } from './usecases/ZohoRepaymentScheduleHelper';
import { UpdateRepaymentDateUsecase } from './usecases/update-repayment-date.usecase.service';
import { LoanModule } from '../loan/loan.module';
import { RepaymentScheduleSubscriber } from './subscribers/repayment_schedule.subscriber';
@Module({
  imports: [
    SendpulseModule,
    TypeOrmModule.forFeature([RepaymentSchedule]),
    GlobalModule,
    forwardRef(() => DreamerModule),
    forwardRef(() => LoanModule),
  ],
  controllers: [RepaymentScheduleController],
  providers: [
    RepaymentScheduleService,
    CreateRepaymentScheduleUsecase,
    ZohoRepaymentScheduleHelper,
    UpdateRepaymentDateUsecase,
    RepaymentScheduleSubscriber,
  ],
  exports: [
    RepaymentScheduleService,
    CreateRepaymentScheduleUsecase,
    ZohoRepaymentScheduleHelper,
  ],
})
export class RepaymentScheduleModule {}
