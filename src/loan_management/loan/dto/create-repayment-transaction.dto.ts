export class CreateRepaymentTransactionDto {
  loan_id: string;
  currency?: string;
  amount: number;
  image: string;
  type: string;
  note: string;
}
