import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../../custom_logger";
// import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../../../globals/usecases/global.service"
import { UpdateFieldsOnZohoUsecase } from "./update-fields-on-zoho.usecase";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { ZohoService } from "../../core/zoho.service";

@Injectable()
export class ZohoHelperService {
    private readonly log = new CustomLogger(ZohoHelperService.name);
    constructor(
        private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,
        private readonly zohoService: ZohoService

    ) { }

    /* async updateDreamerStatus(zoho_dremer_id: string, status: string): Promise<any> {
        const zohoKeyValuePairs = {
            Lead_Status: new Choice(status)
        };
        try {
            await this.updateZohoFields(zoho_dremer_id, zohoKeyValuePairs, "Leads");
        }
        catch {
            return { status: false }

        }
        return { status: true };
    }

    async updateLoanStatus(zoho_loan_id: string, status: string) {
        const zohoKeyValuePairs = {
            Loan_Status: new Choice(status)
        };
        try {
            await this.updateZohoFields(zoho_loan_id, zohoKeyValuePairs, "Loans");
        }
        catch {
            return { status: false }

        }
        return { status: true };
    } */

    /* async updateInstalmentStatus(){
        Repayment_Schedules Installment_Status Repayment_Status Repayment_Date
    } */

    private async updateZohoFields(record_id: string, zohoKeyValuePairs: object, module_name: string): Promise<any> {
        await this.updateFieldsOnZohoUsecase.update(record_id, zohoKeyValuePairs, module_name);
        return false;
    }

    async createBulkRecordOnZoho(zohoRecordList: [], moduleName: string): Promise<string[]> {
        // zohoDataKeyValuePair should be key value pair
        this.log.log(`Creating Zoho field with data at ${JSON.stringify(zohoRecordList)}`);

        const recordArray: Record[] = [];

        zohoRecordList.forEach(zohoKeyValuePairs => {
            const record = new Record();
            Object.keys(zohoKeyValuePairs).forEach(key => {
                record.addKeyValue(key, zohoKeyValuePairs[key]);
            });
            recordArray.push(record);
        });

        const saveRecordResponse = await this.zohoService.saveRecordArray(recordArray, moduleName);
        console.log(`Zoho Fields Successfully Created = Modue: ${moduleName} , Fields ${JSON.stringify(recordArray)}`);
        const response = saveRecordResponse.map((map: Map<string, any>) => (map.get('id') as bigint).toString())
        return response;
    }

}
