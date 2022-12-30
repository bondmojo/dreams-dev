import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZohoModule } from './external/zoho/zoho.module';
import { DreamerModule } from "./dreamer/dreamer.module";
import { SendpulseModule } from "./external/sendpulse/sendpulse.module";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthCheckController } from "./config/health-check.controller";
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalModule } from './globals/global.module';
import { TypeOrmConfigService } from './config/database/typeorm-config.service';

// Loan Management Modules
import { ClientModule } from "./loan_management/client/client.module";
import { LoanModule } from "./loan_management/loan/loan.module";
import { TransactionModule } from "./loan_management/transaction/transaction.module";
import { ScheduleModule } from '@nestjs/schedule';
import { FileUploadModule } from './files/file_upload.module';
import { DataSource } from 'typeorm';
import { RepaymentScheduleModule } from './loan_management/repayment_schedule/repayment_schedule.module';
import { RepaymentModule } from './loan_management/repayment/repayment.module';
@Module({
  controllers: [HealthCheckController],
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(), EventEmitterModule.forRoot(), ZohoModule, DreamerModule, SendpulseModule, ClientModule, LoanModule, TransactionModule, GlobalModule, FileUploadModule, RepaymentScheduleModule, RepaymentModule]
})
export class AppModule {

}
