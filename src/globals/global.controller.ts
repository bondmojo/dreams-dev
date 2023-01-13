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
  async CalculateWingWeiLuyTransferFee(@Param('amount') amount: string) {
    const new_amount: number = +amount;
    this.logger.log(`REQUEST: Calculating Wing Wei Luy Transfer Fee: ${new_amount}`);
    const WingWeiLuyTransferFee = await this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(new_amount);
    this.logger.log(`RESPONSE: Wing Wei Luy Transfer Fee: ${WingWeiLuyTransferFee} for amount ${new_amount}`);
    return { WingWeiLuyTransferFee: WingWeiLuyTransferFee };
  }
}
