
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './usecases/loan.service';
import { LoanHelperService } from './usecases/loan-helper.service';

import { TransactionModule } from "../transaction/transaction.module";

@Module({
  imports: [TransactionModule, TypeOrmModule.forFeature([Loan])],
  controllers: [LoanController],
  providers: [
    LoanService, LoanHelperService],
  exports: [LoanService, LoanHelperService]
})
export class LoanModule { }
