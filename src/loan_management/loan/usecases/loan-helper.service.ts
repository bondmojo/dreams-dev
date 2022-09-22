import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from 'typeorm';
import { DisbursedLoanDto } from '../dto';
import { GlobalService } from "../../../globals/global.service"


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

    async createTransactionForDreamPointCommited(createLoanDto: any): Promise<any> {
        const createTransactionDto = {
            loan_id: createLoanDto.id,
            amount: createLoanDto.dream_point,
            type: this.globalService.TRANSACTION_TYPE.DREAM_POINT_COMMITMENT,
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

}
