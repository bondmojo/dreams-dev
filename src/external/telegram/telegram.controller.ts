import { Body, Controller, Post } from "@nestjs/common";
import { MethodParamsRespLogger } from "src/decorator";
import { CustomLogger } from "../../custom_logger";
import { CreditAmountDetailsDto } from "./dto/credit_amount_details.dto";
import { DreamPointsDetailsDto } from "./dto/dream-points-details.dto";
import { CustomTelegramKeyboardMessage } from "./dto/keyboard_message.dto";
import { RemoveTelegramKeyboardDto } from "./dto/remove_telegram_keyboard";
import { TenureOptionsDto } from "./dto/select_tenure_kb.dto";
import { CustomTelegramService } from "./telegram.service";

@Controller('telegram')
export class TelegramController {
    private readonly logger = new CustomLogger(TelegramController.name);
    constructor(private readonly customTelegramService: CustomTelegramService) { }

    @Post('/sendKeyboardMessage')
    @MethodParamsRespLogger(new CustomLogger(TelegramController.name))
    async sendKeyboardMessage(@Body() customTelegramKeyboardMessage: CustomTelegramKeyboardMessage) {
        return this.customTelegramService.sendMessageWithCustomKeyboard(customTelegramKeyboardMessage);
    }

    @Post('/sendCreditAmountKeyboard')
    @MethodParamsRespLogger(new CustomLogger(TelegramController.name))
    async sendCreditAmountKeyboard(@Body() creditAmountDetails: CreditAmountDetailsDto) {
        this.logger.log("sendCreditAmountKeyboard Request =" + JSON.stringify(creditAmountDetails));
        this.customTelegramService.sendCreditAmountKeyboard(creditAmountDetails);
        return { success: true }
    }

    @Post('/removeTelegramKeyboard')
    @MethodParamsRespLogger(new CustomLogger(TelegramController.name))
    async removeTelegramKeyboard(@Body() removeTelegramKeyboardDto: RemoveTelegramKeyboardDto) {
        this.logger.log(" removeTelegramKeyboard Request =" + JSON.stringify(removeTelegramKeyboardDto));
        this.customTelegramService.removeKeyboard(removeTelegramKeyboardDto);
        return { success: true }
    }

    @Post('/sendDreampointsOptionKeyboard')
    @MethodParamsRespLogger(new CustomLogger(TelegramController.name))
    async sendDreampointsOptionKeyboard(@Body() dreamPointsDetailsDto: DreamPointsDetailsDto) {
        this.logger.log("sendDreampointsOptionKeyboard Request =" + JSON.stringify(dreamPointsDetailsDto));
        this.customTelegramService.sendDreampointsOptionKeyboard(dreamPointsDetailsDto);
        return { success: true }
    }

    @Post('/sendSelectTenureKeyboard')
    async sendSelectTenureKeyboard(@Body() tenureOptionsDto: TenureOptionsDto) {
        this.logger.log("sendSelectTenureKeyboard Request =" + JSON.stringify(tenureOptionsDto));
        return this.customTelegramService.sendSelectTenureKeyboard(tenureOptionsDto);
    }

}