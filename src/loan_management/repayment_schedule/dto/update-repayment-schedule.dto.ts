export class UpdateRepaymentScheduleDto {
  loan_id: string;
  client_id: string;
  id: string;
  repayment_status: string;
  scheduling_status: string;
  ins_overdue_amount: number;
  zoho_repayment_schedule_id: string;
  paid_date: Date;
}