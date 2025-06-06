import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { CustomLogger } from 'src/custom_logger';
import { Loan } from '../entities/loan.entity';
import { Repository, Not, LessThanOrEqual, Between, In, IsNull } from 'typeorm';
import { addDays, subDays, differenceInDays, startOfDay, endOfDay, format } from "date-fns";
import { GlobalService } from "../../../globals/usecases/global.service";
import { ZohoLoanHelperService } from "./zoho-loan-helper.service";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { HandlePaymentDueLoansDto } from '../dto';
import { MethodParamsRespLogger } from 'src/decorator';

@Injectable()
export class HandleLatePaymentService {
  private readonly log = new CustomLogger(HandleLatePaymentService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly zohoLoanHelperService: ZohoLoanHelperService,
    private readonly globalService: GlobalService
  ) { }

  async runHandlePaymentDueLoansCron(handlePaymentDueLoansDto: HandlePaymentDueLoansDto) {
    const days_for_consider_payment_due = handlePaymentDueLoansDto.days_for_consider_payment_due ?? 4;
    return await this.handlePaymentDueLoans(days_for_consider_payment_due);
  }

  // Combodia 6AM or UTC 23PM (combodia is 7 hour ahead of UTC)
  @Cron('0 23 * * *')
  async timeScheduler() {
    this.log.log("Cron Run Handle Expired Loan Payment Status");
    const days_for_consider_payment_due = 4;
    await this.handlePaymentDueLoans(days_for_consider_payment_due);
  }

  async handlePaymentDueLoans(days_for_consider_payment_due: number) {
    this.log.log("Function Running handleExpiredLoanPaymentStatus with days_for_consider_payment_due =", days_for_consider_payment_due);
    const today = new Date();
    const dueDate = subDays(today, days_for_consider_payment_due);
    console.log("dueDate :: ", dueDate);
    const loans = await this.fetchCustomersByDueDate(dueDate);
    // Update all loan status
    for (let i = 0; i < loans.length; i++) {
      this.updateLoanDataInDB(loans[i]);
      this.updateLoanDataInZoho(loans[i]);
    }

    return 'Done'
  }

  async fetchCustomersByDueDate(dueDate: Date): Promise<Loan[] | null> {
    const loansPromise = await this.loanRepository.find({
      where: [{
        repayment_date: LessThanOrEqual(dueDate),
        status: In([this.globalService.LOAN_STATUS.DISBURSED]),
        payment_status: Not(this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_DUE),
      }, {
        repayment_date: LessThanOrEqual(dueDate),
        status: In([this.globalService.LOAN_STATUS.DISBURSED]),
        payment_status: IsNull(),
      }
      ],
      relations: ['client']
    });
    return loansPromise;
  }

  async updateLoanDataInDB(loan: Loan) {
    const fields_to_be_update: object = {
      payment_status: this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_DUE,
    }
    return await this.loanRepository.update(loan.id, fields_to_be_update);
  }

  async updateLoanDataInZoho(loan: Loan) {
    const zohoKeyValuePairs = {
      Payment_Status: new Choice(this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_DUE),
    };
    return await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
  }


}
