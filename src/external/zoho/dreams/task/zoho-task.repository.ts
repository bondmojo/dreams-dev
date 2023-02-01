import { Injectable } from "@nestjs/common";
import { Field } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/field";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { User } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/users/user";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { GlobalService } from "src/globals/usecases/global.service";
import { CustomLogger } from "../../../../custom_logger";
import { ZohoService } from "../../core/zoho.service";
import { ZohoTaskRequest } from "./zoho-task-request.dto";

@Injectable()
export class ZohoTaskRepository {
    private readonly COMPANY_NAME = 'GOJO';
    private readonly log = new CustomLogger(ZohoTaskRepository.name);

    constructor(private readonly zohoservice: ZohoService,
        private readonly globalService: GlobalService,
    ) { }

    async createTask(dreamerId: string, taskDetails: ZohoTaskRequest) {
        const taskRecord = new Record();
        const today = new Date();
        const user = new User();
        user.setEmail(taskDetails.assign_to);

        //Set dreamerId/leadid
        const id = BigInt(dreamerId);
        const whatId = new Record();
        whatId.setId(id);

        taskRecord.addFieldValue(Field.Tasks.WHAT_ID, whatId);

        taskRecord.addFieldValue(Field.Tasks.SUBJECT, taskDetails.subject);
        taskRecord.addFieldValue(Field.Tasks.CREATED_TIME, today);
        taskRecord.addFieldValue(Field.Tasks.STATUS, new Choice(taskDetails.status));
        taskRecord.addFieldValue(Field.Tasks.OWNER, user);

        if (taskDetails?.dreamservice_customer_id) {
            const retoolUrl = this.globalService.DREAMS_RETOOL_URL + "#customer_id=" + taskDetails?.dreamservice_customer_id;
            taskRecord.addFieldValue(Field.Tasks.DESCRIPTION, retoolUrl);
            this.log.log(`createTask. Retool URL = ${retoolUrl}`);
        }

        if (taskDetails?.sendpulse_url_required && taskDetails?.sendpulse_id) {
            const sendpulseUrl = this.globalService.BASE_SENDPULSE_URL + taskDetails?.sendpulse_id;
            taskRecord.addFieldValue(Field.Tasks.DESCRIPTION, sendpulseUrl);
            this.log.log(`createTask. Sendpulse URL = ${sendpulseUrl}`);
        }

        taskRecord.addFieldValue(Field.Tasks.DUE_DATE, taskDetails.due_date); //FIXME:: move outside

        taskRecord.addKeyValue("$se_module", "Leads");
        //taskRecord.addKeyValue("Retool_Url", taskDetails.retool_url);

        const map: Map<string, any> = await this.zohoservice.saveRecord(taskRecord, "Tasks");
        this.log.log(`Successfully saved user as ${map.get('id')}`);
        return (map.get('id') as bigint).toString();
    }

    // This function should be use for all future update implementations.
    async updateFieldsOnZoho(id: string, zohoKeyValuePairs: any, moduleName: string): Promise<string> {
        // zohoDataKeyValuePair should be key value pair
        this.log.log(`Upading Zoho field with data at ${JSON.stringify(zohoKeyValuePairs)}`);
        const record = new Record();
        Object.keys(zohoKeyValuePairs).forEach(key => {
            record.addKeyValue(key, zohoKeyValuePairs[key]);
        });

        const map: Map<string, any> = await this.zohoservice.updateRecord(id, record, moduleName);

        console.log(`Zoho Fields Successfully updated = Modue: ${moduleName} , UserModuleId:  ${id}, Fields ${JSON.stringify(zohoKeyValuePairs)}`);

        return (map.get('id') as bigint).toString();
    }

}
