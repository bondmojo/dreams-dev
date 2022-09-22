import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from 'typeorm';
import { DisbursedLoanDto } from '../dto';


@Injectable()
export class LoanHelperService {
    private readonly log = new CustomLogger(LoanHelperService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly transactionService: TransactionService,
        private eventEmitter: EventEmitter2
    ) { }

    async createTransactionForDreamPointCommited(createLoanDto: any): Promise<any> {
        const createTransactionDto = {
            loan_id: createLoanDto.id,
            amount: createLoanDto.dream_point,
            type: "dream_point_commitment", // should come from defines
        };
        const transaction = await this.transactionService.create(createTransactionDto);
        return transaction;
    }

    async updateClientCommittedDreamPoint(createLoanDto: any): Promise<any> {
        // this payload should contains only those fields which we need to update
        // FIXME:: always update dream_points not replace
        const updateClientDto = {
            id: createLoanDto.client_id,
            dream_points_committed: createLoanDto.dream_point,
        };
        this.eventEmitter.emit('client.update', updateClientDto);
    }

    async createCreditDisbursementTransaction(loan: Loan, disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        const credit_disbursed_amount = loan.amount - loan.dream_point;
        const disbursementTransactionDto = {
            loan_id: loan.id,
            amount: credit_disbursed_amount,
            type: 'credit_disbursement',
            note: disbursedLoanDto.note,
        }
        const transaction = await this.transactionService.create(disbursementTransactionDto);
        return transaction;
    }

}
