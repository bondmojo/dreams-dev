import { Injectable } from "@nestjs/common";
import { PaymentDetailsRequestDto } from "../dto/payment-details-request.dto";
import { DreamerRepository } from "../repository/dreamer.repository";

@Injectable()
export class UpdatePaymentDetailsUsecase {
    constructor(private readonly repository: DreamerRepository) { }

    async update(dreamerId: string, request: PaymentDetailsRequestDto): Promise<string> {
        return await this.repository.updatePaymentDetails(dreamerId, request);
    }
}
