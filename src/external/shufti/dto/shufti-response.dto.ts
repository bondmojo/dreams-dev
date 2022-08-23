export class ShuftiResponseDto {
    reference: string;
    event: string;
    verification_url: string;
    country: string;
    declined_reason: string;
    verification_data: VerificationDataDto;
    proofs: Proofs;
}

export class Proofs{
    document: ProofItem;
    face: ProofItem;
}

export class ProofItem {
    proof: string;
}

export class VerificationDataDto {
    document: DocumentDto
}

export class DocumentDto {
    name: NameDto;
    dob: string;
    expiry_date: string;
    document_number: string;
    gender: string;
    face_match_confidence: string;
}

export class NameDto {
    first_name: string;
    last_name: string;
    full_name: string;
}
