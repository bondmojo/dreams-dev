export class RepaymentScheduleModel {
    id: string;
    instalment_number: number;
    loan_id: string;
    client_id: string;
    ins_overdue_amount: number;
    ins_principal_amount: number;
    ins_membership_fee: number;
    ins_additional_fee: number;
    total_paid_amount: number;
    repayment_status: string;
    grace_period: number;
    number_of_penalties: number;
    previous_repayment_dates?: object[];
    ins_from_date: Date;
    ins_to_date: Date;
    due_date: Date;
    zoho_loan_id: string;
    scheduling_status: string;
}