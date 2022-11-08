export class DreamerModel {
    id: string;
    externalId: string;
    external_data: {};
    firstName: string;
    lastName: string;
    name: string;
    loanRequest: LoanRequest;
}

export class LoanRequest {
    amount: number;
    pointsAmount: number;
    purpose: string;
    utmSorce: string;
    utmMedium: string;
    utmCampaign: string;
}
