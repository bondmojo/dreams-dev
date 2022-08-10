import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {DreamerModel} from "../../dreamer/usecases/model/dreamer.model";
import {CustomLogger} from "../../custom_logger";
import { BodyWrapper } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/body_wrapper";
import{RecordOperations} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record_operations"
import { HeaderMap } from "@zohocrm/typescript-sdk-2.0/routes/header_map";
import { ActionHandler } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_handler";
import { ActionWrapper } from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_wrapper';
import { APIException } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/fields/api_exception";
import { ActionResponse } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_response";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { Field } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/field";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { SuccessResponse } from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/success_response';

@Injectable()
export class ZohoService {
    private readonly COMPANY_NAME = 'GOJO';
    private readonly log = new CustomLogger(ZohoService.name);

    async createDreamer(dreamerDto: DreamerModel): Promise<string> {
        let recordOperations = new RecordOperations();
        let request = new BodyWrapper();
        let recordsArray = [];

        let record = this.createDeamerRecord(dreamerDto);

        //Add Record instance to the array
        recordsArray.push(record);

        //Set the array to data in BodyWrapper instance
        request.setData(recordsArray);

         //Get instance of HeaderMap Class
        let headerInstance = new HeaderMap();

        this.log.log("Trying to post the record");

        //Call createRecords method that takes BodyWrapper instance and moduleAPIName as parameters
        let response = await recordOperations.createRecords('Leads', request, headerInstance);

        this.log.log("Received response from the " + JSON.stringify(response));

        if(response == null) {
            throw new HttpException('Unable to push data to Zoho', HttpStatus.BAD_REQUEST);
        }

        let responseObject: ActionHandler = response.getObject();response.getObject();

        if(responseObject == null) {
            throw new HttpException('Invalid data pushed to zoho', HttpStatus.BAD_REQUEST);
        }

        if (responseObject instanceof APIException) {
            throw new HttpException(responseObject.getMessage().getValue(), HttpStatus.BAD_REQUEST);
        }

        let actionResponses: ActionResponse[] = (responseObject as ActionWrapper).getData();
        let actionResponse = actionResponses[0];

        if(actionResponse instanceof APIException) {
            throw new HttpException(actionResponse.getMessage().getValue(), HttpStatus.BAD_REQUEST);
        }

        this.log.log("Successfully pushed record to zoho");

        let details: Map<string, any> = (actionResponse as SuccessResponse).getDetails();

        this.log.log(typeof details.get('id'));

        return (details.get('id') as bigint).toString();
    }

    private createDeamerRecord(dreamerDto: DreamerModel) {
        const record = new Record();

        record.addFieldValue(Field.Leads.LAST_NAME, dreamerDto.lastName);
        record.addFieldValue(Field.Leads.FIRST_NAME, dreamerDto.firstName);
        record.addFieldValue(Field.Leads.FULL_NAME, dreamerDto.name);
        record.addFieldValue(Field.Leads.COMPANY, this.COMPANY_NAME);
        record.addFieldValue(Field.Leads.CITY, 'default');

        record.addKeyValue('Lead_Source', new Choice('Telegram'));
        record.addKeyValue('Telegram_Chat_ID', dreamerDto.externalId);
        record.addKeyValue('Amount', dreamerDto.loanRequest.amount);
        record.addKeyValue('Points', dreamerDto.loanRequest.pointsAmount);
        return record;
    }
}
