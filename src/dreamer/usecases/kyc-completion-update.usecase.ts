import { Injectable } from "@nestjs/common";
import { DreamerRepository } from "../repository/dreamer.repository";
import { OnEvent } from "@nestjs/event-emitter";
import { KycEventDto, KYCStatus } from "../../external/shufti/dto/kyc-event.dto";
import { CustomLogger } from "../../custom_logger";
import { SendpluseService } from "../../external/sendpulse/sendpluse.service";
import { GlobalService } from "../../globals/usecases/global.service";
import { threadId } from "worker_threads";


@Injectable()
export class KycCompletionUpdateUsecase {
    private readonly log = new CustomLogger(KycCompletionUpdateUsecase.name);
    constructor(private readonly repository: DreamerRepository, private readonly sendpulse: SendpluseService,
        private readonly globalService: GlobalService) { }

    @OnEvent('kyc.callback')
    async updateKycDetails(event: KycEventDto) {
        const dreamer = await this.repository.get(event.dreamerId);

        const validStatus = ["New", "Loan Requested"]
        if (!dreamer.status || validStatus.includes(dreamer.status)) {
            await this.repository.updatekycDetails(event);
            await this.sendpulse.runFlow(dreamer, this.globalService.SENDPULSE_FLOW.KYC_FLOW);
        }
        else {
            this.log.error(`Invalid Dreamer Status ${dreamer.status} for dreamer: ` + JSON.stringify(dreamer));
        }
    }
}
