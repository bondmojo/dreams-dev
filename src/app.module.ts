import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZohoModule } from './external/zoho/zoho.module';
import { DreamerModule } from "./dreamer/dreamer.module";
import { SendpulseModule } from "./external/sendpulse/sendpulse.module";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthCheckController } from "./config/health-check.controller";
import { TypeOrmModule } from '@nestjs/typeorm';
import DatabaseConfig from './config/database.config';
import { ClientModule } from "./modules/loan_management/client/client.module";

@Module({
  controllers: [HealthCheckController],
  imports: [
    TypeOrmModule.forRoot(DatabaseConfig),
    ConfigModule.forRoot(), EventEmitterModule.forRoot(), ZohoModule, DreamerModule, SendpulseModule, ClientModule]
})
export class AppModule {

}
