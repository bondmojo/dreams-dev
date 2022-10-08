export class CreateRepaymentTransactionDto {
  loan_id: string;
  currency?: string;
  amount: number;
  type: string;
  note: string;
}
