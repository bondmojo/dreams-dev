export class DreamerModel {
    id: string;
    externalId: string;
    external_data: {};
    firstName: string;
    lastName: string;
    name: string;
    loanRequest: LoanRequest;
    utmSorce: string;
    utmMedium: string;
    utmCampaign: string;
    status: any;
}

export class LoanRequest {
    amount: number;
    pointsAmount: number;
    purpose: string;
}
