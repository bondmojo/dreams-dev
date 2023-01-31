import { Module } from "@nestjs/common";
import { DreamerController } from "./dreamer.controller";
import { CreateDreamerUsecase } from "./dreamer/usecases/create-dreamer.usecase";
import { SendpulseModule } from "../../sendpulse/sendpulse.module";
import { ZohoModule } from "../core/zoho.module";
import { DreamerRepository } from "./dreamer/repository/dreamer.repository";
import { UpdatePaymentDetailsUsecase } from "./dreamer/usecases/update-payment-details.usecase";
import { UpdateAdditionalDetailsUsecase } from "./dreamer/usecases/update-additional-details.usecase";
import { ShuftiModule } from "../../shufti/shufti.module";
import { InitiateKycUsecase } from "./dreamer/usecases/initiate-kyc.usecase";
import { KycCompletionUpdateUsecase } from "./dreamer/usecases/kyc-completion-update.usecase";
import { GlobalModule } from "src/globals/global.module";
import { CreateZohoTaskUsecase } from "./task/create-zoho-task.usecase";
import { ClientModule } from "src/loan_management/client/client.module";
import { CreateLoanApplicationUsecase } from "./zoho-loans/usecases/create-loan-application.usecase";
import { DreamerLoanApplController } from "./dreamer.loanappl.controller";
import { UpdateFieldsOnZohoUsecase } from './utility/update-fields-on-zoho.usecase';
import { ZohoLoanRepository } from "./zoho-loans/repository/zoho-loan.repository";
import { ZohoTaskRepository } from "./task/zoho-task.repository";
import { UpdateLoanPaymentDetailsUsecase } from "./zoho-loans/usecases/update-loan-payment-details.usecase";
import { CreateZohoRepaymentScheduleUsecase } from "./repayment_schedule/create-repayment-schedule.usecase";
import { ZohoRepaymentScheduleRepository } from "./repayment_schedule/repayment-schedule.repository";
import { ZohoHelperService } from "./utility/zoho-helper.service";
import { ZohoTaskController } from "./zoho-task.controller";
@Module({
    imports: [SendpulseModule, ZohoModule, ShuftiModule, GlobalModule, ClientModule],
    controllers: [DreamerController, DreamerLoanApplController, ZohoTaskController],
    providers: [
        CreateDreamerUsecase,
        UpdatePaymentDetailsUsecase,
        UpdateAdditionalDetailsUsecase,
        CreateZohoTaskUsecase,
        InitiateKycUsecase,
        KycCompletionUpdateUsecase,
        DreamerRepository,
        ZohoTaskRepository,
        ZohoLoanRepository,
        ZohoRepaymentScheduleRepository,
        CreateLoanApplicationUsecase,
        UpdateLoanPaymentDetailsUsecase,
        UpdateFieldsOnZohoUsecase,
        CreateZohoTaskUsecase,
        CreateZohoRepaymentScheduleUsecase,
        ZohoHelperService
    ],
    exports: [CreateLoanApplicationUsecase, UpdateFieldsOnZohoUsecase, CreateZohoRepaymentScheduleUsecase]
})
export class DreamerModule {
}
