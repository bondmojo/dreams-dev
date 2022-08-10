import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ZohoModule} from './external/zoho/zoho.module';
import {DreamerModule} from "./dreamer/dreamer.module";
import {SendpulseModule} from "./external/sendpulse/sendpulse.module";

@Module({
  imports: [ConfigModule.forRoot(), ZohoModule, DreamerModule, SendpulseModule]
})
export class AppModule {

}
