import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { CustomLogger } from 'src/custom_logger';
import { Loan } from '../entities/loan.entity';
import { Repository, In, Between } from 'typeorm';
import { addDays, differenceInDays } from "date-fns";
import { ClientReminderModel } from './reminder.model';
import { ClientService } from '../../client/usecases/client.service';
import { Client } from 'src/loan_management/client/entities/client.entity';


@Injectable()
export class PaymentReminderService {
  private readonly log = new CustomLogger(PaymentReminderService.name);
  
  constructor(
    @InjectRepository(Loan) 
    private readonly loanRepository: Repository<Loan>, 
    private readonly clientService: ClientService
    ) { }

@Cron('4 * * * * *')
async morningTimeScheduler(){
  await this.runPaymentScheduler();
}

@Cron('34 * * * * *')
async dayTimeScheduler(){
  await this.runPaymentScheduler();
}

async runPaymentScheduler() {
    const now =new Date();

    const today =  new Date(now.getFullYear(),now.getMonth(), now.getDate() ) ;
    const next23Days =addDays(today, 23);
    const next16Days =addDays(today, 16);
    const next9Days =addDays(today, 9);
    const next2Days =addDays(today, 2);

    const loansPromise = await this.loanRepository.findBy({
       repayment_date: In ([today, next23Days, next16Days, next9Days, next2Days]) 
    });
    this.log.log("repayment_dateloans=" +JSON.stringify(loansPromise));

    if(loansPromise && loansPromise.length >0){
      loansPromise.forEach(loan => {
         const reminderModel =this.populateReminderModel(loan, today);
         this.log.log("REMINDER MODEL ="+ JSON.stringify(reminderModel));
      });

    }
}

populateReminderModel(loan : Loan, today: Date): ClientReminderModel{
  const reminderModel = new ClientReminderModel();
  reminderModel.client_id=loan.client_id;
  reminderModel.loan_id=loan.id;
  reminderModel.loan_amount= ""+loan.amount;
  
  const repayDate= new Date(loan.repayment_date);
  const dueDays = differenceInDays(repayDate, today);
  this.log.log("Due Days = "+ dueDays);
  reminderModel.due_days= "" + dueDays;

  reminderModel.remaining_amount= "" + this.calculateRemainingLoanAmount(loan.id, loan.amount);
  
  const clientPromise =this.getClientData(loan.client_id);
  clientPromise.then( function (client) {
    reminderModel.sendpulse_id=client?.sendpulse_id;
    reminderModel.last_name=client?.last;
  });

  return reminderModel;
}

calculateRemainingLoanAmount(loanId: string, loanAmount: number): number{
//TODO
  return (loanAmount-0);
}

getClientData(clientId: string) : Promise<Client | null>{

  const client = this.clientService.findbyId(clientId);
  console.log(" client data ="+ JSON.stringify(client));
  return client;
}

}
