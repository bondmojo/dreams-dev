import {Body, Controller, Param, Post, Query} from "@nestjs/common";
import {ShuftiResponseDto} from "./dto/shufti-response.dto";
import {ShuftiService} from "./shufti.service";

@Controller('shufti')
export class ShuftiController{
    constructor(private readonly shuftiService: ShuftiService) {}

    @Post('callback')
    async callback(@Body() response: ShuftiResponseDto, @Query() params: any){
        await this.shuftiService.kycCallback(params.dreamerId, params.kycId, response);
    }
}
