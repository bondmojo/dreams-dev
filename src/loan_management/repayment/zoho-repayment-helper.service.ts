import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../custom_logger";
// import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../globals/usecases/global.service"
import { UpdateFieldsOnZohoUsecase } from "src/dreamer/usecases/update-fields-on-zoho.usecase";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";

@Injectable()
export class ZohoRepaymentHelperService {
    private readonly log = new CustomLogger(ZohoRepaymentHelperService.name);
    constructor(
        private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,
        private readonly globalService: GlobalService,
    ) { }

    async updateZohoFields(module_id: string, zohoKeyValuePairs: object, module_name: string): Promise<any> {
        try {
            this.log.log(`Updaing zoho data with data : ${module_id}, ${zohoKeyValuePairs}, ${module_name}`);
            await this.updateFieldsOnZohoUsecase.update(module_id, zohoKeyValuePairs, module_name);
            return true;
        } catch (error) {
            console.log(error);
            this.log.error(`Error in Zoho Repaymen Schedule Helper(Update Zoho Fields) ${(error)}`);
        }
    }

}
