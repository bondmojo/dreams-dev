import { Injectable } from "@nestjs/common";
import { CalculationDto } from "./dto/calculation.dto";
import { CalculationResultDto } from "./dto/calculation-result.dto";
import { CustomLogger } from "../../custom_logger";
import { CalculateLoanDto } from "./dto/calculate-loan.dto";
import { CalculateLoanResultDto } from "./dto/calculate-loan-result.dto";
import { format, add, addMonths } from 'date-fns'
import { GlobalService } from "src/globals/usecases/global.service";
import { DreamsCode, DreamsException } from "src/config/dreams-exception";
import CalculateRepaymentScheduleDto from "./dto/calculate-repayment-schedule.dto";
import { gl } from "date-fns/locale";
import RepaymentScheduleDto from "./dto/repayment-schedule.dto";

@Injectable()
export class SendpulseHelperService {
    private readonly FEES: number = 3;
    private readonly LOAN_DEFAULT_TENURE: number = 1;
    private readonly log = new CustomLogger(SendpulseHelperService.name);

    constructor(private readonly globalService: GlobalService) {
        //this.log.log("repayment schedule str=" + globalService.en.getString('repayment_schedule'));
    }

    calculateLoan(calculateLoanDto: CalculateLoanDto): CalculateLoanResultDto {
        const result = new CalculateLoanResultDto();
        try {
            const amount = parseInt(calculateLoanDto.amount);
            const dreamsPoint = parseInt(calculateLoanDto.dreamPoints);
            const tenure = parseInt(calculateLoanDto.tenure);
            const tenure_type = calculateLoanDto.tenure_type;
            const wing_transfer_fee = calculateLoanDto.wing_transfer_fee;

            if (tenure_type != this.globalService.LOAN_TENURE_TYPE['MONTHLY']) {
                throw new DreamsException(DreamsCode.INVALID_DATA, "Tenure Type implementation required");
            }
            result.fee = ((this.globalService.INSTALMENT_MEMBERSHIP_FEE * tenure)).toString();
            result.payableAmount = (amount + Number(result.fee) + Number(wing_transfer_fee)).toString();
            result.receivableAmount = (amount - dreamsPoint).toString();
            result.is_success = "true";
            const date = new Date();
            const payday = add(date, { months: Number(tenure) });;
            result.paymentDate = format(payday, 'dd-MM-yyyy');
            result.maxTenure = this.globalService.CLACULATE_MAX_TENURE({ amount });
            result.tenureType = this.globalService.LOAN_TENURE_TYPE.MONTHLY;
            return result;
        } catch (ex) {
            /*             result.is_success = "false";
                        result.message = ex;
                        return result;
             */
            throw ex;
        }
    }

    caclulateRepaymentSchedule(calculateRepaymentScheduleDto: CalculateRepaymentScheduleDto): RepaymentScheduleDto[] {
        try {
            let tenure = Number(calculateRepaymentScheduleDto.loan_tenure);
            const wing_wei_luy_transfer_fee = Number(calculateRepaymentScheduleDto.wing_wei_luy_transfer_fee) ?? 0;
            const loan_amount = Number(calculateRepaymentScheduleDto.loan_amount) + wing_wei_luy_transfer_fee;
            if (tenure == null || tenure == 0) {
                tenure = 1;
            }

            const repaymentScheduleArray: RepaymentScheduleDto[] = [];
            for (let i = 0; i < tenure; i++) {
                const repaymentScheduleDto = new RepaymentScheduleDto();
                repaymentScheduleDto.ins_number = i + 1;
                let principal_amount = Math.floor(loan_amount / tenure);
                //add remainder amount in last instalment.
                if (i == tenure - 1) {
                    principal_amount += loan_amount % tenure;
                }
                repaymentScheduleDto.ins_overdue_amount = Number((principal_amount + this.globalService.INSTALMENT_MEMBERSHIP_FEE).toFixed(2));
                const now = new Date();
                repaymentScheduleDto.due_date = format(addMonths(now, repaymentScheduleDto.ins_number), 'dd-MM-yyyy');
                repaymentScheduleDto.currency = calculateRepaymentScheduleDto.currency;
                repaymentScheduleArray.push(repaymentScheduleDto);
            }

            this.log.debug("Repayment Schedule Plan =" + JSON.stringify(repaymentScheduleArray));
            return repaymentScheduleArray;
        }
        catch (error) {
            this.log.error(`Error in Repayment Schedule Creation ${error}`);
            throw new DreamsException(DreamsCode.UNKNOWN_ERROR, `Error in Repayment Schedule Creation ${error}`);
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
                throw new DreamsException(DreamsCode.PAUSE_SENDPULSE_FLOW_ERROR, "CALCULATION FAILED");
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
        number = number.replace(/[^0-9]/g, '');
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

    getRepaymentScheduleMessage(ln: string, repaymentScheduleDto: RepaymentScheduleDto[]) {
        let repaymentMsgTemplate: string;
        let repaymentMsgString: string = "";

        if (ln == 'kh') {
            repaymentMsgTemplate = this.globalService.kh.getString('repayment_schedule');
        }
        else {
            repaymentMsgTemplate = this.globalService.en.getString('repayment_schedule');
        }

        if (repaymentScheduleDto != null && repaymentScheduleDto.length > 0) {

            repaymentScheduleDto.forEach((schedule) => {
                const currency = schedule.currency;
                const ins_amount = schedule.ins_overdue_amount;
                const ins_date = schedule.due_date;

                repaymentMsgString += eval(`\`${repaymentMsgTemplate}\``);
                this.log.log("evaluated string = " + repaymentMsgString);
            });
        }
        return repaymentMsgString;
    }
}
