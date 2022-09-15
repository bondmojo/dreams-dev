
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './usecases/loan.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan])],
  controllers: [LoanController],
  providers: [
    LoanService],
  exports: [LoanService]
})
export class LoanModule { }
