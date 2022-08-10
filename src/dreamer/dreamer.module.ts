import {Module} from "@nestjs/common";
import {DreamerController} from "./dreamer.controller";
import {CreateDreamerUsecase} from "./usecases/create-dreamer.usecase";
import {SendpulseModule} from "../external/sendpulse/sendpulse.module";
import {ZohoModule} from "../external/zoho/zoho.module";

@Module({
    imports: [SendpulseModule, ZohoModule],
    controllers: [DreamerController],
    providers: [CreateDreamerUsecase]
})
export class DreamerModule {
}
