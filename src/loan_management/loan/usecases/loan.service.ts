import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { Repository, In, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { add, addDays, endOfDay, format } from "date-fns";


@Injectable()
export class LoanService {
    private readonly log = new CustomLogger(LoanService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
    ) { }

    // FIXME: Remove "any" Decorator from createLoanDto object
    async create(createLoanDto: any): Promise<Loan> {
        createLoanDto.id = 'LN' + Math.floor(Math.random() * 100000000);

        const loanFromDb = await this.loanRepository.save(createLoanDto);
        return loanFromDb;
    }

    async findOne(fields: GetLoanDto): Promise<Loan | null> {
        const loan = await this.loanRepository.findOne({
            where: fields,
        });
        return loan;
    }

}
