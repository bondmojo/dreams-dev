import { Injectable } from "@nestjs/common";
import { DreamerRepository } from "../repository/dreamer.repository";
import { OnEvent } from "@nestjs/event-emitter";
import { KycEventDto, KYCStatus } from "../../../../shufti/dto/kyc-event.dto";
import { CustomLogger } from "../../../../../custom_logger";
import { SendpluseService } from "../../../../sendpulse/sendpluse.service";
import { GlobalService } from "../../../../../globals/usecases/global.service";

@Injectable()
export class KycCompletionUpdateUsecase {
        private readonly log = new CustomLogger(KycCompletionUpdateUsecase.name);
        constructor(private readonly repository: DreamerRepository, private readonly sendpulse: SendpluseService,
                private readonly globalService: GlobalService) { }

        @OnEvent('kyc.callback')
        async updateKycDetails(event: KycEventDto) {
                try {
                        const dreamer = await this.repository.getDreamer(event.dreamerId);

                        const validStatuses = ["None", "New", "Loan Requested"];
                        const status = dreamer.status.value;

                        this.log.log(`KYC Callback: Dreamer status =` + dreamer.status);
                        if (!status || validStatuses.includes(dreamer.status.value)) {
                                this.log.log(`KYC Callback Valid dreamer status ${status} for dreamer details =${dreamer.id} : updating zoho with details`);
                                await this.repository.updatekycDetails(event);
                                await this.sendpulse.runFlow(dreamer, this.globalService.SENDPULSE_FLOW.KYC_FLOW);
                        }
                        else {
                                this.log.error(`KYC Callback: Invalid dreamer status ${status} for dreamer details =` + dreamer.id);
                        }
                } catch (error) {
                        this.log.error(`DREAMER: ERROR OCCURED WHILE RUNNING updateKycDetails:  ${error}`);
                }
        }
}
