
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Client } from './entities/client.entity';
import { ClientController } from './client.controller';
import { ClientService } from './usecases/client.service';
import { LoanModule } from "../loan/loan.module";
@Module({
  imports: [LoanModule, TypeOrmModule.forFeature([Client])],
  controllers: [ClientController],
  providers: [
    ClientService]
})
export class ClientModule { }
