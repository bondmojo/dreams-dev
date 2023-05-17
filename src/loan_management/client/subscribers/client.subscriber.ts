import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  Connection,
} from 'typeorm';
import { Choice } from '@zohocrm/typescript-sdk-2.0/utils/util/choice';

import { Client } from '../entities/client.entity';
import { GlobalService } from 'src/globals/usecases/global.service';
import { ZohoClientHelperService } from '../usecases/zoho-client-helper.service';
import { CustomLogger } from 'src/custom_logger';

@EventSubscriber()
export class ClientSubscriber implements EntitySubscriberInterface<Client> {
  private readonly log = new CustomLogger(ClientSubscriber.name);

  constructor(
    private readonly connection: Connection,
    private readonly zohoClientHelperService: ZohoClientHelperService,
    private readonly globalService: GlobalService,
  ) {
    connection.subscribers.push(this);
  }
  /**
   * Indicates that this subscriber only listen to Post events.
   */
  listenTo() {
    return Client;
  }

  /**
   * Called before post insertion.
   */
  async afterUpdate(event: UpdateEvent<any>) {
    try {
      const zohoKeyValuePairs: any = {};
      const zoho_loan_id = event.entity.zoho_id;
      const module_name = this.globalService.ZOHO_MODULES.DREAMER;
      event.updatedColumns.forEach((column) => {
        const key = column.databaseName;
        const newValue = event.entity[column.propertyName];
        switch (key) {
          case 'acc_number':
            zohoKeyValuePairs.Account_Number = newValue;
            break;
          case 'acc_provider_type':
            zohoKeyValuePairs.Provider = new Choice(newValue);
            break;
        }
      });

      // DO NOT CALL zohoLoanHelperService when zohoKeyValuePairs is empty object
      if (Object.keys(zohoKeyValuePairs).length === 0) {
        return;
      }

      await this.zohoClientHelperService.updateZohoFields(
        zoho_loan_id,
        zohoKeyValuePairs,
        module_name,
      );
    } catch (error) {
      this.log.error(`LOAN SUBSCRIBER ERROR (in afterUpdate) :  ${error}`);
    }
  }
}
