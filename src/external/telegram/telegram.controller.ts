import { Body, Controller, Param, Post, Get, Query } from "@nestjs/common";
import { CustomTelegramService } from "./telegram.service";
import { CustomLogger } from "../../custom_logger";
import { CustomTelegramKeyboardMessage } from "./dto/keyboard_message.dto";
import { CreditAmountKeyboard } from "./dto/credit_amount_keyboard.dto";

@Controller('telegram')
export class TelegramController {
    private readonly logger = new CustomLogger(TelegramController.name);
    constructor(private readonly customTelegramService: CustomTelegramService) { }

    @Get('/sendKeyboardMessage')
    async sendKeyboardMessage(customTelegramKeyboardMessage: CustomTelegramKeyboardMessage) {
        return this.customTelegramService.sendMessageWithCustomKeyboard(customTelegramKeyboardMessage);
    }

    @Post('/sendCreditAmountKeyboard')
    async sendCreditAmountKeyboard(creditAmountKeyboardMessage: CreditAmountKeyboard) {
        return this.customTelegramService.sendCreditAmountKeyboard(creditAmountKeyboardMessage);
    }


}