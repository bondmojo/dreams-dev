
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { LoanModule } from "../loan/loan.module";
import { ClientController } from './client.controller';
import { Client } from './entities/client.entity';
import { ClientService } from './usecases/client.service';
import { DreamPointService } from './usecases/dream-point.service';
import { TransactionModule } from '../transaction/transaction.module';
@Module({
  imports: [forwardRef(() => LoanModule), TypeOrmModule.forFeature([Client]), SendpulseModule, TransactionModule],
  controllers: [ClientController],
  providers: [ClientService, DreamPointService],
  exports: [ClientService]
})
export class ClientModule { }
