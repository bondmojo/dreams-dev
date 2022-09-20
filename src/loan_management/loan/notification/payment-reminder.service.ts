import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomLogger } from 'src/custom_logger';

@Injectable()
export class PaymentReminderService {
  private readonly logger = new CustomLogger(PaymentReminderService.name);

  @Cron('4 * * * * *')
  handleCron() {
    this.logger.log('Called when the current second is 45');
  }
}
