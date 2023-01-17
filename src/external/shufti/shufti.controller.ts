import { Body, Controller, Param, Post, Query } from "@nestjs/common";
import { ShuftiResponseDto } from "./dto/shufti-response.dto";
import { ShuftiService } from "./shufti.service";
import { CustomLogger } from "../../custom_logger";
import { MethodParamsRespLogger } from "src/decorator";
@Controller('shufti')
export class ShuftiController {
    private readonly logger = new CustomLogger(ShuftiController.name);
    constructor(private readonly shuftiService: ShuftiService) { }

    @Post('callback')
    @MethodParamsRespLogger(new CustomLogger(ShuftiController.name))
    async callback(@Body() response: ShuftiResponseDto, @Query() params: any) {
        return await this.shuftiService.kycCallback(params.dreamerId, params.kycId, response);
    }

    @Post('kycData')
    @MethodParamsRespLogger(new CustomLogger(ShuftiController.name))
    async fetchKycData(@Query() params: any,) {
        return await this.shuftiService.fetchKycData(params.kycId);
    }
}
