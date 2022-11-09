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
import { GlobalService } from "../../../globals/usecases/global.service";



@Injectable()
export class PaymentReminderService {
  private readonly log = new CustomLogger(PaymentReminderService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly clientService: ClientService,
    private readonly sendpulseService: SendpluseService,
    private readonly globalService: GlobalService
  ) { }

  async runCronApis(id: number) {
    if (id == 1) {
      this.log.log("Running 9AM via API");
      await this.runPaymentScheduler(true);
    } else {
      this.log.log("Running 2PM via API");
      await this.runPaymentScheduler(false);
    }
  }
  // Combodia 9AM or UTC 2AM (combodia is 7 hour ahead of UTC)
  @Cron('0 2 * * *')
  async morningTimeScheduler() {
    this.log.log("Cron Running 9AM scheduler");
    await this.runPaymentScheduler(true);
  }

  // Combodia 2PM  or UTC 7AM
  @Cron('0 7 * * *')
  async dayTimeScheduler() {
    this.log.log("Cron Running 2PM scheduler");
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
            flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['23_DAYS'];
            break;
          case 16:
            flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['16_DAYS'];
            break;
          case 9:
            flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['9_DAYS'];
            break;
          case 2:
            flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['2_DAYS'];
            break;
          case 1:
            flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['1_DAY'];
            break;
          case 0:
            if (isMorning)
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['0_DAY_MORNING'];
            else
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['0_DAY_EVENING'];
            break;
          case -1:
            if (isMorning)
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['-1_DAY_MORNING'];
            else
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['-1_DAY_EVENING'];
            break;
          case -2:
            if (isMorning)
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['-2_DAYS_MORNING'];
            else
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['-2_DAYS_EVENING'];
            break;
          case -3:
            if (isMorning)
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['-3_DAYS_MORNING'];
            else
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID['-3_DAYS_EVENING'];
            break;
          default:
            //FIXME: update flow ID
            if (remainingDays < -3)
              flow.flow_id = this.globalService.SENDPULSE_FLOW.REMINDER_FLOW_ID.OLDER_THAN_3DAYS;
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
