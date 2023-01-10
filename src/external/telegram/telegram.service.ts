import { GlobalService } from "../../globals/usecases/global.service";
import { HttpException, Injectable, HttpStatus } from "@nestjs/common";
import { TelegramService, TelegramSendMessageParams, TelegramReplyKeyboardMarkup, TelegramKeyboardButton } from "nestjs-telegram";
import { CustomTelegramKeyboardMessage } from "./dto/keyboard_message.dto";

@Injectable()
export class CustomTelegramService {

    constructor(private readonly telegramService: TelegramService) {

    }

    async sendMessageWithCustomKeyboard(customTelegramKeyboardMessage: CustomTelegramKeyboardMessage): Promise<any> {

        let buttonArray: TelegramKeyboardButton[][] = [];
        let i = customTelegramKeyboardMessage.number_of_instalments;
        for (let row = 0; row < 3; row++) {
            let r: TelegramKeyboardButton[] = [];
            for (let c = 0; c < 3; c++) {
                r.push({ text: "" + i });
                i++;
            }
            buttonArray.push(r);
        }

        let customKeyboard: TelegramReplyKeyboardMarkup = { keyboard: buttonArray, one_time_keyboard: true };
        let data: TelegramSendMessageParams = {
            chat_id: customTelegramKeyboardMessage.chat_id,
            text: customTelegramKeyboardMessage.text,
            reply_markup: customKeyboard
        };
        return await this.telegramService.sendMessage(data);
    }
}
