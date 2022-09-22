import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { DisbursedLoanDto, GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { Repository } from 'typeorm';
import { LoanHelperService } from "./loan-helper.service";

@Injectable()
export class LoanService {
    private readonly log = new CustomLogger(LoanService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly loanHelperService: LoanHelperService,
    ) { }

    // FIXME: Remove "any" Decorator from createLoanDto object
    async create(createLoanDto: any): Promise<Loan> {
        createLoanDto.id = 'LN' + Math.floor(Math.random() * 100000000);
        createLoanDto.loan_fee = 3; // should be come from defines
        const loanFromDb = await this.loanRepository.save(createLoanDto);
        //create transaction for dream_point_commited in database
        await this.loanHelperService.createTransactionForDreamPointCommited(createLoanDto);
        await this.loanHelperService.updateClientCommittedDreamPoint(createLoanDto);
        return loanFromDb;
    }

    async findOne(fields: GetLoanDto): Promise<Loan | null> {
        const loan = await this.loanRepository.findOne({
            where: fields,
        });
        return loan;
    }

    async disbursed(disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        const loan = await this.findOne({ id: disbursedLoanDto.loan_id });
        if (!loan) {
            return;
        }
        await this.loanHelperService.createCreditDisbursementTransaction(loan, disbursedLoanDto);
        // create transaction
        return loan;
    }

}
