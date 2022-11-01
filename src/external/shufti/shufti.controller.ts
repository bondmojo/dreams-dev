import { Body, Controller, Param, Post, Query } from "@nestjs/common";
import { ShuftiResponseDto } from "./dto/shufti-response.dto";
import { ShuftiService } from "./shufti.service";
import { CustomLogger } from "../../custom_logger";

@Controller('shufti')
export class ShuftiController {
    private readonly logger = new CustomLogger(ShuftiController.name);
    constructor(private readonly shuftiService: ShuftiService) { }

    @Post('callback')
    async callback(@Body() response: ShuftiResponseDto, @Query() params: any) {
        this.logger.log(`Received callback from shufti ${JSON.stringify(response)} with params ${JSON.stringify(params)}`)
        await this.shuftiService.kycCallback(params.dreamerId, params.kycId, response);
    }

    @Post('kycData')
    async fetchKycData(@Query() params: any,) {
        this.logger.log(`getching kyc data for ${params.kycId}`)
        await this.shuftiService.fetchKycData(params.kycId);
    }
}
