import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { GetTransactionDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Transaction } from '../entities/transaction.entity';
import { Repository } from 'typeorm';
import { GlobalService } from "../../../globals/usecases/global.service";

@Injectable()
export class TransactionService {
    private readonly logger = new CustomLogger(TransactionService.name);

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly globalService: GlobalService,
    ) { }

    async create(createTransactionDto: any): Promise<Transaction> {
        createTransactionDto.id = 'TN' + Math.floor(Math.random() * 100000000);
        this.logger.log(`Creating transaction with data ${JSON.stringify(createTransactionDto)}`);
        const transactionFromDb = await this.transactionRepository.save(createTransactionDto);
        return transactionFromDb;
    }

    async findOne(fields: GetTransactionDto): Promise<Transaction | null> {
        const transaction = await this.transactionRepository.findOne({
            where: fields,
            order: { ['created_at']: 'DESC' }
        });
        return transaction;
    }

    async find(fields: object): Promise<Array<Transaction> | null> {
        const transactions = await this.transactionRepository.find({
            where: fields
        });
        return transactions;
    }

    //FIXME:  Remove this function when repayment process removed from loan service
    async getTotalPaidAmount(loan_id: string): Promise<number> {
        const total_paid_amount = (await this.transactionRepository.find({
            where: { loan_id: loan_id, type: this.globalService.TRANSACTION_TYPE.PARTIAL_PAYMENT },
        })).reduce((acc, item) => acc = acc + item.amount, 0);
        return total_paid_amount;
    }

    public async getLoanTotalPaidAmount(loan_id: string): Promise<number> {
        const paid_amount =
            await this.transactionRepository.createQueryBuilder("transactions")
                .select("SUM(transactions.amount)", "total")
                .where("transactions.loan_id = :loan_id", { loan_id: loan_id })
                .andWhere("transactions.type = :type", { type: this.globalService.TRANSACTION_TYPE.PARTIAL_PAYMENT })
                .getRawOne();
        return paid_amount.total;
    }

}
