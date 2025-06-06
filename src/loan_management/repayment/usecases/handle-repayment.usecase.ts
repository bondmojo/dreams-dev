import { LessThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ProcessRepaymentDto } from '../dto';
import { Loan } from '../../loan/entities/loan.entity';
import { compareAsc, startOfDay, addDays } from 'date-fns';
import { LoanService } from '../../loan/usecases/loan.service';
import { GlobalService } from '../../../globals/usecases/global.service';
import { ClientService } from 'src/loan_management/client/usecases/client.service';
import { TransactionService } from '../../transaction/usecases/transaction.service';
import { ZohoRepaymentHelperService } from '../services/zoho-repayment-helper.service';
import { RepaymentScheduleService } from 'src/loan_management/repayment_schedule/usecases/repayment_schedule.service';
import { SendpluseService } from 'src/external/sendpulse/sendpluse.service';
import { DreamerModel } from 'src/external/zoho/dreams/dreamer/usecases/model/dreamer.model';
@Injectable()
export abstract class HandleRepaymentUsecase {
  constructor(
    public readonly loanService: LoanService,
    public readonly clientService: ClientService,
    public readonly globalService: GlobalService,
    public readonly transactionService: TransactionService,
    public readonly repaymentScheduleService: RepaymentScheduleService,
    public readonly zohoRepaymentHelperService: ZohoRepaymentHelperService,
    public readonly sendpulseService: SendpluseService,
  ) {}
  abstract process(processRepaymentDto: ProcessRepaymentDto): Promise<any>;

  async isLoanFullyPaid(loan_id: string): Promise<boolean> {
    const unpaid_instalment = await this.repaymentScheduleService.findOne({
      loan_id: loan_id,
      scheduling_status: LessThan(
        this.globalService.INSTALMENT_SCHEDULING_STATUS.COMPLETED,
      ),
    });
    if (unpaid_instalment) {
      return false;
    }
    return true;
  }

  async getLoanPaymentStatus(loan: Loan): Promise<string> {
    const last_instalment = await this.repaymentScheduleService.findOne({
      loan_id: loan.id,
      ins_number: loan.tenure,
      scheduling_status:
        this.globalService.INSTALMENT_SCHEDULING_STATUS.COMPLETED,
    });
    if (!last_instalment) {
      return this.globalService.LOAN_PAYMENT_STATUS.PENDING;
    }
    const grace_repayment_date = addDays(
      new Date(last_instalment.due_date),
      this.globalService.INSTALMENT_GRACE_PERIOD_DAYS,
    );
    const paid_date = new Date(last_instalment.paid_date);
    // payment status is late if instalment paid_date is greater then grace repayment date
    if (compareAsc(startOfDay(paid_date), grace_repayment_date) == 1) {
      return this.globalService.LOAN_PAYMENT_STATUS.PAID_LATE;
    }
    return this.globalService.LOAN_PAYMENT_STATUS.PAID_ON_TIME;
  }

  async getLoanTotalPaidAmount(loan_id: string): Promise<number> {
    return await this.transactionService.getLoanTotalPaidAmount(loan_id);
  }

  async updateIsInstalmentFullyPaidOnSendpulse(
    loan: Loan,
    isInstalmentFullyPaid: boolean,
  ) {
    await this.sendpulseService.updateSendpulseVariable({
      variable_name: 'isInstalmentFullyPaid',
      variable_id:
        this.globalService.SENDPULSE_VARIABLE_ID.IS_INSTALMENT_FULLYPAID,
      variable_value: isInstalmentFullyPaid ? 'true' : 'false',
      contact_id: loan.client.sendpulse_id,
    });
  }

  async triggerPaymentConfirmationFlow(loan: Loan) {
    const model = new DreamerModel();
    model.externalId = loan.client.sendpulse_id;
    const flow_id = this.globalService.SENDPULSE_FLOW['FLOW_7.4'];
    return await this.sendpulseService.runFlow(model, flow_id);
  }
}
