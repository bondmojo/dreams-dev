import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from 'src/custom_logger';
import {
  Repository,
  Not,
  LessThanOrEqual,
  LessThan,
  Between,
  In,
  IsNull,
} from 'typeorm';
import {
  addDays,
  subDays,
  differenceInDays,
  startOfDay,
  endOfDay,
  format,
  compareAsc,
  differenceInMonths,
} from 'date-fns';
import { GlobalService } from '../../../globals/usecases/global.service';
import { ZohoRepaymentScheduleHelper } from './ZohoRepaymentScheduleHelper';
import { Choice } from '@zohocrm/typescript-sdk-2.0/utils/util/choice';
import { UpdateRepaymentDateDto } from '../dto';
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { LoanService } from 'src/loan_management/loan/usecases/loan.service';
@Injectable()
export class UpdateRepaymentDateUsecase {
  private readonly log = new CustomLogger(UpdateRepaymentDateUsecase.name);

  constructor(
    @InjectRepository(RepaymentSchedule)
    private readonly RepaymentScheduleRepository: Repository<RepaymentSchedule>,
    private readonly zohoRepaymentScheduleHelper: ZohoRepaymentScheduleHelper,
    private readonly globalService: GlobalService,
    private readonly loanService: LoanService,
  ) {}

  async updateRepaymentDate(updateRepaymentDateDto: UpdateRepaymentDateDto) {
    try {
      const unpaid_instaments = await this.RepaymentScheduleRepository.find({
        where: {
          loan_id: updateRepaymentDateDto.loan_id,
          scheduling_status: LessThan(
            this.globalService.INSTALMENT_SCHEDULING_STATUS.COMPLETED,
          ),
        },
        relations: ['loan'],
        order: { ['ins_number']: 'ASC' },
      });
      const loan = await this.loanService.findOneForInternalUse({
        id: updateRepaymentDateDto.loan_id,
      });

      this.doValidate(loan, unpaid_instaments, updateRepaymentDateDto);

      await this.updateInstalmentDataInDB(
        loan,
        unpaid_instaments,
        updateRepaymentDateDto,
      );
      return 'Loan Reschedule Successfully!';
    } catch (error) {
      this.log.error(
        `UPDATE REPAYMENT DATE SERVICE: ERROR OCCURED WHILE RUNNING updateRepaymentDate:  ${error}`,
      );
      return error;
    }
  }

  getScheduleInstalment(instalments: RepaymentSchedule[]): RepaymentSchedule {
    return instalments.find(
      (e: RepaymentSchedule) =>
        e.scheduling_status ==
        this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED,
    );
  }

  doValidate(
    loan: any,
    instalments: RepaymentSchedule[],
    updateRepaymentDateDto: any,
  ) {
    if (!loan) {
      throw new HttpException(
        `Loan not found for ${updateRepaymentDateDto.loan_id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (loan.status == this.globalService.LOAN_STATUS.FULLY_PAID) {
      throw new HttpException(
        `Can't update repayment date of fully paid Loan ${updateRepaymentDateDto.loan_id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const scheduled_instalment = this.getScheduleInstalment(instalments);
    if (!scheduled_instalment) {
      throw new HttpException(
        `No scheduled instalment found for ${updateRepaymentDateDto.loan_id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      compareAsc(
        new Date(updateRepaymentDateDto.repayment_date),
        new Date(scheduled_instalment.due_date),
      ) != 1
    ) {
      throw new HttpException(
        `New Repayment Date should be greater then instalment due date  ${scheduled_instalment.id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return true;
  }

  async updateInstalmentDataInDB(
    loan: any,
    instalments: any,
    updateRepaymentDateDto: UpdateRepaymentDateDto,
  ) {
    const first_ins = instalments[0];
    const new_repayment_date = updateRepaymentDateDto.repayment_date;
    const current_repayment_date = first_ins.due_date;
    const first_repayment_date =
      first_ins.previous_repayment_dates &&
      first_ins.previous_repayment_dates.length
        ? first_ins.previous_repayment_dates[0]
        : current_repayment_date;

    if (
      compareAsc(
        new Date(new_repayment_date),
        new Date(current_repayment_date),
      ) != 1
    ) {
      throw new HttpException(
        `New Repayment Date should be greater then last repayment date  ${first_ins.id}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let ins_additional_fee = Number(first_ins.ins_additional_fee);

    let number_of_penalties = Number(first_ins.number_of_penalties);
    let ins_overdue_amount = Number(first_ins.ins_overdue_amount);

    const difference_in_month =
      differenceInMonths(
        new Date(new_repayment_date),
        addDays(new Date(current_repayment_date), 1),
      ) + 1;
    const extra_fee_charges =
      difference_in_month * this.globalService.INSTALMENT_LATE_FEE_EACH_MONTH;
    number_of_penalties = number_of_penalties + difference_in_month;
    ins_additional_fee = ins_additional_fee + extra_fee_charges;
    ins_overdue_amount = ins_overdue_amount + extra_fee_charges;

    const previous_repayment_dates = first_ins.previous_repayment_dates ?? [];
    previous_repayment_dates.push(current_repayment_date);

    // Fields to be update
    first_ins.number_of_penalties = number_of_penalties;
    (first_ins.previous_repayment_dates = previous_repayment_dates),
      (first_ins.ins_overdue_amount = ins_overdue_amount);
    first_ins.ins_additional_fee = ins_additional_fee;
    first_ins.due_date = new_repayment_date;
    first_ins.repayment_status =
      this.globalService.INSTALMENT_PAYMENT_STATUS.PAYMENT_RESCHEDULED;
    await this.RepaymentScheduleRepository.save(first_ins);

    // Update dates for next all instalment
    // for (let index = 1; index < instalments.length; index++) {
    //   const instalment = instalments[index];

    // }
    // const new_repayment_date = updateRepaymentDateDto.repayment_date;
    // const current_repayment_date = loan.repayment_date;
    // const first_repayment_date = (loan.previous_repayment_dates && loan.previous_repayment_dates.length) ? loan.previous_repayment_dates[0] : current_repayment_date;

    // if (compareAsc(new Date(new_repayment_date), new Date(first_repayment_date)) != 1) {
    //   throw new HttpException(`New Repayment Date should be greater then first repayment date  ${loan.id}`, HttpStatus.BAD_REQUEST);
    // }

    // let late_fee = loan.late_fee;
    // let late_fee_applied_count = loan.late_fee_applied_count;
    // let outstanding_amount = loan.outstanding_amount;

    // /**
    //  * 1. $3 fee applied on each month from repayment date.
    //  * 2. We will not charge extra $3 if repayment date reschedule multiple time in same month.
    //  * 3. Total month from loan disbursement is used to calculate late fee($3 * months).
    //  * 4. late_fee_applied_count = total_months_from_loan_disbursement (as we charge late fee monthly).
    //  * 5. Below we add ONE day in first_repayment_date to find difference becuase we charge on next day of repayment date of month
    //  * (for example if repayment date is 5th Dec then we will charge late fee from 6th december).
    //  * 6. Below we add ONE in total_months_from_loan_disbursement becuase fee should apply from the next day of repayment date
    //  * but the differenceInMonths function will give 0 when we compare 5th Dec with 6th Dec so we added one in total.
    //  */

    // const total_months_from_loan_disbursement = differenceInMonths(new Date(new_repayment_date), addDays(new Date(first_repayment_date), 1)) + 1;

    // if (total_months_from_loan_disbursement > loan.late_fee_applied_count) {
    //   const extra_fee_charges = (total_months_from_loan_disbursement - loan.late_fee_applied_count) * this.globalService.LOAN_LATE_FEE_EACH_MONTH;
    //   late_fee_applied_count = total_months_from_loan_disbursement;
    //   late_fee = late_fee + extra_fee_charges;
    //   outstanding_amount = outstanding_amount + extra_fee_charges;
    // }

    // const previous_repayment_dates = loan.previous_repayment_dates ?? [];
    // previous_repayment_dates.push(current_repayment_date);

    // const fields_to_be_update: object = {
    //   late_fee_applied_count: late_fee_applied_count,
    //   previous_repayment_dates: previous_repayment_dates,
    //   outstanding_amount: outstanding_amount,
    //   late_fee: late_fee,
    //   repayment_date: new_repayment_date,
    //   payment_status: this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_RESCHEDULED
    // }

    // this.log.log(`Updating Database Loan Data For Loan = ${loan.id} ${JSON.stringify(fields_to_be_update)} `);
    // await this.loanRepository.update(loan.id, fields_to_be_update);
  }

  // async fetchtLoan(id: string): Promise<Loan | null> {
  //   const loan = await this.loanRepository.findOne({ where: { id } });
  //   if (!loan) {
  //     throw new HttpException(`No Loan Found For ${id}`, HttpStatus.BAD_REQUEST);
  //   }
  //   if (loan.status == this.globalService.LOAN_STATUS.FULLY_PAID) {
  //     throw new HttpException(`Can not update repayment date of fully paid loan ${loan.id}`, HttpStatus.BAD_REQUEST);
  //   }

  //   this.log.log("Loan which repayment date needs rescheduling =" + JSON.stringify(loan));
  //   return loan;
  // }

  // async updateLoanDataInDB(loan: Loan, updateRepaymentDateDto: UpdateRepaymentDateDto) {
  //   const new_repayment_date = updateRepaymentDateDto.repayment_date;
  //   const current_repayment_date = loan.repayment_date;
  //   const first_repayment_date = (loan.previous_repayment_dates && loan.previous_repayment_dates.length) ? loan.previous_repayment_dates[0] : current_repayment_date;

  //   if (compareAsc(new Date(new_repayment_date), new Date(first_repayment_date)) != 1) {
  //     throw new HttpException(`New Repayment Date should be greater then first repayment date  ${loan.id}`, HttpStatus.BAD_REQUEST);
  //   }

  //   let late_fee = loan.late_fee;
  //   let late_fee_applied_count = loan.late_fee_applied_count;
  //   let outstanding_amount = loan.outstanding_amount;

  //   /**
  //    * 1. $3 fee applied on each month from repayment date.
  //    * 2. We will not charge extra $3 if repayment date reschedule multiple time in same month.
  //    * 3. Total month from loan disbursement is used to calculate late fee($3 * months).
  //    * 4. late_fee_applied_count = total_months_from_loan_disbursement (as we charge late fee monthly).
  //    * 5. Below we add ONE day in first_repayment_date to find difference becuase we charge on next day of repayment date of month
  //    * (for example if repayment date is 5th Dec then we will charge late fee from 6th december).
  //    * 6. Below we add ONE in total_months_from_loan_disbursement becuase fee should apply from the next day of repayment date
  //    * but the differenceInMonths function will give 0 when we compare 5th Dec with 6th Dec so we added one in total.
  //    */

  //   const total_months_from_loan_disbursement = differenceInMonths(new Date(new_repayment_date), addDays(new Date(first_repayment_date), 1)) + 1;

  //   if (total_months_from_loan_disbursement > loan.late_fee_applied_count) {
  //     const extra_fee_charges = (total_months_from_loan_disbursement - loan.late_fee_applied_count) * this.globalService.LOAN_LATE_FEE_EACH_MONTH;
  //     late_fee_applied_count = total_months_from_loan_disbursement;
  //     late_fee = late_fee + extra_fee_charges;
  //     outstanding_amount = outstanding_amount + extra_fee_charges;
  //   }

  //   const previous_repayment_dates = loan.previous_repayment_dates ?? [];
  //   previous_repayment_dates.push(current_repayment_date);

  //   const fields_to_be_update: object = {
  //     late_fee_applied_count: late_fee_applied_count,
  //     previous_repayment_dates: previous_repayment_dates,
  //     outstanding_amount: outstanding_amount,
  //     late_fee: late_fee,
  //     repayment_date: new_repayment_date,
  //     payment_status: this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_RESCHEDULED
  //   }

  //   this.log.log(`Updating Database Loan Data For Loan = ${loan.id} ${JSON.stringify(fields_to_be_update)} `);
  //   await this.loanRepository.update(loan.id, fields_to_be_update);
  // }

  // async updateLoanDataInZoho(loan: Loan, updateRepaymentDateDto: UpdateRepaymentDateDto) {
  //   const latest_loan = await this.loanRepository.findOne({ where: { id: loan.id } });
  //   let previous_repayment_dates: any = latest_loan.previous_repayment_dates;
  //   previous_repayment_dates = (previous_repayment_dates.toString()).replace(/,/g, " \n ");

  //   const zohoKeyValuePairs = {
  //     Payment_Status: new Choice(this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_RESCHEDULED),
  //     Previous_Repayment_Dates: previous_repayment_dates,
  //     Outstanding_Balance: latest_loan.outstanding_amount,
  //     Late_Fee: latest_loan.late_fee
  //   };
  //   // await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
  // }
}
