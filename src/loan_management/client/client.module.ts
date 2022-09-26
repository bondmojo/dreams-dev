
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientController } from './client.controller';
import { ClientService } from './usecases/client.service';
import { LoanModule } from "../loan/loan.module";
@Module({
  imports: [forwardRef(() =>LoanModule), TypeOrmModule.forFeature([Client])],
  controllers: [ClientController],
  providers: [ClientService],
    exports: [ClientService]
})
export class ClientModule { }
