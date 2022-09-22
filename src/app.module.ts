import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZohoModule } from './external/zoho/zoho.module';
import { DreamerModule } from "./dreamer/dreamer.module";
import { SendpulseModule } from "./external/sendpulse/sendpulse.module";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthCheckController } from "./config/health-check.controller";
import { TypeOrmModule } from '@nestjs/typeorm';
import DatabaseConfig from './config/database.config';
import { GlobalModule } from './globals/global.module';

// Loan Management Modules
import { ClientModule } from "./loan_management/client/client.module";
import { LoanModule } from "./loan_management/loan/loan.module";
import { TransactionModule } from "./loan_management/transaction/transaction.module";

@Module({
  controllers: [HealthCheckController],
  imports: [
    TypeOrmModule.forRoot(DatabaseConfig),
    ConfigModule.forRoot(), EventEmitterModule.forRoot(), GlobalModule, ZohoModule, DreamerModule, SendpulseModule, ClientModule, LoanModule, TransactionModule]
})
export class AppModule {

}
