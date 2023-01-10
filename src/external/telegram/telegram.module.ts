import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { GlobalModule } from "src/globals/global.module";
import { TelegramModule } from "nestjs-telegram";
import { CustomTelegramService } from "./telegram.service";
import { TelegramController } from "./telegram.controller";
import { CustomLogger } from "src/custom_logger";

@Module({
    imports: [HttpModule, GlobalModule, TelegramModule.forRoot({
        botKey: process.env.TELEGRAM_BOT_ID
    })],
    controllers: [TelegramController],
    providers: [CustomTelegramService],
    exports: [CustomTelegramService]
})
export class CustomTelegramModule {

    private readonly customLogger = new CustomLogger(CustomTelegramModule.name);


    constructor() {
        this.customLogger.log("Initializing Telegram Module");
    }

}
