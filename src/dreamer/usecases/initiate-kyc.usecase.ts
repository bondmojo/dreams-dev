import {Injectable} from "@nestjs/common";
import {DreamerRepository} from "../repository/dreamer.repository";
import {InitiateKycResponseDto} from "./dto/initiate-kyc-response.dto";
import {ShuftiService} from "../../external/shufti/shufti.service";

@Injectable()
export class InitiateKycUsecase {
    constructor(private readonly repository: DreamerRepository, private readonly shuftiservice: ShuftiService) {}

    async initiate(dreamerId: string): Promise<InitiateKycResponseDto> {
        const kycId: string = dreamerId +'-'+ Date.now();
        const url: string = await this.shuftiservice.initiateKyc(dreamerId, kycId);
        await this.repository.saveKycInitialDetails(dreamerId, kycId);
        return {
            id: kycId,
            url,
        }
    }
}
