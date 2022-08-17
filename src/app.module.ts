import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ZohoModule} from './external/zoho/zoho.module';
import {DreamerModule} from "./dreamer/dreamer.module";
import {SendpulseModule} from "./external/sendpulse/sendpulse.module";
import { EventEmitterModule } from '@nestjs/event-emitter';
import {HealthCheckController} from "./config/health-check.controller";

@Module({
  controllers: [HealthCheckController],
  imports: [ConfigModule.forRoot(), EventEmitterModule.forRoot(), ZohoModule, DreamerModule, SendpulseModule]
})
export class AppModule {

}
