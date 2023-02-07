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
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
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
        public readonly sendpulseService: SendpluseService,
    ) {
        super(loanService, clientService, globalService, transactionService, repaymentScheduleService, zohoRepaymentHelperService, sendpulseService);
    }

    async process(processRepaymentDto: ProcessRepaymentDto): Promise<any> {
        const loan = await this.loanService.findOneForInternalUse({ id: processRepaymentDto.loan_id });
        this.createTransactions(processRepaymentDto, loan);

        while (processRepaymentDto.amount > 0) {
            const scheudle_instalment = await this.repaymentScheduleService.findOne({ loan_id: loan.id, scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED });
            // Do not create partial payment transaction in equal & under payment process as we are already creating it in overpayment usecase.
            const doCreatePartialPaymentTransaction = false;

            if (!scheudle_instalment && processRepaymentDto.amount > 0) {
                // if NO schedule installment found & amount is extra  then store it in dream points. 
                await this.handleExtraPayment(processRepaymentDto.amount, processRepaymentDto, loan);
                processRepaymentDto.amount = 0;
            }
            else if (processRepaymentDto.amount >= scheudle_instalment.ins_overdue_amount) {
                const equalPaymentProcessDto = new ProcessRepaymentDto();
                equalPaymentProcessDto.loan_id = loan.id;
                equalPaymentProcessDto.amount = scheudle_instalment.ins_overdue_amount;
                equalPaymentProcessDto.image = processRepaymentDto.image;
                equalPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleEqualPaymentUsecase.process(equalPaymentProcessDto, doCreatePartialPaymentTransaction);
                processRepaymentDto.amount = processRepaymentDto.amount - scheudle_instalment.ins_overdue_amount;

            } else if (processRepaymentDto.amount < scheudle_instalment.ins_overdue_amount) {
                const underPaymentProcessDto = new ProcessRepaymentDto();
                underPaymentProcessDto.loan_id = loan.id;
                underPaymentProcessDto.amount = processRepaymentDto.amount;
                underPaymentProcessDto.image = processRepaymentDto.image;
                underPaymentProcessDto.note = processRepaymentDto.note;
                await this.handleUnderRepaymentUsecase.process(underPaymentProcessDto, doCreatePartialPaymentTransaction);
                processRepaymentDto.amount = 0;
            }
        }
    }

    async handleExtraPayment(extra_amount: number, processRepaymentDto: any, loan: Loan) {
        await this.createExtraPaymentTransactions(extra_amount, processRepaymentDto, loan);
        await this.addExtraAmountInDreamPoints(extra_amount, processRepaymentDto, loan);
    }

    async createExtraPaymentTransactions(extra_amount: number, processRepaymentDto: any, loan: Loan) {
        const createAdditionalFeeTxnDto = {
            loan_id: loan.id,
            amount: extra_amount,
            client_id: loan.client_id,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.OVER_PAYMENT,
            note: processRepaymentDto.note,
        };
        await this.transactionService.create(createAdditionalFeeTxnDto);
    }

    async addExtraAmountInDreamPoints(extra_amount: number, processRepaymentDto: ProcessRepaymentDto, loan: Loan) {
        // Create Dream Point Earned Transaction
        const createAdditionalFeeTxnDto = {
            loan_id: loan.id,
            amount: extra_amount,
            client_id: loan.client_id,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.DREAM_POINT_EARNED,
            note: processRepaymentDto.note,
        };
        await this.transactionService.create(createAdditionalFeeTxnDto);

        // Added Extra Amount in Client Dream Points
        const client = await this.clientService.findbyId(loan.client.id);
        const dream_point_earned = client.dream_points_earned + extra_amount;
        const updateClientDto = new UpdateClientDto()
        updateClientDto.id = client.id;
        updateClientDto.dream_points_earned = dream_point_earned;
        await this.clientService.update(updateClientDto);
        return;
    }

    async createTransactions(processRepaymentDto: any, loan: Loan) {
        // Partial Paid Transaction
        // It doesn't have instalment_id as it's not a part of any instalment
        const createPartialPaidTxnDto = {
            loan_id: processRepaymentDto.loan_id,
            client_id: loan.client_id,
            amount: processRepaymentDto.amount,
            image: processRepaymentDto.image,
            type: this.globalService.INSTALMENT_TRANSACTION_TYPE.PARTIAL_PAYMENT,
        };
        await this.transactionService.create(createPartialPaidTxnDto);
    }
}
