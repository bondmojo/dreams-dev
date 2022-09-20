export class CreateClientDto {
  id: string;
  zoho_id: string;
  sendpulse_id: string;
  first: string;
  last: string;
  full_en: string;
  nickname: string;
  dob: Date;
  mobile: string;
  dream_points_earned: number;
  dream_points_committed: number;
  acc_provider_type: string;
  acc_number: string;
  acc_note: string;
  summary_loanCycle: number;
  summary_has_loan_in_arrear: string;
  summary_membership_level: string;
  acc_update_date: string;
}
