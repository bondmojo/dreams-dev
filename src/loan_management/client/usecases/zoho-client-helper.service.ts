import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../../../custom_logger';
import { GlobalService } from '../../../globals/usecases/global.service';
import { UpdateFieldsOnZohoUsecase } from '../../../external/zoho/dreams/utility/update-fields-on-zoho.usecase';
@Injectable()
export class ZohoClientHelperService {
  private readonly log = new CustomLogger(ZohoClientHelperService.name);
  constructor(
    private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,
    private readonly globalService: GlobalService,
  ) {}

  async updateZohoFields(
    module_id: string,
    zohoKeyValuePairs: object,
    module_name: string,
  ): Promise<any> {
    try {
      await this.updateFieldsOnZohoUsecase.update(
        module_id,
        zohoKeyValuePairs,
        module_name,
      );
      return false;
    } catch (error) {
      this.log.error(
        'Error in Zoho Client Helper(Update Zoho Fields) ' +
          JSON.stringify(error),
      );
    }
  }
}
