export class CreateClientAndLoanDto {
  // Client Fields
  id: string;
  zoho_id: string;
  sendpulse_id: string;
  first: string;
  last: string;
  full_en: string;
  nickname: string;
  dob: Date;
  mobile: string;
  acc_provider_type: string;
  acc_number: string;
  acc_note: string;
  summary_loanCycle: number;
  summary_has_loan_in_arrear: string;
  summary_membership_level: string;
  acc_update_date: string;
  dream_points_earned: number;
  dream_points_committed: number;
  street: string;
  village: string;
  commune: string; //User’s Commune (Current Living Location)
  district: string;
  province: string;
  national_id: string;
  house_no: string;
  utm_source: string;
  utm_campaign: string;
  utm_medium: string;
  telegram_id: string;
  // Loan Fields
  client_id: string;
  amount: number;
  dream_point: number;
  status: string;
  created_date: Date;
  disbursed_date: Date;
  paid_date: Date;
  tenure: number;
  tenure_type: string;
  wire_transfer_type: string;

  //other Fields
  do_create_zoho_loan: boolean;
}