import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  Connection,
} from 'typeorm';
import { Choice } from '@zohocrm/typescript-sdk-2.0/utils/util/choice';

import { Loan } from '../entities/loan.entity';
import { GlobalService } from 'src/globals/usecases/global.service';
import { ZohoLoanHelperService } from '../usecases/zoho-loan-helper.service';

@EventSubscriber()
export class LoanSubscriber implements EntitySubscriberInterface<Loan> {
  constructor(
    private readonly connection: Connection,
    private readonly zohoLoanHelperService: ZohoLoanHelperService,
    private readonly globalService: GlobalService,
  ) {
    connection.subscribers.push(this);
  }
  /**
   * Indicates that this subscriber only listen to Post events.
   */
  listenTo() {
    return Loan;
  }

  /**
   * Called before post insertion.
   */
  async afterUpdate(event: UpdateEvent<any>) {
    try {
      const zohoKeyValuePairs: any = {};
      const zoho_loan_id = event.entity.zoho_loan_id;
      const module_name = this.globalService.ZOHO_MODULES.LOAN;

      event.updatedColumns.forEach((column) => {
        const key = column.databaseName;
        const newValue = event.entity[column.propertyName];
        switch (key) {
          case 'previous_repayment_dates':
            zohoKeyValuePairs.Previous_Repayment_Dates = newValue
              .toString()
              .replace(/,/g, ' \n ');
            break;
          case 'outstanding_amount':
            zohoKeyValuePairs.Outstanding_Balance = newValue;
            break;
          case 'late_fee':
            zohoKeyValuePairs.Late_Fee = newValue;
            break;
          case 'due_date':
            zohoKeyValuePairs.Repayment_Date = new Date(newValue);
            break;
          case 'payment_status':
            zohoKeyValuePairs.Payment_Status = new Choice(newValue);
            break;
          case 'repayment_date':
            zohoKeyValuePairs.Repayment_Date = new Date(newValue);
            break;
        }
      });
      // DO NOT CALL zohoLoanHelperService when zohoKeyValuePairs is empty object
      if (Object.keys(zohoKeyValuePairs).length === 0) {
        return;
      }

      await this.zohoLoanHelperService.updateZohoFields(
        zoho_loan_id,
        zohoKeyValuePairs,
        module_name,
      );
    } catch (error) {
      console.log('error', error);
    }
  }
}
