import {Injectable} from "@nestjs/common";
import {DreamerRepository} from "../repository/dreamer.repository";
import {OnEvent} from "@nestjs/event-emitter";
import {KycEventDto, KYCStatus} from "../../external/shufti/dto/kyc-event.dto";
import {CustomLogger} from "../../custom_logger";
import {SendpluseService} from "../../external/sendpulse/sendpluse.service";

@Injectable()
export class KycCompletionUpdateUsecase {
    private readonly log = new CustomLogger(KycCompletionUpdateUsecase.name);
    private readonly SUCCESS_FLOW = '62be938d81768640cc494f34';
    private readonly ERROR_FLOW = '62c7d5b918164b5bae13ae94';
    constructor(private readonly repository: DreamerRepository, private readonly sendpulse: SendpluseService) {}

    @OnEvent('kyc.callback')
    async updateKycDetails(event: KycEventDto){
        const dreamer = await this.repository.get(event.dreamerId);
        await this.repository.updatekycDetails(event);
        if(event.status == KYCStatus.SUCCESS) {
            await this.sendpulse.runFlow(dreamer, this.SUCCESS_FLOW);
        } else {
            await this.sendpulse.runFlow(dreamer, this.ERROR_FLOW);
        }
    }
}
