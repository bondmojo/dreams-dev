import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  Connection,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Choice } from '@zohocrm/typescript-sdk-2.0/utils/util/choice';

import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { GlobalService } from 'src/globals/usecases/global.service';
import { ZohoRepaymentScheduleHelper } from '../usecases/ZohoRepaymentScheduleHelper';
@EventSubscriber()
export class RepaymentScheduleSubscriber
  implements EntitySubscriberInterface<RepaymentSchedule>
{
  constructor(
    private readonly connection: Connection,
    private readonly zohoRepaymentScheduleHelper: ZohoRepaymentScheduleHelper,
    private readonly globalService: GlobalService,
  ) {
    connection.subscribers.push(this);
  }
  /**
   * Indicates that this subscriber only listen to Post events.
   */
  listenTo() {
    return RepaymentSchedule;
  }

  /**
   * Called before post insertion.
   */
  async afterUpdate(event: UpdateEvent<any>) {
    try {
      const zohoKeyValuePairs: any = {};
      const zoho_repayment_schedule_id =
        event.entity.zoho_repayment_schedule_id;
      const module_name = 'repayment_schedules';

      event.updatedColumns.forEach((column) => {
        const key = column.databaseName;
        const newValue = event.entity[column.propertyName];
        switch (key) {
          case 'previous_repayment_dates':
            zohoKeyValuePairs.Previous_Repayment_Dates = newValue.toString();
            break;
          case 'ins_overdue_amount':
            zohoKeyValuePairs.Overdue_Amount = newValue;
            break;
          case 'ins_additional_fee':
            zohoKeyValuePairs.Additional_Amount = newValue;
            break;
          case 'due_date':
            zohoKeyValuePairs.Repayment_Date = new Date(newValue);
            break;
          case 'repayment_status':
            zohoKeyValuePairs.Installment_Status = new Choice(
              this.globalService.INSTALMENT_PAYMENT_STATUS_STR['' + newValue],
            );
            break;
        }
      });
      await this.zohoRepaymentScheduleHelper.updateZohoFields(
        zoho_repayment_schedule_id,
        zohoKeyValuePairs,
        module_name,
      );
    } catch (error) {
      console.log('error', error);
    }
  }
}
