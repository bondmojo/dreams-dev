export class CreateLoanDto {
  id: string;
  client_id: string;
  amount: number;
  dream_point: number;
  status: string;
  created_date: Date;
  disbursed_date: Date;
  paid_date: Date;
  tenure_in_months: number;
}
