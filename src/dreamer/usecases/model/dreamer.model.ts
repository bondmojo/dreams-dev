export class DreamerModel {
    id: string;
    externalId: string;
    external_data: {};
    firstName: string;
    lastName: string;
    name: string;
    loanRequest: LoanRequest;
    status: string;
}

export class LoanRequest {
    amount: number;
    pointsAmount: number;
    purpose: string;
}
