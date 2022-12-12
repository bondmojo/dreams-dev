export class SendPulseContactDto {
    id: string;
    bot_id: string;
    status: number;
    type: number;
    channel_data: TelegramDataDto;
    variables: any;
}

export class TelegramDataDto {
    username: string;
    first_name: string;
    last_name: string;
    name: string;
    language_code: string;
}
