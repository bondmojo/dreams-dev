import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from 'typeorm';
import { DisbursedLoanDto, CreateRepaymentTransactionDto } from '../dto';
import { GlobalService } from "../../../globals/usecases/global.service"
import { add } from 'date-fns';


@Injectable()
export class LoanHelperService {
    private readonly log = new CustomLogger(LoanHelperService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly transactionService: TransactionService,
        private eventEmitter: EventEmitter2,
        private readonly globalService: GlobalService
    ) { }

    async manageDreamPointCommitedAfterLoanCreation(createLoanDto: any): Promise<any> {
        const createTransactionDto = {
            loan_id: createLoanDto.id,
            amount: createLoanDto.dream_point,
            type: this.globalService.TRANSACTION_TYPE.DREAM_POINT_COMMITMENT,
        };
        const transaction = await this.transactionService.create(createTransactionDto);

        const updateClientDto = {
            id: createLoanDto.client_id,
            dream_points_committed: createLoanDto.dream_point,
        };
        this.eventEmitter.emit('client.update', updateClientDto);
        return transaction;
    }


    /** -----------------------   Disbursement helper functions     ---------------------------- */
    async createCreditDisbursementTransaction(loan: Loan, disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        const credit_disbursed_amount = loan.amount - loan.dream_point;
        const disbursementTransactionDto = {
            loan_id: loan.id,
            amount: credit_disbursed_amount,
            type: this.globalService.TRANSACTION_TYPE.CREDIT_DISBURSEMENT,
            note: disbursedLoanDto.note,
        }
        const transaction = await this.transactionService.create(disbursementTransactionDto);
        return transaction;
    }

    async checkAndCreateWingTransferFeeTransaction(loan: Loan, disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        // Verify this with Akash
        if (disbursedLoanDto?.wire_transfer_type == this.globalService.WIRE_TRANSFER_TYPES.MOBILE) {
            const disbursed_amount = loan.amount - loan.dream_point;
            const wing_wei_luy_transfer_fee = this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(disbursed_amount);
            const transactionDto = {
                loan_id: loan.id,
                amount: wing_wei_luy_transfer_fee,
                type: this.globalService.TRANSACTION_TYPE.DEBIT_WING_WEI_LUY_TRANSFER_FEE,
                note: disbursedLoanDto.note,
            }
            await this.transactionService.create(transactionDto);
        }
        return;
    }

    async updateLoanDataAfterDisbursement(loan: Loan, disbursedLoanDto: DisbursedLoanDto) {
        let wing_wei_luy_transfer_fee = 0;
        let outstanding_amount = loan.amount + loan.loan_fee;

        // if wire_transfer_type is mobile then calc wing_wei_luy_transfer_fee and add it into outstanding_amount
        if (disbursedLoanDto?.wire_transfer_type == this.globalService.WIRE_TRANSFER_TYPES.MOBILE) {
            const disbursed_amount = loan.amount - loan.dream_point;
            wing_wei_luy_transfer_fee = this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(disbursed_amount);
            outstanding_amount = outstanding_amount + wing_wei_luy_transfer_fee;
        }

        const tenure_in_months = loan.tenure_in_months ? loan.tenure_in_months : 1; // default one month tenure
        const today = new Date(); // current time
        const repayment_date = add(today, { months: tenure_in_months }); // today + tenure_in_months

        const fields_to_be_update: object = {
            wing_code: disbursedLoanDto.wing_code,
            outstanding_amount: outstanding_amount,
            wire_transfer_type: disbursedLoanDto?.wire_transfer_type,
            disbursed_date: today,
            repayment_date: repayment_date,
            status: this.globalService.LOAN_STATUS.DISBURSED,
            wing_wei_luy_transfer_fee: wing_wei_luy_transfer_fee,
        }

        this.log.log(`Updating loan with data ${JSON.stringify(fields_to_be_update)}`);
        await this.loanRepository.update(loan.id, fields_to_be_update);
        return;
    }

    /** -----------------------   Create Repayment Transaction functions     ---------------------------- */
    async handleClientCreditRepayments(createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        const creditRepaymentResponse = { status: true, error: '' };
        const loan = await this.loanRepository.findOne({
            where: { id: createRepaymentTransactionDto.loan_id },
            relations: ['client']
        });

        if (!loan || !createRepaymentTransactionDto.amount || loan.status != this.globalService.LOAN_STATUS.DISBURSED) {
            creditRepaymentResponse.status = false;
            return creditRepaymentResponse;
        }
        if (createRepaymentTransactionDto.amount > loan.outstanding_amount) {
            // Case: ammount is greater then due ammount
            creditRepaymentResponse.status = false;
            creditRepaymentResponse.error = 'Amount is greater then outstanding balance.';
            return creditRepaymentResponse;
        }

        if (createRepaymentTransactionDto.amount == loan.outstanding_amount) {
            // Case: of fully repaid
            await this.createPartialTransactionOnFullyPaid(loan, createRepaymentTransactionDto);
            await this.createCreditRepaymentTransaction(loan, createRepaymentTransactionDto);
            await this.createFeePaymentTransaction(loan, createRepaymentTransactionDto);
            await this.checkAndCreateCreditWingTransferFeeTransaction(loan, createRepaymentTransactionDto);
            await this.createDreamPointEarnedTransaction(loan, createRepaymentTransactionDto);
            await this.updateLoanAfterFullyPaid(loan, createRepaymentTransactionDto);
            await this.updateClientAfterFullyPaid(loan, createRepaymentTransactionDto);
        }
        else if (createRepaymentTransactionDto.amount < loan.outstanding_amount) {
            // Case: Partial payment
            await this.doProcessPartialPayment(loan, createRepaymentTransactionDto);
        }
        return creditRepaymentResponse;
    }

    async createCreditRepaymentTransaction(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        const credit_amount = loan.amount - loan.dream_point;
        const transactionDto = {
            loan_id: loan.id,
            amount: credit_amount,
            type: this.globalService.TRANSACTION_TYPE.CREDIT_REPAYMENT,
            note: createRepaymentTransactionDto.note,
        }
        const transaction = await this.transactionService.create(transactionDto);
        return transaction;
    }

    async createFeePaymentTransaction(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        const transactionDto = {
            loan_id: loan.id,
            amount: loan.loan_fee,
            type: this.globalService.TRANSACTION_TYPE.FEE_PAYMENT,
            note: createRepaymentTransactionDto.note,
        }
        const transaction = await this.transactionService.create(transactionDto);
        return transaction;
    }

    async checkAndCreateCreditWingTransferFeeTransaction(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        if (loan.wing_wei_luy_transfer_fee) {
            const transactionDto = {
                loan_id: loan.id,
                amount: loan.wing_wei_luy_transfer_fee,
                type: this.globalService.TRANSACTION_TYPE.CREDIT_WING_WEI_LUY_TRANSFER_FEE,
                note: createRepaymentTransactionDto.note,
            }
            const transaction = await this.transactionService.create(transactionDto);
            return transaction;
        }
    }

    async createDreamPointEarnedTransaction(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        const transactionDto = {
            loan_id: loan.id,
            amount: loan.dream_point,
            type: this.globalService.TRANSACTION_TYPE.DREAM_POINT_EARNED,
            note: createRepaymentTransactionDto.note,
        }
        const transaction = await this.transactionService.create(transactionDto);
        return transaction;
    }

    async updateLoanAfterFullyPaid(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        const today = new Date(); // current time
        const fields_to_be_update: object = {
            outstanding_amount: 0,
            paid_date: today,
            status: this.globalService.LOAN_STATUS.FULLY_PAID
        }

        this.log.log(`Updating loan after fully paid with data ${JSON.stringify(fields_to_be_update)}`);
        await this.loanRepository.update(loan.id, fields_to_be_update);
        return;
    }

    async updateClientAfterFullyPaid(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {

        const client_new_tier = +loan?.client?.tier + 1;
        const dream_point_earned = loan?.client?.dream_points_earned + loan?.dream_point;
        const dream_point_committed = loan?.client?.dream_points_committed - loan?.dream_point;

        if (dream_point_committed >= 0) {
            const updateClientDto = {
                id: loan?.client?.id,
                tier: client_new_tier,
                dream_points_earned: dream_point_earned,
                dream_points_committed: dream_point_committed
            };
            this.eventEmitter.emit('client.update', updateClientDto);
        }
        return;
    }

    async doProcessPartialPayment(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        // Create transaction for partial payment
        const transactionDto = {
            loan_id: loan.id,
            amount: createRepaymentTransactionDto.amount,
            type: this.globalService.TRANSACTION_TYPE.PARTIAL_PAYMENT,
            note: createRepaymentTransactionDto.note,
        }
        const transaction = await this.transactionService.create(transactionDto);

        // Update outstanding balance in loan record
        const outstanding_amount = loan.outstanding_amount - createRepaymentTransactionDto.amount;
        const fields_to_be_update: object = {
            outstanding_amount: outstanding_amount
        }
        this.log.log(`Updating loan outstandingvamount partial  with data ${JSON.stringify(fields_to_be_update)}`);
        await this.loanRepository.update(loan.id, fields_to_be_update);
        return transaction;
    }

    async createPartialTransactionOnFullyPaid(loan: Loan, createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        // Create transaction for partial payment
        const transactionDto = {
            loan_id: loan.id,
            amount: createRepaymentTransactionDto.amount,
            type: this.globalService.TRANSACTION_TYPE.PARTIAL_PAYMENT,
            note: createRepaymentTransactionDto.note,
        }
        const transaction = await this.transactionService.create(transactionDto);
        return transaction;
    }
}
