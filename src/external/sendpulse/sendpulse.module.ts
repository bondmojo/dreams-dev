import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";
import {SendpluseService} from "./sendpluse.service";

@Module({
    imports: [HttpModule],
    providers: [SendpluseService],
    exports: [SendpluseService]
})
export class SendpulseModule {

}
