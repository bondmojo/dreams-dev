import { Controller, Param, Get } from '@nestjs/common';
import { GlobalService } from "./usecases/global.service";
import { CustomLogger } from "../custom_logger";
import { MethodParamsRespLogger } from 'src/decorator';

@Controller('global')
export class GlobalController {
  private readonly logger = new CustomLogger(GlobalController.name);
  constructor(
    private readonly globalService: GlobalService,
  ) { }

  @Get('CalculateWingWeiLuyTransferFee/:amount')
  @MethodParamsRespLogger(new CustomLogger(GlobalController.name))
  async CalculateWingWeiLuyTransferFee(@Param('amount') amount: string) {
    const new_amount: number = +amount;
    const WingWeiLuyTransferFee = await this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(new_amount);
    return { WingWeiLuyTransferFee: WingWeiLuyTransferFee };
  }
}
