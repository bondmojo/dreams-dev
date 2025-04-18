import {
  ConsoleLogger,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from '../../../custom_logger';
import { RepaymentSchedule } from '../entities/repayment_schedule.entity';
import { Repository, FindOptionsWhere } from 'typeorm';
import { UpdateRepaymentScheduleDto, GetInstalmentDto } from '../dto';
import { GlobalService } from 'src/globals/usecases/global.service';
import { differenceInCalendarDays, format } from 'date-fns';

@Injectable()
export class RepaymentScheduleService {
  private readonly log = new CustomLogger(RepaymentScheduleService.name);
  constructor(
    @InjectRepository(RepaymentSchedule)
    private readonly repaymentScheduleRepository: Repository<RepaymentSchedule>,
    private readonly globalService: GlobalService,
  ) {}

  async findOne(fields: FindOptionsWhere<RepaymentSchedule>): Promise<any> {
    const instalment = await this.repaymentScheduleRepository.findOne({
      where: fields,
      order: { ['created_at']: 'DESC' },
    });
    return instalment;
  }

  async update(updateRepaymentScheduleDto: UpdateRepaymentScheduleDto) {
    this.log.log(
      `Updating Repayment Schedule with data ${JSON.stringify(
        updateRepaymentScheduleDto,
      )}`,
    );
    await this.repaymentScheduleRepository.update(
      updateRepaymentScheduleDto.id,
      updateRepaymentScheduleDto,
    );
  }

  async save(repayment_schedule_model: any): Promise<any> {
    return await this.repaymentScheduleRepository.save(
      repayment_schedule_model,
    );
  }

  async find(
    fields: FindOptionsWhere<RepaymentSchedule>,
    relations: Array<string> = [],
    order: object = { ['created_at']: 'DESC' },
  ): Promise<any> {
    const installments = await this.repaymentScheduleRepository.find({
      where: fields,
      relations: relations,
      order: order,
    });
    return installments;
  }

  async getInstalment(getInstalmentDto: GetInstalmentDto): Promise<any> {
    try {
      const today = new Date();
      const [instalment] = await this.find(getInstalmentDto);

      if (!instalment) {
        throw new NotFoundException('Instalment Not Found');
      }

      // For Reminder Message: adding overdue days to installment
      let overdue_days = differenceInCalendarDays(
        today,
        new Date(instalment.due_date),
      );
      // Set overdue_days to 0 when value is negative (when today is greater then due date)
      overdue_days = overdue_days < 0 ? 0 : overdue_days;

      // Format instalment due date
      instalment.due_date = format(new Date(instalment.due_date), 'dd-MM-yyyy');

      // appending other variable in instalment response
      const response = { ...instalment, overdue_days };

      return response;
    } catch (error) {
      this.log.error(`ERROR OCCURED WHILE RUNNING getInstalment:  ${error}`);
      throw new HttpException(
        {
          status: HttpStatus.EXPECTATION_FAILED,
          error: `Error in get Instalment  ${error}`,
        },
        HttpStatus.EXPECTATION_FAILED,
      );
    }
  }

  async getPaymentPlanMsg(loan_id: string): Promise<object> {
    const installments = await this.find({ loan_id }, [], {
      ['due_date']: 'ASC',
    });
    let payment_plan_msg = '';
    for (let i = 0; i < installments.length; i++) {
      const formatted_due_date = format(
        new Date(installments[i].due_date),
        'dd-MM-yyyy',
      );
      if (installments[i].ins_overdue_amount == 0) {
        // strikethrough instalment if overdue is zero
        payment_plan_msg =
          payment_plan_msg +
          `<del>$${installments[i].ins_overdue_amount} - ${formatted_due_date}</del>`;
      } else {
        payment_plan_msg =
          payment_plan_msg +
          `$${installments[i].ins_overdue_amount} - ${formatted_due_date} `;
      }
      if (i < installments.length) {
        payment_plan_msg += '\n';
      }
    }

    return {
      payment_plan: payment_plan_msg,
    };
  }

  async updateLastPaymentReceiptDate(
    client_id: string,
    last_payment_receipt_date: Date,
  ): Promise<any> {
    try {
      // Update scheduled instalment last payment received receipt date
      const repayment_schedule_model = await this.findOne({
        client_id: client_id,
        scheduling_status:
          this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED,
      });
      repayment_schedule_model.last_payment_receipt_date =
        last_payment_receipt_date;
      return await this.repaymentScheduleRepository.save(
        repayment_schedule_model,
      );
    } catch (error) {
      this.log.error(
        `MEMBERSHIP SERVICE ERROR: ERROR OCCURED WHILE RUNNING refundDreamPoint:  ${error}`,
      );
    }
  }
}
