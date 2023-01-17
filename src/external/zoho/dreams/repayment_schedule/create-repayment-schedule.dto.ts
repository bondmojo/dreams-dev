export class CreateRepaymentScheduleDto {
  lmsLoanId: string;
  lmsRepaymentScheduleId: string;
  overdueAmount: string;
  instalmentNumber: number;
  repaymentStatus: string;
  payment: string;
  paymentVia: string;
  outstanding_amount: number;
  sendpulse_url: string;
  retool_url: string;
  disbursed_amount: number;
  additional_fee: number;
  //loanOwner: string;
}
