import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule , ConfigService } from '@nestjs/config';
import { CustomLogger } from './custom_logger';
import { ZohoModule } from './zoho/zoho.module';
import { RecordController } from './zoho/record.controller';
import { RecordService } from './zoho/record.service';

@Module({
  imports: [ConfigModule.forRoot(), ZohoModule],
  controllers: [AppController, RecordController],
  providers: [AppService, RecordService],
})

export class AppModule {

}