import { Injectable } from "@nestjs/common";
import { DreamerRepository } from "../repository/dreamer.repository";
import { OnEvent } from "@nestjs/event-emitter";
import { KycEventDto, KYCStatus } from "../../external/shufti/dto/kyc-event.dto";
import { CustomLogger } from "../../custom_logger";
import { SendpluseService } from "../../external/sendpulse/sendpluse.service";
import { GlobalService } from "../../globals/usecases/global.service";
import { threadId } from "worker_threads";
import { DreamerModel } from "./model/dreamer.model";


@Injectable()
export class KycCompletionUpdateUsecase {
    private readonly log = new CustomLogger(KycCompletionUpdateUsecase.name);
    constructor(private readonly repository: DreamerRepository, private readonly sendpulse: SendpluseService,
        private readonly globalService: GlobalService) { }

    @OnEvent('kyc.callback')
    async updateKycDetails(event: KycEventDto) {
        const dreamer: DreamerModel = await this.repository.get(event.dreamerId);

        const validStatuses = ["None", "New", "Loan Requested"];
        const status = dreamer.status.value;
        if (!status || validStatuses.includes(dreamer.status.value)) {
            await this.repository.updatekycDetails(event);
            await this.sendpulse.runFlow(dreamer, this.globalService.SENDPULSE_FLOW.KYC_FLOW);
        }
        else {
            this.log.error(`Not Handling KYC Callback as: Invalid dreamer status ${status} for dreamer details =` + dreamer.id);
        }
    }
}
