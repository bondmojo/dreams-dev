import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { GetTransactionDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Transaction } from '../entities/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionService {
    private readonly log = new CustomLogger(TransactionService.name);
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) { }

    async create(createTransactionDto: any): Promise<Transaction> {
        createTransactionDto.id = 'TN' + Math.floor(Math.random() * 100000000);
        const transactionFromDb = await this.transactionRepository.save(createTransactionDto);
        return transactionFromDb;
    }

    async findOne(fields: GetTransactionDto): Promise<Transaction | null> {
        const transaction = await this.transactionRepository.findOne({
            where: fields,
        });
        return transaction;
    }

}
