export class DreamerModel {
    id: string;
    externalId: string;
    external_data: {};
    firstName: string;
    lastName: string;
    name: string;
    loanRequest: LoanRequest;
    status: any;
    sendpulse_url: string;
    utmSorce: string;
    utmMedium: string;
    utmCampaign: string;
    telegram_id: string;
    tenure: string;
    tenureType: string;
}

export class LoanRequest {
    amount: number;
    pointsAmount: number;
    purpose: string;
}
