import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../custom_logger";
// import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../../globals/usecases/global.service"
import { UpdateFieldsOnZohoUsecase } from "../../../dreamer/usecases/update-fields-on-zoho.usecase";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";

@Injectable()
export class ZohoLoanHelperService {
    private readonly log = new CustomLogger(ZohoLoanHelperService.name);
    constructor(
        private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,
        private readonly globalService: GlobalService,
    ) { }

    async updateZohoLoanStatus(zoho_loan_id: string, status: string, module: string): Promise<any> {
        const zohoKeyValuePairs = {
            Loan_Status: new Choice(status)
        };
        this.updateFieldsOnZohoUsecase.update(zoho_loan_id, zohoKeyValuePairs, module);
        return false;
    }

    async updateZohoFields(module_id: string, zohoKeyValuePairs: object, module_name: string): Promise<any> {
        this.updateFieldsOnZohoUsecase.update(module_id, zohoKeyValuePairs, module_name);
        return false;
    }

}
