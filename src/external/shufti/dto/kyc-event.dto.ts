export class KycEventDto {
    dreamerId: string;
    status: KYCStatus;
    kycId: string;
    first: string;
    last: string;
    full: string;
    dob: string;
    gender: string;
    documentNumber: string;
    faceProof: string;
    documentProof: string;
    rejectionReason: string;
}

export enum KYCStatus {
    SUCCESS,
    REJECTED,
    TIMED_OUT,
    CANCELED
}
