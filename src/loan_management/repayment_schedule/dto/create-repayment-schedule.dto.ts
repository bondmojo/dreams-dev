export class CreateRepaymentScheduleDto {
  loan_id: string;
  client_id: string;
  loan_amount: number;
  loan_tenure_in_months: number;
  zoho_loan_id: string;
  wing_wei_luy_transfer_fee: number;
}