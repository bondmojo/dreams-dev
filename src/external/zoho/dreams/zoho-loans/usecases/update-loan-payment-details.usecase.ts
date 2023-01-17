import { Injectable } from "@nestjs/common";
import { PaymentDetailsRequestDto } from "../dto/payment-details-request.dto";
import { ZohoLoanRepository } from "../repository/zoho-loan.repository";

@Injectable()
export class UpdateLoanPaymentDetailsUsecase {
    constructor(private readonly repository: ZohoLoanRepository) { }

    async update(dreamerId: string, request: PaymentDetailsRequestDto): Promise<string> {
        return await this.repository.updateLoanPaymentDetails(dreamerId, request);
    }
}
