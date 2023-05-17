import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendpulseModule } from 'src/external/sendpulse/sendpulse.module';
import { LoanModule } from '../loan/loan.module';
import { ClientController } from './client.controller';
import { Client } from './entities/client.entity';
import { ClientService } from './usecases/client.service';
import { DreamPointService } from './usecases/dream-point.service';
import { TransactionModule } from '../transaction/transaction.module';
import { MembershipTierService } from './usecases/automations/membership-tier.service';
import { ClientSubscriber } from './subscribers/client.subscriber';
import { ZohoClientHelperService } from './usecases/zoho-client-helper.service';
import { DreamerModule } from 'src/external/zoho/dreams/dreamer.module';
@Module({
  imports: [
    forwardRef(() => LoanModule),
    TypeOrmModule.forFeature([Client]),
    forwardRef(() => DreamerModule),
    SendpulseModule,
    TransactionModule,
  ],
  controllers: [ClientController],
  providers: [
    ClientService,
    DreamPointService,
    MembershipTierService,
    ClientSubscriber,
    ZohoClientHelperService,
  ],
  exports: [ClientService],
})
export class ClientModule {}
