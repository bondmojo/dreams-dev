
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { RepaymentScheduleController } from './repayment_schedule.controller';
import { RepaymentSchedule } from './entities/repayment_schedule.entity';
import { RepaymentScheduleService } from './usecases/repayment_schedule.service';
import { CreateRepaymentScheduleUsecase } from './usecases/create_repayment_schedule.service';
import { GlobalModule } from "../../globals/global.module";

@Module({
  imports: [SendpulseModule, TypeOrmModule.forFeature([RepaymentSchedule]), GlobalModule],
  controllers: [RepaymentScheduleController],
  providers: [RepaymentScheduleService, CreateRepaymentScheduleUsecase],
  exports: [RepaymentScheduleService]
})
export class RepaymentScheduleModule { }
