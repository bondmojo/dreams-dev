import { Injectable } from "@nestjs/common";
import { TelegramKeyboardButton, TelegramReplyKeyboardMarkup, TelegramSendMessageParams, TelegramService } from "nestjs-telegram";
import { ClientService } from "src/loan_management/client/usecases/client.service";
import { CreditAmountKeyboard } from "./dto/credit_amount_keyboard.dto";
import { CustomTelegramKeyboardMessage } from "./dto/keyboard_message.dto";

@Injectable()
export class CustomTelegramService {

    constructor(private readonly telegramService: TelegramService,
        private readonly clientService: ClientService) {

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

    async sendCreditAmountKeyboard(creditAmountKeyboardMessage: CreditAmountKeyboard) {
        const sendpulseUserId = creditAmountKeyboardMessage.sendpulse_user_id;
        const client = await this.clientService.findbySendpulseId(sendpulseUserId);

        if (client == null || client.telegram_id == null) {
            throw Error("Client or Telegram ID not Found");
        }

        const telegram_id = client.telegram_id;
        const max_credit_amount = parseInt(creditAmountKeyboardMessage.max_credit_amount);

        const creditAmountArray = [0.2 * max_credit_amount, 0.4 * max_credit_amount, 0.6 * max_credit_amount, 0.8 * max_credit_amount, max_credit_amount];

        let keyboard: TelegramKeyboardButton[][] = [];
        creditAmountArray.forEach(amount => {
            const key: TelegramKeyboardButton = { text: `${amount}` };
            keyboard.push([key]);
        })
        let customKeyboard: TelegramReplyKeyboardMarkup = { keyboard: keyboard, one_time_keyboard: true };



    }

    sendKeyboardMessage(keyboard: TelegramKeyboardButton, column: number, values: []) {

    }
}
