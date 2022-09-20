import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { Repository } from 'typeorm';
import { TransactionService } from "../../transaction/usecases/transaction.service";

@Injectable()
export class LoanService {
    private readonly log = new CustomLogger(LoanService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly transactionService: TransactionService
    ) { }

    // FIXME: Remove "any" Decorator from createLoanDto object
    async create(createLoanDto: any): Promise<Loan> {
        createLoanDto.id = 'LN' + Math.floor(Math.random() * 100000000);
        const loanFromDb = await this.loanRepository.save(createLoanDto);

        //create transaction for dream_point_commited in database
        await this.createTransactionForDreamPointCommited(createLoanDto);
        return loanFromDb;
    }

    async findOne(fields: GetLoanDto): Promise<Loan | null> {
        const loan = await this.loanRepository.findOne({
            where: fields,
        });
        return loan;
    }


    async createTransactionForDreamPointCommited(createLoanDto: any): Promise<any> {
        const createTransactionDto = {
            loan_id: createLoanDto.id,
            amount: createLoanDto.dream_point,
            type: "dream_point_commitment", // should comes from defines
        };
        const transaction = await this.transactionService.create(createTransactionDto);
        return transaction;
    }

}
