import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from 'src/custom_logger';
import { Repository, LessThan } from 'typeorm';
import { addDays, compareAsc, differenceInMonths, addMonths } from 'date-fns';
import { GlobalService } from '../../../globals/usecases/global.service';
import { UpdateRepaymentDateDto } from '../dto';
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { LoanService } from 'src/loan_management/loan/usecases/loan.service';
@Injectable()
export class UpdateRepaymentDateUsecase {
  private readonly log = new CustomLogger(UpdateRepaymentDateUsecase.name);

  constructor(
    @InjectRepository(RepaymentSchedule)
    private readonly RepaymentScheduleRepository: Repository<RepaymentSchedule>,
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

  getScheduleInstalment(
    instalments: RepaymentSchedule[],
    instalment_id: string,
  ): RepaymentSchedule {
    return instalments.find(
      (e: RepaymentSchedule) =>
        e.scheduling_status ==
          this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED &&
        e.id == instalment_id,
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
    if (loan.status == this.globalService.LOAN_STATUS.FULLY_PAID) {
      throw new HttpException(
        `Can't update repayment date of fully paid Loan ${updateRepaymentDateDto.loan_id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const instalment = this.getScheduleInstalment(
      instalments,
      updateRepaymentDateDto.instalment_id,
    );
    if (!instalment) {
      throw new HttpException(
        `No scheduled instalment found for ${updateRepaymentDateDto.instalment_id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      compareAsc(
        new Date(updateRepaymentDateDto.repayment_date),
        new Date(instalment.due_date),
      ) != 1
    ) {
      throw new HttpException(
        `New Repayment Date should be greater then instalment due date  ${instalment.id}`,
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
    // /**
    //  * 1. First instalment is scheudle instalment.
    //  * 2. $3 fee applied on each time repayment date update.
    //  * 3. We will charge extra $3 if repayment date reschedule multiple time in same month.
    //  * (for example if repayment date is 5th Dec then we will charge late fee from 6th december).
    //  */

    const ScheduleInstalment = instalments[0];
    const ScheduleInsNewRepaymentDate = updateRepaymentDateDto.repayment_date;
    const ScheduleInsCurRepaymentDate = ScheduleInstalment.due_date;

    const differenceInMonth =
      differenceInMonths(
        new Date(ScheduleInsNewRepaymentDate),
        addDays(new Date(ScheduleInsCurRepaymentDate), 1),
      ) + 1;

    const extraFeeCharges =
      differenceInMonth * this.globalService.INSTALMENT_LATE_FEE_EACH_MONTH;

    const updatedInstalments = instalments.map(
      (instalment: any, index: any) => {
        if (index === 0) {
          // Schedule Instlaments
          return {
            ...instalment,
            number_of_penalties:
              Number(instalment.number_of_penalties) + differenceInMonth,
            previous_repayment_dates: [
              ...(instalment.previous_repayment_dates || []),
              ScheduleInsCurRepaymentDate,
            ],
            ins_overdue_amount:
              Number(instalment.ins_overdue_amount) + extraFeeCharges,
            ins_additional_fee:
              Number(instalment.ins_additional_fee) + extraFeeCharges,
            due_date: ScheduleInsNewRepaymentDate,
            repayment_status:
              this.globalService.INSTALMENT_PAYMENT_STATUS.PAYMENT_RESCHEDULED,
          };
        } else {
          // Not Schedule Instlaments
          return {
            ...instalment,
            due_date: addMonths(new Date(ScheduleInsNewRepaymentDate), index),
          };
        }
      },
    );

    await this.RepaymentScheduleRepository.save(updatedInstalments);
    const last_ins_due_date =
      updatedInstalments[updatedInstalments.length - 1].due_date;
    //  update loan after rescheduling
    await this.updateLoanFields({
      loan,
      extraFeeCharges,
      differenceInMonth,
      last_ins_due_date,
    });
  }

  async updateLoanFields({
    loan,
    extraFeeCharges,
    differenceInMonth,
    last_ins_due_date,
  }: any) {
    loan.late_fee = loan.late_fee + extraFeeCharges;
    loan.late_fee_applied_count =
      loan.late_fee_applied_count + differenceInMonth;
    loan.previous_repayment_dates = [
      ...(loan.previous_repayment_dates || []),
      loan.repayment_date,
    ];
    loan.outstanding_amount = loan.outstanding_amount + extraFeeCharges;
    loan.repayment_date = last_ins_due_date;
    loan.payment_status =
      this.globalService.LOAN_PAYMENT_STATUS.PAYMENT_RESCHEDULED;

    this.loanService.save(loan);
  }
}
