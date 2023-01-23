import { Injectable } from "@nestjs/common";
import { ProcessRepaymentDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../../loan/entities/loan.entity';
import { LoanService } from "../../loan/usecases/loan.service";
import { HandleRepaymentUsecase } from "./handle-repayment.usecase";
import { GlobalService } from "../../../globals/usecases/global.service";
import { HandleEqualRepaymentUsecase } from "./handle-equal-repayment.usecase";
import { HandleUnderRepaymentUsecase } from "./handle-under-repayment.usecase";
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { ZohoRepaymentHelperService } from "../services/zoho-repayment-helper.service";
import { ClientService } from "src/loan_management/client/usecases/client.service";
import { UpdateClientDto } from "src/loan_management/client/dto";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
@Injectable()
export class HandleOverRepaymentUsecase extends HandleRepaymentUsecase {
    private readonly logger = new CustomLogger(HandleOverRepaymentUsecase.name);

    constructor(
        public readonly loanService: LoanService,
        public readonly clientService: ClientService,
        public readonly globalService: GlobalService,
        public readonly transactionService: TransactionService,
        public readonly repaymentScheduleService: RepaymentScheduleService,
        public readonly zohoRepaymentHelperService: ZohoRepaymentHelperService,
        private readonly handleEqualPaymentUsecase: HandleEqualRepaymentUsecase,
        private readonly handleUnderRepaymentUsecase: HandleUnderRepaymentUsecase,
    ) {
        super(loanService, clientService, globalService, transactionService, repaymentScheduleService, zohoRepaymentHelperService);
    }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        while (processRepaymentDto.amount > 0) {
            const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
            if (!scheudle_instalment && processRepaymentDto.amount > 0) {
                // if NO schedule installment found & amount is extra    then store it in dream points. 
                await this.createOverPaymentTransaction(processRepaymentDto.amount, processRepaymentDto, loan);
                await this.addOverPayAmountInDreamPoints(processRepaymentDto.amount, processRepaymentDto, loan);
                processRepaymentDto.amount = 0;
            }
            else if (processRepaymentDto.amount >= scheudle_instalment.ins_overdue_amount) {
                const equalPaymentProcessDto = new ProcessRepaymentDto();
                equalPaymentProcessDto.loan_id = loan.id;
                equalPaymentProcessDto.amount = scheudle_instalment.ins_overdue_amount;
                equalPaymentProcessDto.image = processRepaymentDto.image;
                equalPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleEqualPaymentUsecase.process(equalPaymentProcessDto);
                processRepaymentDto.amount = processRepaymentDto.amount - scheudle_instalment.ins_overdue_amount;

            } else if (processRepaymentDto.amount < scheudle_instalment.ins_overdue_amount) {
                const underPaymentProcessDto = new ProcessRepaymentDto();
                underPaymentProcessDto.loan_id = loan.id;
                underPaymentProcessDto.amount = processRepaymentDto.amount;
                underPaymentProcessDto.image = processRepaymentDto.image;
                underPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleUnderRepaymentUsecase.process(underPaymentProcessDto);
                processRepaymentDto.amount = 0;
            }
        }
    }

    async createOverPaymentTransaction(over_pay_amount: number, processRepaymentDto: any, loan: Loan) {
        const createAdditionalFeeTxnDto = {
            loan_id: loan.id,
            amount: over_pay_amount,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.OVER_PAYMENT,
            note: processRepaymentDto.note,
        };
        await this.transactionService.create(createAdditionalFeeTxnDto);
    }

    async addOverPayAmountInDreamPoints(over_pay_amount: number, processRepaymentDto: ProcessRepaymentDto, loan: Loan) {
        const client = await this.clientService.findbyId(loan.client.id);
        const dream_point_earned = client.dream_points_earned + over_pay_amount;
        const updateClientDto = new UpdateClientDto()
        updateClientDto.id = client.id;
        updateClientDto.dream_points_earned = dream_point_earned;
        await this.clientService.update(updateClientDto);
        return;
    }
}
