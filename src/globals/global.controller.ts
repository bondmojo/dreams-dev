import { Controller, Param, Get } from '@nestjs/common';
import { GlobalService } from "./usecases/global.service";
import { CustomLogger } from "../custom_logger";

@Controller('global')
export class GlobalController {
  private readonly logger = new CustomLogger(GlobalController.name);
  constructor(
    private readonly globalService: GlobalService,
  ) { }

  @Get('CalculateWingWeiLuyTransferFee/:amount')
  async CalculateWingWeiLuyTransferFee(@Param('amount') amount: number) {
    return await this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(amount);
  }

}
