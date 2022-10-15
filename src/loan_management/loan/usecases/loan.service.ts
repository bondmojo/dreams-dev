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

        // calculate outstanding balance & wing_wei_luy_transfer_fee
        createLoanDto.wing_wei_luy_transfer_fee = 0;
        createLoanDto.outstanding_amount = +createLoanDto.amount + +createLoanDto.loan_fee;
        // if wire_transfer_type is mobile then calc wing_wei_luy_transfer_fee and add it into outstanding_amount
        if (createLoanDto?.wire_transfer_type == this.globalService.WIRE_TRANSFER_TYPES.MOBILE) {
            const disbursed_amount = +createLoanDto.amount - +createLoanDto.dream_point;
            createLoanDto.wing_wei_luy_transfer_fee = +this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(disbursed_amount);
            createLoanDto.outstanding_amount = +createLoanDto.outstanding_amount + +createLoanDto.wing_wei_luy_transfer_fee;
        }
        const loanFromDb = await this.loanRepository.save(createLoanDto);
        //create transaction for dream_point_commited in database
        await this.loanHelperService.manageDreamPointCommitedAfterLoanCreation(createLoanDto);
        return loanFromDb;
    }

    async findOneForInternalUse(fields: object): Promise<any> {
        const loan = await this.loanRepository.findOne({
            where: fields,
            order: { ['created_at']: 'DESC' }
        });
        return loan;
    }

    async findOne(fields: GetLoanDto): Promise<GetLoanResponse | null> {
        const loan = await this.loanRepository.findOne({
            where: fields,
            relations: ['client']
        });
        this.log.log("LOAN DATA =" + JSON.stringify(loan));

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
        loanResponse.lastTransactionAmount = "" + await this.loanHelperService.getLoanLastPartialPaymentAmount(loan.id);
        loanResponse.dreamPointsEarned = "" + client?.dream_points_earned;
        loanResponse.nextLoanAmount = "" + this.globalService.TIER_AMOUNT[+client?.tier];
        return loanResponse;
    }

    async disbursed(disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        const disbursedResponse = { status: true };
        const loan = await this.loanRepository.findOne({
            where: { id: disbursedLoanDto.loan_id },
            relations: ['client']
        });

        if (!loan || loan.status != this.globalService.LOAN_STATUS.APPROVED) {
            disbursedResponse.status = false;
            return disbursedResponse;
        }
        await this.loanHelperService.createCreditDisbursementTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.checkAndCreateWingTransferFeeTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.updateLoanDataAfterDisbursement(loan, disbursedLoanDto);
        return disbursedResponse;
    }

    async createRepaymentTransaction(createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        if (createRepaymentTransactionDto.type == this.globalService.REPAYMENT_TRANSACTION_TYPE.CLIENT_CREDIT) {
            return await this.loanHelperService.handleClientCreditRepayments(createRepaymentTransactionDto);
        }

        if (createRepaymentTransactionDto.type == this.globalService.REPAYMENT_TRANSACTION_TYPE.DREAM_POINT_REFUND) {
            return await this.loanHelperService.handleDreamPointRefundRepayments(createRepaymentTransactionDto);
        }

        return false;
    }
}
