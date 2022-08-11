import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {CustomLogger} from "../../custom_logger";
import {BodyWrapper} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/body_wrapper";
import {RecordOperations} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record_operations"
import {ActionHandler} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_handler";
import {ActionWrapper} from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_wrapper';
import {APIException} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/fields/api_exception";
import {ActionResponse} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_response";
import {Record} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import {SuccessResponse} from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/success_response';
import { APIResponse } from "@zohocrm/typescript-sdk-2.0/routes/controllers/api_response";

@Injectable()
export class ZohoService {
    private readonly log = new CustomLogger(ZohoService.name);

    async saveRecord(record: Record): Promise<Map<string, any>> {
        let recordOperations = new RecordOperations();
        let request = new BodyWrapper();
        let recordsArray = [];

        //Add Record instance to the array
        recordsArray.push(record);

        //Set the array to data in BodyWrapper instance
        request.setData(recordsArray);

        this.log.log("Trying to post the record");

        //Call createRecords method that takes BodyWrapper instance and moduleAPIName as parameters
        let response = await recordOperations.createRecords('Leads', request);

        return this.extractResponse(response);
    }

    async updateRecord(dreamerId: string, record: Record) {
        let recordOperations = new RecordOperations();
        let request = new BodyWrapper();
        let recordsArray = [];

        //Add Record instance to the array
        recordsArray.push(record);

        //Set the array to data in BodyWrapper instance
        request.setData(recordsArray);

        this.log.log("Trying to update the record");

        //Call createRecords method that takes BodyWrapper instance and moduleAPIName as parameters
        let response = await recordOperations.updateRecord(BigInt(dreamerId), 'Leads', request);

        return this.extractResponse(response);
    }

    private extractResponse(response: APIResponse<ActionHandler>) {
        this.log.log("Received response from the " + JSON.stringify(response));

        if (response == null) {
            throw new HttpException('Unable to push data to Zoho', HttpStatus.BAD_REQUEST);
        }

        let responseObject: ActionHandler = response.getObject();
        response.getObject();

        if (responseObject == null) {
            throw new HttpException('Invalid data pushed to zoho', HttpStatus.BAD_REQUEST);
        }

        if (responseObject instanceof APIException) {
            throw new HttpException(responseObject.getMessage().getValue(), HttpStatus.BAD_REQUEST);
        }

        let actionResponses: ActionResponse[] = (responseObject as ActionWrapper).getData();
        let actionResponse = actionResponses[0];

        if (actionResponse instanceof APIException) {
            throw new HttpException(actionResponse.getMessage().getValue(), HttpStatus.BAD_REQUEST);
        }

        this.log.log("Successfully pushed record to zoho");

        return (actionResponse as SuccessResponse).getDetails();
    }
}
