export class CreateTransactionDto {
  id: string;
  loan_id: string;
  amount: number;
  type: string;
  currency: string;
  note: string;
  image: string;
  created_date: Date;
}
