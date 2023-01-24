import { Injectable } from "@nestjs/common";
import { CalculationDto } from "./dto/calculation.dto";
import { CalculationResultDto } from "./dto/calculation-result.dto";
import { CustomLogger } from "../../custom_logger";
import { CalculateLoanDto } from "./dto/calculate-loan.dto";
import { CalculateLoanResultDto } from "./dto/calculate-loan-result.dto";
import { format, add } from 'date-fns'
import { GlobalService } from "src/globals/usecases/global.service";

@Injectable()
export class SendpulseHelperService {
    private readonly FEES: number = 3;
    private readonly LOAN_CYCLE: number = 30;
    private readonly log = new CustomLogger(SendpulseHelperService.name);

    constructor(private readonly globalService: GlobalService) {

    }

    calculateLoan(calculateLoanDto: CalculateLoanDto): CalculateLoanResultDto {
        const result = new CalculateLoanResultDto();
        try {
            const amount = parseInt(calculateLoanDto.amount);
            const dreamsPoint = parseInt(calculateLoanDto.dreamPoints);
            result.payableAmount = (amount + this.FEES).toString();
            result.receivableAmount = (amount - dreamsPoint).toString();
            result.fee = this.FEES.toString();
            result.is_success = "true";
            const date = new Date();
            const payday = add(date, { days: this.LOAN_CYCLE });
            result.paymentDate = format(payday, 'dd-MM-yyyy');
            result.maxTenure = this.globalService.CLACULATE_TENURE(amount);
            result.tenureType = this.globalService.LOAN_TENURE_TYPE.MONTHLY;
            return result;
        } catch (ex) {
            result.is_success = "false";
            result.message = ex;
            return result;
        }
    }

    calculate(calculateDto: CalculationDto): CalculationResultDto {
        switch (calculateDto.operation_type) {
            case "eval":
                return this.evaluateOperation(calculateDto);
            case "range":
                return this.rangeOperation(calculateDto);
            case "strlen":
                return this.strlenOperation(calculateDto);
            default:
                return {
                    is_success: "false",
                    message: calculateDto.message
                }

        }
    }

    private strlenOperation(calculateDto: CalculationDto) {
        calculateDto.value = `"${calculateDto.value}".length >= ${calculateDto.min} && "${calculateDto.value}".length <= ${calculateDto.max}`;
        const result = this.evaluateOperation(calculateDto);
        if (result.is_success === "true" && !result.message) {
            result.message = calculateDto.message;
            result.is_success = "false"
        }
        return result;
    }

    private rangeOperation(calculateDto: CalculationDto): CalculationResultDto {
        calculateDto.value = `${calculateDto.value} >= ${calculateDto.min} && ${calculateDto.value} <= ${calculateDto.max}`;
        const result = this.evaluateOperation(calculateDto);
        if (result.is_success === "true" && !result.message) {
            result.message = calculateDto.message;
            result.is_success = "false"
        }
        return result;
    }

    private evaluateOperation(calculateDto: CalculationDto): CalculationResultDto {
        this.log.log("Executing operation value " + calculateDto.value);
        try {
            return {
                is_success: "true",
                message: eval(calculateDto.value)
            }
        } catch (ex) {
            this.log.log(`Failed to evaluate the expression ${ex}`);
            return {
                is_success: "false",
                message: calculateDto.message
            }
        }
    }

    convertToRomanNumber(number: string): string {
        // convert khmer to roman number 
        number = number.replace(/០/g, "0");
        number = number.replace(/១/g, "1");
        number = number.replace(/២/g, "2");
        number = number.replace(/៣/g, "3");
        number = number.replace(/៤/g, "4");
        number = number.replace(/៥/g, "5");
        number = number.replace(/៦/g, "6");
        number = number.replace(/៧/g, "7");
        number = number.replace(/៨/g, "8");
        number = number.replace(/៩/g, "9");
        // Remove other characters from string
        number = number.replace(/[^0-9-]/g, '');
        return number;
    }

    convertToKhmerNumber(number: string): string {
        // convert khmer to roman number 
        number = number.replace(/0/g, "០");
        number = number.replace(/1/g, "១");
        number = number.replace(/2/g, "២");
        number = number.replace(/3/g, "៣");
        number = number.replace(/4/g, "៤");
        number = number.replace(/5/g, "៥");
        number = number.replace(/6/g, "៦");
        number = number.replace(/7/g, "៧");
        number = number.replace(/8/g, "៨");
        number = number.replace(/9/g, "៩");
        // Remove other characters from string
        number = number.replace(/[^០១២៣៤៥៦៧៨៩]/g, '');
        return number;
    }
}
