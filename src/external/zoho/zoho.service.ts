import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {CustomLogger} from "../../custom_logger";
import {BodyWrapper} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/body_wrapper";
import { BodyWrapper as FileBodyWrapper} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/file/body_wrapper";
import { FileBodyWrapper as AttachmentBodyWrapper } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/attachments/file_body_wrapper";
import {RecordOperations} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record_operations"
import {FileOperations,GetFileParam,UploadFilesParam} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/file/file_operations";
import {ActionHandler} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_handler";
import {ActionWrapper} from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_wrapper';
import {APIException} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/fields/api_exception";
import {ActionResponse} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/action_response";
import {Record} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import {SuccessResponse} from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/success_response';
import { APIResponse } from "@zohocrm/typescript-sdk-2.0/routes/controllers/api_response";
import {StreamWrapper} from "@zohocrm/typescript-sdk-2.0/utils/util/stream_wrapper";
import { ParameterMap } from "@zohocrm/typescript-sdk-2.0/routes/parameter_map";
import { FieldsOperations } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/fields/fields_operations";
import {AttachmentsOperations} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/attachments/attachments_operations"
import { HeaderMap } from "@zohocrm/typescript-sdk-2.0/routes/header_map";

@Injectable()
export class ZohoService {
    private readonly log = new CustomLogger(ZohoService.name);

    async getRecord(dreamerId: string): Promise<Record> {
        let recordOperations = new RecordOperations();
        let paramInstance: ParameterMap = new ParameterMap();
        let headerInstance: HeaderMap = new HeaderMap();

        let response = await recordOperations.getRecord(BigInt(dreamerId), 'Leads', paramInstance, headerInstance);
        return (this.extractResponse(response) as Record);
    }

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

        const successResponse = this.extractResponse(response);

        return (successResponse as SuccessResponse).getDetails();
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

        const successResponse = this.extractResponse(response);

        return (successResponse as SuccessResponse).getDetails();
    }

    async getAllFields() {
        let fieldsOperations: FieldsOperations = new FieldsOperations('Leads');
        let paramInstance: ParameterMap = new ParameterMap();
        let response = await fieldsOperations.getFields(paramInstance);

        return this.extractResponse(response);
    }

    async uploadFile(dreamerId: string, streamWrapper: StreamWrapper){
        let fileOperations: FileOperations = new FileOperations();
        let request: FileBodyWrapper = new FileBodyWrapper();
        let paramInstance: ParameterMap = new ParameterMap();

        let files: StreamWrapper[] = [];
        files.push(streamWrapper);
        request.setFile(files);

        let response = await fileOperations.uploadFiles(request, paramInstance);
        const successResponse = this.extractResponse(response);

        return (successResponse as SuccessResponse).getDetails();
    }

    async uploadAttachments(dreamerId: string, streamWrapper: StreamWrapper) {
        let attachmentsOperations: AttachmentsOperations = new AttachmentsOperations('Leads', BigInt(dreamerId));
        let fileBodyWrapper: AttachmentBodyWrapper = new AttachmentBodyWrapper();
        fileBodyWrapper.setFile(streamWrapper);
        let response: APIResponse<ActionHandler> = await attachmentsOperations.uploadAttachment(fileBodyWrapper);
        const successResponse = this.extractResponse(response);

        return (successResponse as SuccessResponse).getDetails();
    }

    private extractResponse(response: APIResponse<ActionHandler>) {
        this.log.log("Received response from the " + JSON.stringify(response));

        if (response == null) {
            throw new HttpException('Unable to push data to Zoho', HttpStatus.BAD_REQUEST);
        }

        let responseObject: ActionHandler = response.getObject();

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

        this.log.log("Successfully performed operation on Zoho");

        return actionResponse;
    }
}
