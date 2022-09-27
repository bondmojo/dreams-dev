export class CreateTransactionDto {
  id: string;
  loan_id: string;
  amount: number;
  type: string;
  currency: string;
  note: string;
  created_date: Date;
}
