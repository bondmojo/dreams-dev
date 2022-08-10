export class DreamerModel {
    id: string;
    externalId: string;
    firstName: string;
    lastName: string;
    name: string;
    loanRequest: LoanRequest;
}

export class LoanRequest {
    amount: number;
    pointsAmount: number;
    purpose: string;
}
