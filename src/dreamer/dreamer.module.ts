import {Module} from "@nestjs/common";
import {DreamerController} from "./dreamer.controller";
import {CreateDreamerUsecase} from "./usecases/create-dreamer.usecase";
import {SendpulseModule} from "../external/sendpulse/sendpulse.module";
import {ZohoModule} from "../external/zoho/zoho.module";
import {DreamerRepository} from "./repository/dreamer.repository";
import {UpdatePaymentDetailsUsecase} from "./usecases/update-payment-details.usecase";

@Module({
    imports: [SendpulseModule, ZohoModule],
    controllers: [DreamerController],
    providers: [CreateDreamerUsecase, UpdatePaymentDetailsUsecase, DreamerRepository]
})
export class DreamerModule {
}
