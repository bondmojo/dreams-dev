import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../custom_logger";
import { GlobalService } from "../../../globals/usecases/global.service"
import { UpdateFieldsOnZohoUsecase } from "src/external/zoho/dreams/utility/update-fields-on-zoho.usecase";

@Injectable()
export class ZohoRepaymentHelperService {
    private readonly log = new CustomLogger(ZohoRepaymentHelperService.name);
    constructor(
        private readonly globalService: GlobalService,
        private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,
    ) { }

    async updateZohoFields(module_id: string, zohoKeyValuePairs: object, module_name: string): Promise<any> {
        try {
            this.log.log(`Updaing zoho data with data : ${module_id}, ${JSON.stringify(zohoKeyValuePairs)}, ${module_name}`);
            await this.updateFieldsOnZohoUsecase.update(module_id, zohoKeyValuePairs, module_name);
            return true;
        } catch (error) {
            console.log(error);
            this.log.error(`Error in Zoho Repaymen Schedule Helper(Update Zoho Fields) ${(error)}`);
        }
    }

}
