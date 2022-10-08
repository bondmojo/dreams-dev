import { Module } from "@nestjs/common";
import { DreamerController } from "./dreamer.controller";
import { CreateDreamerUsecase } from "./usecases/create-dreamer.usecase";
import { SendpulseModule } from "../external/sendpulse/sendpulse.module";
import { ZohoModule } from "../external/zoho/zoho.module";
import { DreamerRepository } from "./repository/dreamer.repository";
import { UpdatePaymentDetailsUsecase } from "./usecases/update-payment-details.usecase";
import { UpdateAdditionalDetailsUsecase } from "./usecases/update-additional-details.usecase";
import { ShuftiModule } from "../external/shufti/shufti.module";
import { InitiateKycUsecase } from "./usecases/initiate-kyc.usecase";
import { KycCompletionUpdateUsecase } from "./usecases/kyc-completion-update.usecase";
import { GlobalModule } from "src/globals/global.module";
import { CreateZohoTaskUsecase } from "./usecases/create-zoho-task.usecase";
import { ClientModule } from "src/loan_management/client/client.module";
@Module({
    imports: [SendpulseModule, ZohoModule, ShuftiModule, GlobalModule, ClientModule],
    controllers: [DreamerController],
    providers: [
        CreateDreamerUsecase,
        UpdatePaymentDetailsUsecase,
        UpdateAdditionalDetailsUsecase,
        CreateZohoTaskUsecase,
        InitiateKycUsecase,
        KycCompletionUpdateUsecase,
        DreamerRepository]
})
export class DreamerModule {
}
