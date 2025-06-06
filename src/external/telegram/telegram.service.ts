import { Injectable } from "@nestjs/common";
import { te } from "date-fns/locale";
import { TelegramKeyboardButton, TelegramMessage, TelegramReplyKeyboardMarkup, TelegramReplyKeyboardRemove, TelegramSendChatActionParams, TelegramSendMessageParams, TelegramService } from "nestjs-telegram";
import { send } from "process";
import { Observable } from "rxjs";
import * as dreamsException from "src/config/dreams-exception";
import { CustomLogger } from "src/custom_logger";
import { GlobalService } from "src/globals/usecases/global.service";
import { ClientService } from "src/loan_management/client/usecases/client.service";
import { CreditAmountDetailsDto } from "./dto/credit_amount_details.dto";
import { DreamPointsDetailsDto } from "./dto/dream-points-details.dto";
import { CustomTelegramKeyboardMessage } from "./dto/keyboard_message.dto";
import { RemoveTelegramKeyboardDto } from "./dto/remove_telegram_keyboard";
import { TenureOptionsDto } from "./dto/select_tenure_kb.dto";
//import { Observable } from "rxjs";
const util = require('util');


@Injectable()
export class CustomTelegramService {
    private readonly log: CustomLogger = new CustomLogger(CustomTelegramService.name);

    constructor(private readonly telegramService: TelegramService,
        private readonly clientService: ClientService,
        private readonly globalService: GlobalService) {
    }

    async sendMessageWithCustomKeyboard(customTelegramKeyboardMessage: CustomTelegramKeyboardMessage): Promise<any> {
        const telegram_chat_id = customTelegramKeyboardMessage.telegram_chat_id;
        const delayInSec = customTelegramKeyboardMessage.delayInSeconds ? Number(customTelegramKeyboardMessage.delayInSeconds) : 0;

        const delayinMillis = delayInSec * 1000;

        let customKeyboardButtonArray: TelegramKeyboardButton[][] = [];
        let len = customTelegramKeyboardMessage.keyboardOptions.length;
        for (let row = 0; row < len; row++) {
            let r: TelegramKeyboardButton[] = [];
            r.push({ text: customTelegramKeyboardMessage.keyboardOptions[row] });
            customKeyboardButtonArray.push(r);
        }
        return await this.sendKeyboardMessage(customKeyboardButtonArray, telegram_chat_id, customTelegramKeyboardMessage.message, delayinMillis);

    }

    async sendCreditAmountKeyboard(creditAmountDetails: CreditAmountDetailsDto) {
        /* const sendpulseUserId = creditAmountDetails.sendpulse_user_id;

        if (sendpulseUserId == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.SENDPULSE_ID_NOT_FOUND, "Invalid Sendpulse id with value" + sendpulseUserId);
        } 

        const telegram_chat_id = await this.getTelegramChatId(sendpulseUserId);*/
        const telegram_chat_id = creditAmountDetails.telegram_chat_id;
        if (telegram_chat_id == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.TELEGRAM_ID_NOT_FOUND, "TELEGRAM id NOT FOUND");
        }

        const max_credit_amount = parseInt(creditAmountDetails.max_credit_amount);
        const creditAmountArray = [0.2 * max_credit_amount, 0.4 * max_credit_amount, 0.6 * max_credit_amount, 0.8 * max_credit_amount, max_credit_amount];

        let customKeyboardButtonArray: TelegramKeyboardButton[][] = [];
        let i = 0;
        //we have 5 elements to be displayed in 3 rows and 2 columns
        for (let row = 0; row < 3; row++) {
            let r: TelegramKeyboardButton[] = [];
            for (let c = 0; c < 2; c++) {
                if (i < 5)
                    r.push({ text: `$${creditAmountArray[i]}` });
                i++;
            }
            customKeyboardButtonArray.push(r);
        }
        telegram_chat_id
        return await this.sendKeyboardMessage(customKeyboardButtonArray, telegram_chat_id, creditAmountDetails.message, 2000);

    }

    async sendDreampointsOptionKeyboard(dreamPointsDetailsDto: DreamPointsDetailsDto) {
        /* const sendpulseUserId = dreamPointsDetailsDto.sendpulse_user_id;

        if (sendpulseUserId == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.SENDPULSE_ID_NOT_FOUND, "Invalid Sendpulse id with value" + sendpulseUserId);
        }
        const telegram_chat_id = await this.getTelegramChatId(sendpulseUserId); */
        const telegram_chat_id = dreamPointsDetailsDto.telegram_chat_id;
        if (telegram_chat_id == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.TELEGRAM_ID_NOT_FOUND, "TELEGRAM id NOT FOUND");
        }

        const req_loan_amount = parseInt(dreamPointsDetailsDto.requested_loan_amount);
        const dreamPointRequestArray = [Math.round(0.2 * req_loan_amount),
        Math.round(0.4 * req_loan_amount),
        Math.round(0.6 * req_loan_amount),
        Math.round(0.8 * req_loan_amount),
            req_loan_amount];

        let customKeyboardButtonArray: TelegramKeyboardButton[][] = [];

        let i = 0;
        //we have 5 elements to be displayed in 3 rows and 2 columns
        for (let row = 0; row < 3; row++) {
            let r: TelegramKeyboardButton[] = [];
            for (let c = 0; c < 2; c++) {
                if (i < 5)
                    r.push({ text: `-$${dreamPointRequestArray[i]}` });
                i++;
            }
            customKeyboardButtonArray.push(r);
        }

        /* dreamPointRequestArray.forEach(points => {
            const key: TelegramKeyboardButton = { text: `$${points}` };
            customKeyboardButtonArray.push([key]);
        }) */

        return await this.sendKeyboardMessage(customKeyboardButtonArray, telegram_chat_id, dreamPointsDetailsDto.message, 2000);
    }

    async sendSelectTenureKeyboard(tenureOptionsDto: TenureOptionsDto) {
        /* const sendpulseUserId = tenureOptionsDto.sendpulse_user_id;

        if (sendpulseUserId == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.SENDPULSE_ID_NOT_FOUND, "Invalid Sendpulse id with value" + sendpulseUserId);
        }
        const telegram_chat_id = await this.getTelegramChatId(sendpulseUserId); */
        const telegram_chat_id = tenureOptionsDto.telegram_chat_id;
        if (telegram_chat_id == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.TELEGRAM_ID_NOT_FOUND, "TELEGRAM id NOT FOUND");
        }

        const tenure = parseInt(tenureOptionsDto.max_tenure);
        const rowCount = Math.floor((tenure + 1) / 2)
        const tenure_type = tenureOptionsDto.tenure_type;
        let monthCount = 0;
        let customKeyboardButtonArray: TelegramKeyboardButton[][] = [];

        if (tenure_type === this.globalService.LOAN_TENURE_TYPE.MONTHLY) {
            for (let row = 0; row < rowCount; row++) {
                let r: TelegramKeyboardButton[] = [];

                for (let c = 0; c < 2; c++) {
                    if (monthCount == 0) {
                        this.log.debug((monthCount + 1) + " Month");
                        r.push({ text: `${++monthCount} Month` });
                    }
                    else if (monthCount < tenure) {
                        this.log.debug((monthCount + 1) + " Months");
                        r.push({ text: `${++monthCount} Months` });
                    }
                }
                customKeyboardButtonArray.push(r);
            }
        }
        return await this.sendKeyboardMessage(customKeyboardButtonArray, telegram_chat_id, tenureOptionsDto.message, 2000);
    }

    private async sendKeyboardMessage(keyboardButtonArray: TelegramKeyboardButton[][], telegram_chat_id: string, message: string, waitInMilliSec?: number): Promise<any> {
        const customKeyboard: TelegramReplyKeyboardMarkup = { keyboard: keyboardButtonArray, one_time_keyboard: true, resize_keyboard: true };
        const data: TelegramSendMessageParams = {
            chat_id: telegram_chat_id,
            text: message,
            reply_markup: customKeyboard
        };
        this.log.log("telegram Keyboard message : " + JSON.stringify(data) + ` Delay time in millsec =${waitInMilliSec}`);
        if (!waitInMilliSec || waitInMilliSec == 0) {
            const observable = this.telegramService.sendMessage(data);
            observable.subscribe((res: any) => {
                this.log.log("observable res =" + JSON.stringify(res));
            });
        }
        else {
            this.sendTypingAction(telegram_chat_id);
            setTimeout(async () => {
                this.log.log("wokeup.. Sending Keyboard: " + JSON.stringify(data));
                const observable = this.telegramService.sendMessage(data);
                observable.subscribe((res: any) => {
                    this.log.log("observable res =" + JSON.stringify(res));
                });

            }, waitInMilliSec);
        }
        return { status: "success" }
    }

    async removeKeyboard(removeTelegramKeyboardDto: RemoveTelegramKeyboardDto) {
        const telegram_chat_id = await this.getTelegramChatId(removeTelegramKeyboardDto.sendpulse_user_id);
        const removeKeyboard: TelegramReplyKeyboardRemove = { remove_keyboard: true };
        const data: TelegramSendMessageParams = {
            chat_id: telegram_chat_id,
            reply_markup: removeKeyboard,
            text: removeTelegramKeyboardDto.message
        };
        this.log.log("Removing telegram Keyboard: " + JSON.stringify(data));
        this.telegramService.sendMessage(data);
    }

    private sendTypingAction(telegram_chat_id: string) {
        const typingAction: TelegramSendChatActionParams = { chat_id: telegram_chat_id, action: "typing" }
        this.telegramService.sendChatAction(typingAction);
    }

    async getTelegramChatId(sendpulseUserId: string): Promise<string> {
        const client = await this.clientService.findbySendpulseId(sendpulseUserId);

        if (client == null || client.telegram_id == null) {
            throw new dreamsException.DreamsException(dreamsException.DreamsCode.CLIENT_NOT_FOUND, "Client or Telegram ID not Found");
        }
        return client.telegram_id;
    }
}
