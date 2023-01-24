import { CalculationResultDto } from "./calculation-result.dto";

export class CalculateLoanResultDto extends CalculationResultDto {
    paymentDate: string
    payableAmount: string
    receivableAmount: string
    fee: string
    maxTenure: string;
    tenureType: string;
}
