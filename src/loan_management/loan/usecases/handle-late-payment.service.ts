import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { CustomLogger } from 'src/custom_logger';
import { Loan } from '../entities/loan.entity';
import { Repository, Not, LessThan, Between } from 'typeorm';
import { addDays, subDays, differenceInDays, startOfDay, endOfDay, format } from "date-fns";
import { GlobalService } from "../../../globals/usecases/global.service";
import { ZohoLoanHelperService } from "./zoho-loan-helper.service";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { HandlePaymentDueLoansDto } from '../dto';


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
    this.log.log(`API Call to Run Handle Expired Loan Payment Status with Data =  ${JSON.stringify(handlePaymentDueLoansDto)}`);
    const days_for_consider_payment_due = handlePaymentDueLoansDto.days_for_consider_payment_due ?? 4;
    await this.handlePaymentDueLoans(days_for_consider_payment_due);
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

  }

  async fetchCustomersByDueDate(dueDate: Date): Promise<Loan[] | null> {
    this.log.log("FETCHing Clients with Due date =" + dueDate);
    const loansPromise = await this.loanRepository.find({
      where: {
        repayment_date: Between(startOfDay(dueDate), endOfDay(dueDate)),
        status: Not("Fully Paid")
      },
      relations: ['client']
    });
    this.log.log("Due Date loans=" + JSON.stringify(loansPromise) + dueDate);
    return loansPromise;
  }

  async updateLoanDataInDB(loan: Loan) {
    const fields_to_be_update: object = {
      payment_status: this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_DUE,
    }
    this.log.log(`Updating Database Loan Data For Loan = ${loan.id} `);
    await this.loanRepository.update(loan.id, fields_to_be_update);
  }

  async updateLoanDataInZoho(loan: Loan) {
    const zohoKeyValuePairs = {
      Payment_Status: new Choice(this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_DUE),
    };
    this.log.log(`Updating Zoho Loan Data For Loan ID = ${loan.id}`);
    await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
  }


}
