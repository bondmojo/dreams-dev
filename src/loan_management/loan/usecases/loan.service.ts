import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { DisbursedLoanDto, CreateRepaymentTransactionDto, GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { LoanHelperService } from "./loan-helper.service";
import { GlobalService } from "../../../globals/usecases/global.service"
import { GetLoanResponse } from "../dto/get-loan-response.dto";
import { Repository, In, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { add, addDays, endOfDay, format } from "date-fns";


@Injectable()
export class LoanService {
    private readonly log = new CustomLogger(LoanService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly loanHelperService: LoanHelperService,
        private readonly globalService: GlobalService
    ) { }

    // FIXME: Remove "any" Decorator from createLoanDto object
    async create(createLoanDto: any): Promise<Loan> {
        createLoanDto.id = 'LN' + Math.floor(Math.random() * 100000000);
        createLoanDto.loan_fee = this.globalService.LOAN_FEES;
        const loanFromDb = await this.loanRepository.save(createLoanDto);
        //create transaction for dream_point_commited in database
        await this.loanHelperService.createTransactionForDreamPointCommited(createLoanDto);
        await this.loanHelperService.updateClientCommittedDreamPoint(createLoanDto);
        return loanFromDb;
    }

    async findOne(fields: GetLoanDto): Promise<GetLoanResponse | null> {
        const loan = await this.loanRepository.findOne({
            where: fields,
            relations: ['client']
        });
        this.log.log("LOAN DATA =" + loan);

        const loanResponse = new GetLoanResponse();
        if (!loan) {
            loanResponse.status = false;
            return loanResponse
        }
        const client = loan?.client;
        loanResponse.status = true;
        loanResponse.dreamPoints = "" + (client?.dream_points_earned + client?.dream_points_committed);
        loanResponse.loanAmount = "" + (loan?.amount - loan?.dream_point);
        loanResponse.wireTransferType = loan?.wire_transfer_type;
        loanResponse.loanStatus = loan?.status;
        loanResponse.dueDate = "" + loan?.repayment_date;
        loanResponse.outstandingBalance = "" + loan?.outstanding_amount;
        loanResponse.membershipTier = client?.tier;

        return loanResponse;
    }

    async disbursed(disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        const disbursedResponse = { status: true };
        const loan = await this.loanRepository.findOne({
            where: { id: disbursedLoanDto.loan_id },
            relations: ['client']
        });

        if (!loan) {
            disbursedResponse.status = false;
            return disbursedResponse;
        }
        await this.loanHelperService.createCreditDisbursementTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.checkAndCreateWingTransferFeeTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.updateLoanDataAfterDisbursement(loan, disbursedLoanDto);
        return disbursedResponse;
    }

    async createRepaymentTransaction(createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        const creditRepaymentResponse = { status: true };
        const loan = await this.loanRepository.findOne({
            where: { id: createRepaymentTransactionDto.loan_id },
            relations: ['client']
        });

        if (!loan || !createRepaymentTransactionDto.amount) {
            creditRepaymentResponse.status = false;
            return creditRepaymentResponse;
        }
        if (createRepaymentTransactionDto.amount == loan.outstanding_amount) {
            // Case: of fully repaid
            await this.loanHelperService.createCreditRepaymentTransaction(loan, createRepaymentTransactionDto);
            await this.loanHelperService.createFeePaymentTransaction(loan, createRepaymentTransactionDto);
            await this.loanHelperService.checkAndCreateCreditWingTransferFeeTransaction(loan, createRepaymentTransactionDto);
            await this.loanHelperService.createDreamPointEarnedTransaction(loan, createRepaymentTransactionDto);
            await this.loanHelperService.updateLoanAfterFullyPaid(loan, createRepaymentTransactionDto);
            await this.loanHelperService.updateClientAfterFullyPaid(loan, createRepaymentTransactionDto);
        }
        else if (createRepaymentTransactionDto.amount < loan.outstanding_amount) {
            // Case: Partial payment
            await this.loanHelperService.doPartialPaymentProcess(loan, createRepaymentTransactionDto);
        }
        return creditRepaymentResponse;
    }

}
