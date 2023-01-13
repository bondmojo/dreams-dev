import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../../custom_logger";
// import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../../../globals/usecases/global.service"
import { UpdateFieldsOnZohoUsecase } from "./update-fields-on-zoho.usecase";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";

@Injectable()
export class ZohoHelperService {
    private readonly log = new CustomLogger(ZohoHelperService.name);
    constructor(
        private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,

    ) { }

    async updateDreamerStatus(zoho_dremer_id: string, status: string): Promise<any> {
        const zohoKeyValuePairs = {
            Lead_Status: new Choice(status)
        };
        await this.updateZohoFields(zoho_dremer_id, zohoKeyValuePairs, "Leads");
        return false;
    }

    private async updateZohoFields(record_id: string, zohoKeyValuePairs: object, module_name: string): Promise<any> {
        await this.updateFieldsOnZohoUsecase.update(record_id, zohoKeyValuePairs, module_name);
        return false;
    }



}
