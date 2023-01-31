import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { CustomLogger } from 'src/custom_logger';
import { Loan } from '../entities/loan.entity';
import { Repository, Not, LessThan, Equal } from 'typeorm';
import { addDays, } from "date-fns";
import { ClientService } from '../../client/usecases/client.service';
import { Client } from 'src/loan_management/client/entities/client.entity';
import { SendpluseService } from 'src/external/sendpulse/sendpluse.service';
import { RunFlowModel } from 'src/external/sendpulse/model/run-flow-model';
import { GlobalService } from "../../../globals/usecases/global.service";
import { RepaymentScheduleService } from 'src/loan_management/repayment_schedule/usecases/repayment_schedule.service';
import { RepaymentSchedule } from 'src/loan_management/repayment_schedule/entities/repayment_schedule.entity';


@Injectable()
export class PaymentReminderService {
  private readonly log = new CustomLogger(PaymentReminderService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly clientService: ClientService,
    private readonly sendpulseService: SendpluseService,
    private readonly globalService: GlobalService,
    private readonly repaymentScheduleService: RepaymentScheduleService,
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

    let clients;

    if (remainingDays >= -3) {
      const remaining_days = addDays(today, remainingDays);
      clients = await this.getCustomersByInstalmentDueDate(remaining_days);
    }
    else {
      const remaining_days = addDays(today, remainingDays + 1);
      clients = await this.getCustomersWithDueDate4DayBefore(remaining_days);
    }

    if (!clients || clients.length == 0) {
      this.log.log("NO Customer Reminder to be sent");
      return;
    }

    clients.forEach(async (client) => {

      const sendpulseId = client.sendpulse_id;
      if (sendpulseId) {
        const flow = new RunFlowModel();
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

        await this.sendpulseService.runFlowV2(flow);
      }
    });
  }

  async getCustomersByInstalmentDueDate(dueDate: Date): Promise<Client[] | null> {
    this.log.log(`Fetching clients with Due date = ${dueDate}`);
    const repayment_schedules = await this.repaymentScheduleService.find({
      due_date: Equal(dueDate),
      scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED,
    }, ['client']
    );

    const clients = repayment_schedules.map((rs: Partial<RepaymentSchedule>) => rs.client);

    this.log.log("Clients By Instalment Due Date =" + JSON.stringify(clients));
    return clients;
  }


  async getCustomersWithDueDate4DayBefore(dueDate: Date): Promise<Client[] | null> {
    this.log.log(`Fetching Older Customers with Due date less than =  ${dueDate}`);
    const repayment_schedules = await this.repaymentScheduleService.find({
      due_date: LessThan(dueDate),
      scheduling_status: this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED,
    }, ['client']
    );

    const clients = repayment_schedules.map((rs: RepaymentSchedule) => rs.client);
    this.log.log("Older Customers with Due date less than " + JSON.stringify(repayment_schedules));
    return clients;
  }
}
