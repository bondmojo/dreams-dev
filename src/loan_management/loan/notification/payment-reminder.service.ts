import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { CustomLogger } from 'src/custom_logger';
import { Loan } from '../entities/loan.entity';
import { Repository, Not, LessThan } from 'typeorm';
import { addDays, differenceInDays } from "date-fns";
import { ClientReminderModel } from './reminder.model';
import { ClientService } from '../../client/usecases/client.service';
import { Client } from 'src/loan_management/client/entities/client.entity';
import { SendpluseService } from 'src/external/sendpulse/sendpluse.service';
import { RunFlowModel } from 'src/external/sendpulse/model/run-flow-model';
import { GetClientDto } from 'src/loan_management/client/dto';


@Injectable()
export class PaymentReminderService {
  private readonly log = new CustomLogger(PaymentReminderService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly clientService: ClientService,
    private readonly sendpulseService: SendpluseService
  ) { }

  async runCronApis(id: number) {
    if (id == 1) {
      this.log.log("Running 9AM scheduler");
      await this.runPaymentScheduler(true);
    } else {
      this.log.log("Running 2PM scheduler");
      await this.runPaymentScheduler(false);
    }
  }

  @Cron('0 16 * * *')
  async morningTimeScheduler() {
    await this.runPaymentScheduler(true);
  }

  @Cron('0 21 * * *')
  async dayTimeScheduler() {
    await this.runPaymentScheduler(false);
  }

  async runPaymentScheduler(isMorning: boolean) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (isMorning) {
      await this.sendNotification(now, today, 23, isMorning);
      await this.sendNotification(now, today, 16, isMorning);
      await this.sendNotification(now, today, 9, isMorning);
      await this.sendNotification(now, today, 2, isMorning);
      await this.sendNotification(now, today, 1, isMorning);

      await this.sendNotification(now, today, 0, isMorning);
      await this.sendNotification(now, today, -1, isMorning);
      await this.sendNotification(now, today, -2, isMorning);
      await this.sendNotification(now, today, -3, isMorning);
    }
    else {
      await this.sendNotification(now, today, 0, isMorning);
      await this.sendNotification(now, today, -1, isMorning);
      await this.sendNotification(now, today, -2, isMorning);
      await this.sendNotification(now, today, -3, isMorning);
      //If value is less than 3 scheduler sends notification to all remaining customers with date less than -3
      await this.sendNotification(now, today, -4, isMorning);

    }

  }

  async sendNotification(now: Date, today: Date, remainingDays: number, isMorning: boolean) {

    if (isMorning)
      this.log.log("Running MORNING Schedule for remaining Days =" + remainingDays);
    else
      this.log.log("Running DAY Schedule for remaining Days =" + remainingDays);

    let loansPromise;

    if (remainingDays >= -3) {
      const remaining_days = addDays(today, remainingDays);
      loansPromise = await this.fetchCustomersByDueDate(remaining_days);
    }
    else {
      const remaining_days = addDays(today, remainingDays + 1);
      loansPromise = await this.fetchOlderCustomers(remaining_days);
    }

    if (!loansPromise || loansPromise.length == 0) {
      this.log.log("NO Customer Reminder to be sent");
      return;
    }

    loansPromise.forEach(loan => {

      const sendpulseId = loan.client.sendpulse_id;
      if (sendpulseId) {
        let flow = new RunFlowModel();
        this.log.log("sendNotification ->sendpulse ID =" + sendpulseId);
        flow.contact_id = sendpulseId;
        flow.external_data = {};
        switch (remainingDays) {
          case 23:
            flow.flow_id = "632c3a3f8de7ab098c2673d9";
            break;
          case 16:
            flow.flow_id = "632c3d8e123ab83d924cddc8";
            break;
          case 9:
            flow.flow_id = "632c3f04c54feb769e5a4082";
            break;
          case 2:
            flow.flow_id = "632c40021f206771792caf37";
            break;
          case 1:
            flow.flow_id = "632c407d02efd900e2548dab";
            break;
          case 0:
            if (isMorning)
              flow.flow_id = "632c44a770b9686d4b564a39";
            else
              flow.flow_id = "632c44d8b14ebd4e7c09fd99";
            break;
          case -1:
            if (isMorning)
              flow.flow_id = "632c5a35415c9d1596763aa1";
            else
              flow.flow_id = "632c5c685033365c2a07a378";
            break;
          case -2:
            if (isMorning)
              flow.flow_id = "632c5cf8ffd93d3a4168adb0";
            else
              flow.flow_id = "632c5e8d5315aa0ef11404f5";
            break;
          case -3:
            if (isMorning)
              flow.flow_id = "632c5f2e48a0b42b26095073";
            else
              flow.flow_id = "632c615064d2872411413292";
            break;
          default:
            //FIXME: update flow ID
            if (remainingDays < -3)
              flow.flow_id = "632c615064d2872411413292";
            break;
        }
        this.sendpulseService.runFlowV2(flow);
      }
    });
  }

  async fetchCustomersByDueDate(dueDate: Date): Promise<Loan[] | null> {
    this.log.log("FETCHing Clients with Due date =" + dueDate);
    let loanPromise = await this.loanRepository.find({
      where: { repayment_date: dueDate, status: Not("Paid") },
      relations: ['client']
    });
    this.log.log("repayment_date loans=" + JSON.stringify(loanPromise));
    return loanPromise;
  }

  async fetchOlderCustomers(dueDate: Date): Promise<Loan[] | null> {
    this.log.log("FETCHing Older Customers with Due date less than =" + dueDate);
    let loanPromise = await this.loanRepository.find({
      where: { repayment_date: LessThan(dueDate), status: Not("Paid") },
      relations: ['client']
    });
    this.log.log("OLDER CUSTOMER loans=" + JSON.stringify(loanPromise));
    return loanPromise;
  }
}
