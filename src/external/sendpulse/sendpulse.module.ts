import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";
import {SendpluseService} from "./sendpluse.service";
import { SendpulseController } from './sendpulse.controller';


@Module({
    imports: [HttpModule],
    providers: [SendpluseService],
    exports: [SendpluseService],
    controllers: [SendpulseController]
})
export class SendpulseModule {

}
