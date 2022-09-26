import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { DisbursedLoanDto, GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { LoanHelperService } from "./loan-helper.service";
import { GlobalService } from "../../../globals/global.service"
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
        });
        this.log.log("LOAN DATA =" + loan);

        const loanResponse = new GetLoanResponse();
        if (!loan) {
            loanResponse.status = false;
            return loanResponse
        }

        loanResponse.status = true;
        loanResponse.dreamPoints = "" + loan?.dream_point;
        loanResponse.loanAmount = "" + loan?.amount;
        loanResponse.wireTransferType = loan?.wire_transfer_type;
        loanResponse.loanStatus = loan?.status;
        loanResponse.dueDate = "" + loan?.repayment_date;
        //FIXME: calculate balance
        loanResponse.outstandingBalance = "75";

        return loanResponse;
    }

    async disbursed(disbursedLoanDto: DisbursedLoanDto): Promise<Loan | undefined> {
        const loan = await this.loanRepository.findOneBy({
            id: disbursedLoanDto.loan_id,
        });
        if (!loan) {
            return;
        }
        await this.loanHelperService.createCreditDisbursementTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.checkAndCreateWingTransferFeeTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.updateLoanDataAfterDisbursement(loan, disbursedLoanDto);
        return loan;
    }

}
