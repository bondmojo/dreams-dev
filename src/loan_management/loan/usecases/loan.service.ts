import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { Repository } from 'typeorm';
import { GetLoanResponse } from "../dto/get-loan-response.dto";

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

    async findOne(fields: GetLoanDto): Promise<GetLoanResponse |null>{
        const loan = await this.loanRepository.findOne({
            where: fields,
        });

        const loanResponse = new GetLoanResponse();
        if(!loan){
            loanResponse.status=false;
            return loanResponse
        }
        
        loanResponse.status=true;
        loanResponse.dreamPoints= ""+loan?.dream_point;
        loanResponse.loanAmount = ""+loan?.amount;
        loanResponse.wireTransferType = loan?.wire_transfer_type;
        loanResponse.loanStatus = loan?.status;
        loanResponse.dueDate= ""+ loan?.repayment_date;
        //FIXME: calculate balance
        loanResponse.outstandingBalance ="75";

        return loanResponse;
    }

}
