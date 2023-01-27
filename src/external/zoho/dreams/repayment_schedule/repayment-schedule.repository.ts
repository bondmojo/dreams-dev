import { Injectable } from "@nestjs/common";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { GlobalService } from "src/globals/usecases/global.service";
import { CustomLogger } from "src/custom_logger";
import { ZohoService } from "../../core/zoho.service";
import { MethodParamsRespLogger } from "src/decorator";
@Injectable()
export class ZohoRepaymentScheduleRepository {
    private readonly log = new CustomLogger(ZohoRepaymentScheduleRepository.name);

    constructor(private readonly zohoservice: ZohoService,
        private readonly globalService: GlobalService,
    ) { }

    async createBulkRecordOnZoho(zohoRecordList: [], moduleName: string): Promise<string[]> {
        // zohoDataKeyValuePair should be key value pair

        const recordArray: Record[] = [];

        zohoRecordList.forEach(zohoKeyValuePairs => {
            const record = new Record();
            Object.keys(zohoKeyValuePairs).forEach(key => {
                record.addKeyValue(key, zohoKeyValuePairs[key]);
            });
            recordArray.push(record);
        });

        const saveRecordResponse = await this.zohoservice.saveRecordArray(recordArray, moduleName);
        console.log(`Zoho Fields Successfully Created = Modue: ${moduleName} , Fields ${JSON.stringify(recordArray)}`);
        const response = saveRecordResponse.map((map: Map<string, any>) => (map.get('id') as bigint).toString())
        return response;
    }

}
