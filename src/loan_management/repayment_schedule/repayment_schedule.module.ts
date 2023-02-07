
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { RepaymentScheduleController } from './repayment_schedule.controller';
import { RepaymentSchedule } from './entities/repayment_schedule.entity';
import { RepaymentScheduleService } from './usecases/repayment_schedule.service';
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
import { GlobalModule } from "../../globals/global.module";
import { DreamerModule } from 'src/external/zoho/dreams/dreamer.module';
import { ZohoRepaymentScheduleHelper } from './usecases/ZohoRepaymentScheduleHelper';

@Module({
  imports: [SendpulseModule, TypeOrmModule.forFeature([RepaymentSchedule]), GlobalModule, forwardRef(() => DreamerModule)],
  controllers: [RepaymentScheduleController],
  providers: [RepaymentScheduleService, CreateRepaymentScheduleUsecase, ZohoRepaymentScheduleHelper],
  exports: [RepaymentScheduleService, CreateRepaymentScheduleUsecase, ZohoRepaymentScheduleHelper]
})
export class RepaymentScheduleModule { }
