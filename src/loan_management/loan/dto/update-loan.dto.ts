export class UpdateLoanDto {
  id: string;
  client_id: string;
  amount: number;
  dream_point: number;
  status: string;
  paid_date: Date;
  outstanding_amount: number;
  sendpulse_user_id: string;
  payment_status: string;
}
