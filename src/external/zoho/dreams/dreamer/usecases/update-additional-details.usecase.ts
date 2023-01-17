import {Injectable} from "@nestjs/common";
import {DreamerRepository} from "../repository/dreamer.repository";
import {AdditionalDetailsRequestDto} from "../dto/additional-details-request.dto";

@Injectable()
export class UpdateAdditionalDetailsUsecase {
    constructor(private readonly repository: DreamerRepository) {}

    async update(dreamerId: string, dto: AdditionalDetailsRequestDto): Promise<string> {
        return await this.repository.updateAdditionalDetails(dreamerId, dto);
    }
}
