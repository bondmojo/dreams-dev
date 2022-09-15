export class HandleApplicationStateChangeRequestDto {
sendpulse_user_id: string;
message: string;
loan_amount: number;
application_status: string;
client : ClientRequestDto;
}

export class ClientRequestDto{
    //Create LMS ID
    zoho_dreamer_id: string;
    sendpulse_user_id: string;
    first_name: string;
    last_name: string;
    full_name_en: string;
    nickname: string;
    dob_on_document: Date;
    mobile_number: string;
    bank_provider_type: string;
    bank_acc_number: string;
    additonal_note: string;
}
