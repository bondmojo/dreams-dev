export class CreateLoanDto {
  id: string;
  client_id: string;
  amount: number;
  currency: string;
  dream_point: number;
  outstanding_balance?: number;
  status: string;
  created_date: Date;
  disbursed_date: Date;
  paid_date: Date;
  tenure: number;
  tenure_type: string;
  repayment_date: Date;
  wire_transfer_type: string;
  do_create_zoho_loan: boolean;
  sendpulse_id: string;
  membership_tier: string;
  acc_provider_type: string;
  acc_number: string;
  zoho_id: string;
}
