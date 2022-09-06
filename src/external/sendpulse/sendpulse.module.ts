import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SendpluseService } from "./sendpluse.service";
import { SendpulseController } from './sendpulse.controller';
import { SendpulseHelperService } from "./sendpulse-helper.service";


@Module({
    imports: [HttpModule],
    providers: [SendpluseService, SendpulseHelperService],
    exports: [SendpluseService],
    controllers: [SendpulseController]
})
export class SendpulseModule {

}
