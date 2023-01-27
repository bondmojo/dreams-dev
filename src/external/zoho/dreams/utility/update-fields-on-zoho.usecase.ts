import { Injectable } from "@nestjs/common";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { CustomLogger } from "src/custom_logger";
import { ZohoService } from "src/external/zoho/core/zoho.service";
import { MethodParamsRespLogger } from "src/decorator";
@Injectable()
export class UpdateFieldsOnZohoUsecase {

    private readonly log = new CustomLogger(UpdateFieldsOnZohoUsecase.name);

    constructor(private readonly zohoService: ZohoService,
    ) { }

    async update(id: string, zohoKeyValuePairs: any, moduleName: string): Promise<string> {
        return await this.updateFieldsOnZoho(id, zohoKeyValuePairs, moduleName);
    }

    // This function should be use for all future update implementations.
    private async updateFieldsOnZoho(id: string, zohoKeyValuePairs: any, moduleName: string): Promise<string> {
        // zohoDataKeyValuePair should be key value pair
        const record = new Record();
        Object.keys(zohoKeyValuePairs).forEach(key => {
            record.addKeyValue(key, zohoKeyValuePairs[key]);
        });

        const map: Map<string, any> = await this.zohoService.updateRecord(id, record, moduleName);

        this.log.log(`Zoho Fields Successfully updated = Modue: ${moduleName} , UserModuleId:  ${id}, Fields ${JSON.stringify(zohoKeyValuePairs)}`);

        return (map.get('id') as bigint).toString();
    }
}
